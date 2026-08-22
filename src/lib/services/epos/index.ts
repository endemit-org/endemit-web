import "server-only";

/**
 * ePOS-Print XML rendering for Epson receipt printers (TM-P80II et al.)
 * used via Server Direct Print: the printer polls our server and prints
 * the returned XML. 80mm @ 203dpi = 48 columns in font A.
 */

const COLS = 48;

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Left/right aligned line padded to the column width. */
function line(left: string, right = ""): string {
  const space = COLS - left.length - right.length;
  if (space < 1) {
    return `${left.slice(0, COLS - right.length - 1)} ${right}`;
  }
  return left + " ".repeat(space) + right;
}

function divider(): string {
  return "-".repeat(COLS);
}

/** Word-wrap text to the column width. */
function wrap(content: string): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of content.split(/\s+/)) {
    if (current.length + word.length + 1 > COLS && current) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export interface EposReceiptData {
  registerName: string;
  queueNumber?: number | null;
  companyLines: string[];
  taxNumber?: string | null;
  shortCode: string;
  paidAt: Date;
  sellerName?: string | null;
  items: Array<{ quantity: number; name: string; total: string }>;
  tipLabel?: string | null; // formatted tip amount, when > 0
  totalFormatted: string;
  methodLabel: string;
  labels: {
    fiscalTitle?: string; // "Račun št. N"
    informalTitle: string;
    order: string;
    date: string;
    operator: string;
    tip: string;
    total: string;
    paymentMethod: string;
    taxNumber: string;
    eorPending: string;
    disclaimer: string;
    thanks: string;
    ticketsHint: string;
    vatClause: string;
  };
  fiscal?: {
    zoi: string;
    eor: string | null;
    qrValue: string; // 60-digit FURS verification code
  } | null;
  vatClause?: boolean;
  tickets: Array<{
    shortId: string;
    eventName: string;
    eventDate?: string | null;
    venueName?: string | null;
    qrData: string; // JSON qrContent, scanned at the door
  }>;
}

function text(content: string, attrs = ""): string {
  return `<text${attrs ? ` ${attrs}` : ""}>${esc(content)}&#10;</text>`;
}

function qrSymbol(data: string, width: number): string {
  return `<symbol type="qrcode_model_2" level="level_m" width="${width}" height="0" size="0">${esc(data)}</symbol>`;
}

export function buildReceiptEposXml(data: EposReceiptData): string {
  const parts: string[] = [];

  // Header
  parts.push(`<text align="center"/>`);
  parts.push(`<text dw="true" dh="true" em="true"/>`);
  parts.push(text("ENDEMIT"));
  parts.push(`<text dw="false" dh="false" em="false"/>`);
  for (const companyLine of data.companyLines) {
    parts.push(text(companyLine));
  }
  if (data.taxNumber) {
    parts.push(text(`${data.labels.taxNumber}: ${data.taxNumber}`));
  }
  parts.push(text(data.registerName));
  parts.push(`<text em="true"/>`);
  parts.push(text(data.fiscal ? data.labels.fiscalTitle! : data.labels.informalTitle));
  parts.push(`<text em="false"/>`);
  if (data.queueNumber != null) {
    parts.push(`<text dw="true" dh="true" em="true"/>`);
    parts.push(text(`#${data.queueNumber}`));
    parts.push(`<text dw="false" dh="false" em="false"/>`);
  }
  parts.push(`<text align="left"/>`);
  parts.push(text(divider()));

  // Meta
  parts.push(text(line(data.labels.order, data.shortCode)));
  parts.push(
    text(
      line(
        data.labels.date,
        data.paidAt.toLocaleString("sl-SI", {
          dateStyle: "short",
          timeStyle: "medium",
        })
      )
    )
  );
  if (data.sellerName) {
    parts.push(text(line(data.labels.operator, data.sellerName)));
  }
  parts.push(text(divider()));

  // Items
  for (const item of data.items) {
    parts.push(text(line(`${item.quantity}x ${item.name}`, item.total)));
  }
  if (data.tipLabel) {
    parts.push(text(line(data.labels.tip, data.tipLabel)));
  }
  parts.push(text(divider()));

  parts.push(`<text em="true"/>`);
  parts.push(text(line(data.labels.total, data.totalFormatted)));
  parts.push(`<text em="false"/>`);
  parts.push(text(line(data.labels.paymentMethod, data.methodLabel)));

  // Fiscal block
  if (data.fiscal) {
    parts.push(text(divider()));
    parts.push(text(`ZOI: ${data.fiscal.zoi}`));
    parts.push(text(`EOR: ${data.fiscal.eor ?? data.labels.eorPending}`));
    parts.push(`<text align="center"/>`);
    parts.push(qrSymbol(data.fiscal.qrValue, 4));
    parts.push(`<feed unit="8"/>`);
    if (data.vatClause) {
      for (const clauseLine of wrap(data.labels.vatClause)) {
        parts.push(text(clauseLine));
      }
    }
    parts.push(`<text align="left"/>`);
  } else {
    parts.push(text(divider()));
    parts.push(`<text align="center"/>`);
    parts.push(text(data.labels.disclaimer));
    parts.push(`<text align="left"/>`);
  }

  parts.push(`<text align="center"/>`);
  parts.push(text(data.labels.thanks));
  parts.push(`<feed unit="24"/>`);
  parts.push(`<cut type="feed"/>`);

  // One cut-separated slip per ticket
  for (const ticket of data.tickets) {
    parts.push(`<text align="center"/>`);
    parts.push(`<text dw="true" dh="true" em="true"/>`);
    parts.push(text(ticket.eventName.toUpperCase()));
    parts.push(`<text dw="false" dh="false" em="false"/>`);
    if (ticket.eventDate) parts.push(text(ticket.eventDate));
    if (ticket.venueName) parts.push(text(ticket.venueName));
    parts.push(`<feed unit="12"/>`);
    parts.push(qrSymbol(ticket.qrData, 6));
    parts.push(`<feed unit="12"/>`);
    parts.push(`<text em="true"/>`);
    parts.push(text(ticket.shortId));
    parts.push(`<text em="false"/>`);
    parts.push(text(data.labels.ticketsHint));
    parts.push(`<feed unit="24"/>`);
    parts.push(`<cut type="feed"/>`);
  }

  return (
    `<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">` +
    parts.join("") +
    `</epos-print>`
  );
}

/** Wrap rendered jobs in the Server Direct Print response envelope. */
export function buildPrintRequestInfo(
  jobs: Array<{ id: string; xml: string }>
): string {
  const blocks = jobs
    .map(
      job =>
        `<ePOSPrint>` +
        `<Parameter><devid>local_printer</devid><timeout>30000</timeout><printjobid>${esc(job.id)}</printjobid></Parameter>` +
        `<PrintData>${job.xml}</PrintData>` +
        `</ePOSPrint>`
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><PrintRequestInfo Version="3.00">${blocks}</PrintRequestInfo>`;
}
