import "server-only";

import http2 from "http2";
import { getCertificates } from "./certificates";

const APNS_HOST = "https://api.push.apple.com";
const PUSH_TIMEOUT_MS = 10_000;

export interface PassPushResult {
  /** Tokens APNs reported as no longer valid (410 / BadDeviceToken) — delete them. */
  invalidTokens: string[];
}

/**
 * Sends the empty "pass changed" push Apple Wallet expects. The device then
 * asks our web service which passes changed and downloads them. Authenticated
 * with the Pass Type ID certificate; topic is the Pass Type ID.
 *
 * One short-lived HTTP/2 connection per call — volume is a handful of devices.
 */
export async function sendPassUpdatePushes(
  pushTokens: string[],
  passTypeId: string
): Promise<PassPushResult> {
  const invalidTokens: string[] = [];
  if (pushTokens.length === 0) return { invalidTokens };

  const { signerCert, signerKey } = getCertificates();
  const client = http2.connect(APNS_HOST, { cert: signerCert, key: signerKey });

  try {
    await new Promise<void>((resolve, reject) => {
      client.once("connect", () => resolve());
      client.once("error", reject);
    });

    await Promise.all(
      pushTokens.map(
        token =>
          new Promise<void>(resolve => {
            const req = client.request({
              ":method": "POST",
              ":path": `/3/device/${token}`,
              // Wallet pushes: pass type ID as topic, empty JSON payload —
              // per Apple's "Updating a pass" spec, no push-type/alert needed
              "apns-topic": passTypeId,
              "content-type": "application/json",
            });
            req.setTimeout(PUSH_TIMEOUT_MS, () => req.close());

            let status = 0;
            let body = "";
            req.on("response", headers => {
              status = Number(headers[":status"]);
            });
            req.setEncoding("utf8");
            req.on("data", chunk => (body += chunk));
            req.on("end", () => {
              if (status === 410 || body.includes("BadDeviceToken")) {
                invalidTokens.push(token);
              } else if (status !== 200) {
                console.warn(`[passkit] APNs push failed (${status}): ${body}`);
              }
              resolve();
            });
            req.on("error", err => {
              console.warn("[passkit] APNs request error:", err.message);
              resolve();
            });
            req.end("{}");
          })
      )
    );
  } finally {
    client.close();
  }

  return { invalidTokens };
}
