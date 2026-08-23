import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { POS_PRINT_TOKEN } from "@/lib/services/env/private";
import { renderPosReceiptEpos } from "@/domain/pos/operations/renderPosReceiptEpos";
import { buildPrintRequestInfo } from "@/lib/services/epos";

const MAX_JOBS_PER_POLL = 3;
const MAX_ATTEMPTS = 5;
const MAX_JOB_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Epson Server Direct Print endpoint. The printer POSTs here on an
 * interval: a GetRequest fetches queued receipts as ePOS-Print XML, a
 * SetResponse reports per-job print results. Authenticated via the token
 * query parameter configured in the printer's server URL.
 */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  if (!POS_PRINT_TOKEN || searchParams.get("token") !== POS_PRINT_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The printer sends urlencoded or multipart form data
  let body = "";
  let responseFile = "";
  try {
    const formData = await request.formData();
    const parts: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        parts.push(`${key}=${value}`);
        if (key === "ResponseFile") responseFile = value;
      } else {
        const content = await value.text();
        parts.push(`${key}=${content}`);
        if (key === "ResponseFile") responseFile = content;
      }
    }
    body = parts.join("&");
  } catch {
    body = await request.text().catch(() => "");
  }

  // Print result callback: mark jobs printed/failed
  if (responseFile || body.includes("PrintResponseInfo")) {
    const xml = responseFile || body;
    const blocks = xml.split("<ePOSPrint>").slice(1);
    for (const block of blocks) {
      const jobId = block.match(/<printjobid>([^<]+)<\/printjobid>/)?.[1];
      if (!jobId) continue;
      const success = /success\s*=\s*"(?:true|1)"/i.test(block);
      await prisma.posPrintJob
        .update({
          where: { id: jobId },
          data: success
            ? { status: "PRINTED", printedAt: new Date(), lastError: null }
            : {
                status: "FAILED",
                lastError: block.slice(0, 300),
              },
        })
        .catch(() => {});
    }
    return new NextResponse(null, { status: 200 });
  }

  // Job request: return pending receipts as ePOS XML
  const pending = await prisma.posPrintJob.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: MAX_ATTEMPTS },
      createdAt: { gte: new Date(Date.now() - MAX_JOB_AGE_MS) },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_JOBS_PER_POLL,
  });

  const jobs: Array<{ id: string; xml: string }> = [];
  for (const job of pending) {
    const xml = await renderPosReceiptEpos(job.posOrderId).catch(() => null);
    if (xml) {
      jobs.push({ id: job.id, xml });
    } else {
      await prisma.posPrintJob.update({
        where: { id: job.id },
        data: { status: "FAILED", lastError: "Order not printable" },
      });
    }
  }

  if (jobs.length > 0) {
    await prisma.posPrintJob.updateMany({
      where: { id: { in: jobs.map(j => j.id) } },
      data: { attempts: { increment: 1 } },
    });
  }

  if (jobs.length === 0) {
    return new NextResponse(null, { status: 200 });
  }

  return new NextResponse(buildPrintRequestInfo(jobs), {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}
