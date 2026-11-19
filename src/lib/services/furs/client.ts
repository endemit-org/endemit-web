import "server-only";

import https from "node:https";
import { randomUUID } from "node:crypto";
import { CompactSign, importPKCS8 } from "jose";
import { getFursCertificate } from "./cert";
import { formatFursDateTime } from "./zoi";
import { FURS_ENV, FURS_TLS_CA_BASE64 } from "@/lib/services/env/private";

const HOSTS = {
  test: { host: "blagajne-test.fu.gov.si", port: 9002 },
  prod: { host: "blagajne.fu.gov.si", port: 9003 },
} as const;

const BASE_PATH = "/v1/cash_registers";

function getHost() {
  return FURS_ENV === "prod" ? HOSTS.prod : HOSTS.test;
}

/** Raw HTTPS POST with the client certificate (mutual TLS). */
interface FursHttpResponse {
  status: number;
  contentType: string;
  body: string;
}

/**
 * Parse a FURS response body as JSON. A gateway in front of FURS can answer
 * 200 with an HTML page, so a parse failure reports the status, content type
 * and the start of the body instead of a bare SyntaxError.
 */
function parseJsonBody<T>(response: FursHttpResponse): T {
  try {
    return JSON.parse(response.body) as T;
  } catch {
    const excerpt = response.body.replace(/\s+/g, " ").trim().slice(0, 350);
    throw new Error(
      `FURS non-JSON response (HTTP ${response.status}, ${response.contentType || "no content-type"}): ${excerpt}`
    );
  }
}

function postJson(path: string, body: unknown): Promise<FursHttpResponse> {
  const { p12Buffer, passphrase } = getFursCertificate();
  const { host, port } = getHost();
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        host,
        port,
        path: `${BASE_PATH}${path}`,
        method: "POST",
        pfx: p12Buffer,
        passphrase,
        ...(FURS_TLS_CA_BASE64 && {
          ca: Buffer.from(FURS_TLS_CA_BASE64, "base64").toString("utf8"),
        }),
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 20_000,
      },
      response => {
        let data = "";
        response.on("data", chunk => (data += chunk));
        response.on("end", () =>
          resolve({
            status: response.statusCode ?? 0,
            contentType: String(response.headers["content-type"] ?? ""),
            body: data,
          })
        );
      }
    );
    request.on("timeout", () => {
      request.destroy(new Error("FURS request timed out"));
    });
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

/** Sign a FURS message payload as a compact JWS with the fiscal certificate. */
async function signMessage(payload: object): Promise<string> {
  const { privateKeyPem, subjectName, issuerName, serial } =
    getFursCertificate();
  const key = await importPKCS8(privateKeyPem, "RS256");

  // FURS expects the certificate serial in the protected header as a number;
  // fall back to string when it exceeds the JS safe-integer range.
  const serialValue =
    Number(serial) <= Number.MAX_SAFE_INTEGER ? Number(serial) : serial;

  const jws = await new CompactSign(
    new TextEncoder().encode(JSON.stringify(payload))
  )
    .setProtectedHeader({
      alg: "RS256",
      subject_name: subjectName,
      issuer_name: issuerName,
      serial: serialValue,
    })
    .sign(key);

  return jws;
}

function decodeJwsPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid FURS response token");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
}

export function buildMessageHeader() {
  return {
    MessageID: randomUUID(),
    DateTime: formatFursDateTime(new Date()),
  };
}

/**
 * Submit an InvoiceRequest; resolves with the EOR (UniqueInvoiceID).
 * The `invoice` object must match the FURS Invoice schema.
 */
export async function submitInvoice(
  invoice: Record<string, unknown>
): Promise<string> {
  const token = await signMessage({
    InvoiceRequest: {
      Header: buildMessageHeader(),
      Invoice: invoice,
    },
  });

  const response = await postJson("/invoices", { token });
  if (response.status !== 200) {
    throw new Error(`FURS HTTP ${response.status}: ${response.body.slice(0, 300)}`);
  }

  const responseToken = parseJsonBody<{ token?: string }>(response).token;
  if (!responseToken) throw new Error("FURS response missing token");

  const payload = decodeJwsPayload(responseToken) as {
    InvoiceResponse?: {
      UniqueInvoiceID?: string;
      Error?: { ErrorCode?: string; ErrorMessage?: string };
    };
  };
  const invoiceResponse = payload.InvoiceResponse;
  if (invoiceResponse?.Error) {
    throw new Error(
      `FURS ${invoiceResponse.Error.ErrorCode}: ${invoiceResponse.Error.ErrorMessage}`
    );
  }
  if (!invoiceResponse?.UniqueInvoiceID) {
    throw new Error("FURS response missing UniqueInvoiceID");
  }
  return invoiceResponse.UniqueInvoiceID;
}

/** Register (or update) a business premise. */
export async function registerBusinessPremise(
  businessPremise: Record<string, unknown>
): Promise<void> {
  const token = await signMessage({
    BusinessPremiseRequest: {
      Header: buildMessageHeader(),
      BusinessPremise: businessPremise,
    },
  });

  const response = await postJson("/invoices/register", { token });
  if (response.status !== 200) {
    throw new Error(`FURS HTTP ${response.status}: ${response.body.slice(0, 300)}`);
  }

  const responseToken = parseJsonBody<{ token?: string }>(response).token;
  if (!responseToken) throw new Error("FURS response missing token");

  const payload = decodeJwsPayload(responseToken) as {
    BusinessPremiseResponse?: {
      Error?: { ErrorCode?: string; ErrorMessage?: string };
    };
  };
  const error = payload.BusinessPremiseResponse?.Error;
  if (error) {
    throw new Error(`FURS ${error.ErrorCode}: ${error.ErrorMessage}`);
  }
}

/** Connectivity check (no JWS involved). */
export async function echo(message = "ping"): Promise<string> {
  const response = await postJson("/echo", { EchoRequest: message });
  if (response.status !== 200) {
    throw new Error(`FURS echo HTTP ${response.status}`);
  }
  return parseJsonBody<{ EchoResponse?: string }>(response).EchoResponse ?? "";
}
