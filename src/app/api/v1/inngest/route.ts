import { serve } from "inngest/next";
import { inngest } from "@/lib/services/inngest";
import { runTicketIssueAutomation } from "@/domain/ticket/operations/runTicketIssueAutomation";
import { runGuestTicketAutomation } from "@/domain/ticket/operations/runGuestTicketAutomation";
import { runNewOrderAutomation } from "@/domain/order/operations/runNewOrderAutomation";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runTicketIssueAutomation, runGuestTicketAutomation, runNewOrderAutomation],
});
