import { serve } from "inngest/next";
import { inngest } from "@/app/services/inngest";

import { runNewOrderAutomation } from "@/domain/order/actions";
import { runTicketIssueAutomation } from "@/domain/ticket/actions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [runTicketIssueAutomation, runNewOrderAutomation],
});
