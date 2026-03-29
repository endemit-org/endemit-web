import { serve } from "inngest/next";
import { inngest } from "@/lib/services/inngest";
import { runTicketIssueAutomation } from "@/domain/ticket/operations/runTicketIssueAutomation";
import { runGuestTicketAutomation } from "@/domain/ticket/operations/runGuestTicketAutomation";
import { runNewOrderAutomation } from "@/domain/order/operations/runNewOrderAutomation";
import { runOtcEmailAutomation } from "@/domain/auth/operations/runOtcEmailAutomation";
import { runSupabaseKeepalive } from "@/domain/supabase/operations/runSupabaseKeepalive";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    runTicketIssueAutomation,
    runGuestTicketAutomation,
    runNewOrderAutomation,
    runOtcEmailAutomation,
    runSupabaseKeepalive,
  ],
});
