/**
 * Browser-side ePOS-Print for the register's local Epson printer (TM-P80II —
 * no Server Direct Print support, so the seller's device pushes instead:
 * fetch the rendered receipt XML from our API, then POST it straight to the
 * printer over the venue LAN).
 *
 * Requirements on the seller device: it must be on the printer's network,
 * and it must trust the printer's TLS certificate (the page is HTTPS, so
 * plain-HTTP printer calls would be blocked as mixed content).
 */

const EPOS_SERVICE_PATH = "/cgi-bin/epos/service.cgi";

/** Admin stores a host or full URL; normalize to the ePOS service endpoint. */
export function eposServiceUrl(printerUrl: string): string {
  const base = printerUrl.trim().replace(/\/+$/, "");
  const withScheme = /^https?:\/\//i.test(base) ? base : `https://${base}`;
  if (withScheme.includes("/cgi-bin/")) {
    return withScheme;
  }
  return `${withScheme}${EPOS_SERVICE_PATH}?devid=local_printer&timeout=30000`;
}

/** Printer web-admin address — where staff go to accept the TLS cert. */
export function printerHomepage(printerUrl: string): string {
  const base = printerUrl.trim().replace(/\/+$/, "");
  const withScheme = /^https?:\/\//i.test(base) ? base : `https://${base}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return withScheme;
  }
}

/** Small test slip so staff can verify connectivity/cert from the register. */
export function buildTestSlipXml(label: string): string {
  const esc = (v: string) =>
    v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return (
    `<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">` +
    `<text align="center"/>` +
    `<text dw="true" dh="true" em="true"/><text>ENDEMIT&#10;</text>` +
    `<text dw="false" dh="false" em="false"/>` +
    `<text>${esc(label)}&#10;</text>` +
    `<text>${esc(new Date().toLocaleString("sl-SI"))}&#10;</text>` +
    `<feed line="2"/><cut type="feed"/>` +
    `</epos-print>`
  );
}

function soapEnvelope(eposXml: string): string {
  return (
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"><s:Body>` +
    eposXml +
    `</s:Body></s:Envelope>`
  );
}

export interface EposPrintResult {
  success: boolean;
  error?: string;
}

export type PrintParts = "full" | "all" | "receipt" | "tickets";

/**
 * Full print chain for a paid order: fetch the rendered receipt XML from the
 * app (all of it, or just the receipt / just the ticket slips for partial
 * reprints), push it to the register's printer, report the outcome.
 */
export async function printOrderReceipt(
  orderHash: string,
  printerUrl: string,
  parts: PrintParts = "full"
): Promise<EposPrintResult> {
  let jobId: string | undefined;
  let xml: string | undefined;
  try {
    const response = await fetch(`/api/v1/pos/orders/${orderHash}/print`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parts }),
    });
    const data = await response.json();
    if (!response.ok || !data.xml) {
      return {
        success: false,
        error: data.error ?? "Failed to render receipt",
      };
    }
    jobId = data.jobId;
    xml = data.xml;
  } catch {
    return { success: false, error: "Failed to render receipt" };
  }

  const result = await printToEposPrinter(printerUrl, xml!);

  if (jobId) {
    fetch(`/api/v1/pos/print/jobs/${jobId}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    }).catch(() => {});
  }

  return result;
}

/** POST ePOS-Print XML (unwrapped) to the printer; resolves when it answers. */
export async function printToEposPrinter(
  printerUrl: string,
  eposXml: string
): Promise<EposPrintResult> {
  try {
    const response = await fetch(eposServiceUrl(printerUrl), {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8" },
      body: soapEnvelope(eposXml),
      signal: AbortSignal.timeout(35000),
    });
    if (!response.ok) {
      return { success: false, error: `Printer HTTP ${response.status}` };
    }
    const text = await response.text();
    const match = text.match(/<response[^>]*\bsuccess\s*=\s*"([^"]+)"/i);
    if (match && !/^(true|1)$/i.test(match[1])) {
      const code = text.match(/\bcode\s*=\s*"([^"]+)"/i)?.[1];
      return { success: false, error: code ?? "Printer reported failure" };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Printer unreachable",
    };
  }
}

export type EposPrinterWarning =
  | "paperEnd"
  | "paperNearEnd"
  | "coverOpen"
  | "error";

export interface EposProbeResult {
  reachable: boolean;
  /** Printer answered but reports a condition that will block printing. */
  warning?: EposPrinterWarning;
  error?: string;
}

// ePOS-Print response `status` bitfield (Epson ePOS-Print API reference).
const STATUS_COVER_OPEN = 0x00000020;
const STATUS_MECHANICAL_ERR = 0x00000400;
const STATUS_AUTOCUTTER_ERR = 0x00000800;
const STATUS_UNRECOVER_ERR = 0x00002000;
const STATUS_AUTORECOVER_ERR = 0x00004000;
const STATUS_RECEIPT_NEAR_END = 0x00020000;
const STATUS_RECEIPT_END = 0x00080000;

/**
 * Reachability probe without printing: an empty ePOS document makes the
 * printer answer with its status bits and feeds no paper. A failed fetch
 * means the device is off the printer's network, the printer is off, or the
 * browser doesn't trust its TLS cert — the browser can't tell those apart.
 */
export async function probeEposPrinter(
  printerUrl: string
): Promise<EposProbeResult> {
  try {
    const response = await fetch(eposServiceUrl(printerUrl), {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8" },
      body: soapEnvelope(
        `<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"/>`
      ),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      return { reachable: false, error: `Printer HTTP ${response.status}` };
    }
    const text = await response.text();
    const status = Number(text.match(/\bstatus\s*=\s*"(\d+)"/i)?.[1] ?? 0);
    if (status & STATUS_RECEIPT_END)
      return { reachable: true, warning: "paperEnd" };
    if (status & STATUS_COVER_OPEN)
      return { reachable: true, warning: "coverOpen" };
    if (
      status &
      (STATUS_MECHANICAL_ERR |
        STATUS_AUTOCUTTER_ERR |
        STATUS_UNRECOVER_ERR |
        STATUS_AUTORECOVER_ERR)
    ) {
      return { reachable: true, warning: "error" };
    }
    if (status & STATUS_RECEIPT_NEAR_END) {
      return { reachable: true, warning: "paperNearEnd" };
    }
    return { reachable: true };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : "Printer unreachable",
    };
  }
}
