import { serve } from "inngest/next";
import { inngest } from "@/lib/services/inngest";
import { runTicketIssueAutomation } from "@/domain/ticket/operations/runTicketIssueAutomation";
import { runGuestTicketAutomation } from "@/domain/ticket/operations/runGuestTicketAutomation";
import { runDoorSaleTicketAutomation } from "@/domain/ticket/operations/runDoorSaleTicketAutomation";
import { runNewOrderAutomation } from "@/domain/order/operations/runNewOrderAutomation";
import { runOrderCleanupAutomation } from "@/domain/order/operations/runOrderCleanupAutomation";
import { runRefundEmailAutomation } from "@/domain/order/operations/runRefundEmailAutomation";
import { runOtcEmailAutomation } from "@/domain/auth/operations/runOtcEmailAutomation";
import { runSupabaseKeepalive } from "@/domain/supabase/operations/runSupabaseKeepalive";
import { runPosOrderExpiryAutomation } from "@/domain/pos/operations/runPosOrderExpiryAutomation";
import { runPosTransactionEmailAutomation } from "@/domain/pos/operations/runPosTransactionEmailAutomation";
import { runEventReminderAutomation } from "@/domain/email/operations/runEventReminderAutomation";
import { runSingleEventReminderAutomation } from "@/domain/email/operations/runSingleEventReminderAutomation";
import { runOrderNewsletterAutomation } from "@/domain/newsletter/operations/runOrderNewsletterAutomation";
import { runEventClaimAutomation } from "@/domain/claim/operations/runEventClaimAutomation";
import {
  runStickerLinkedEmailAutomation,
  runStickerUnlinkedEmailAutomation,
  runStickerReplacedEmailAutomation,
} from "@/domain/sticker/operations/runStickerEmailAutomation";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    runTicketIssueAutomation,
    runGuestTicketAutomation,
    runDoorSaleTicketAutomation,
    runNewOrderAutomation,
    runOrderCleanupAutomation,
    runRefundEmailAutomation,
    runOtcEmailAutomation,
    runSupabaseKeepalive,
    runPosOrderExpiryAutomation,
    runPosTransactionEmailAutomation,
    runEventReminderAutomation,
    runSingleEventReminderAutomation,
    runOrderNewsletterAutomation,
    runEventClaimAutomation,
    runStickerLinkedEmailAutomation,
    runStickerUnlinkedEmailAutomation,
    runStickerReplacedEmailAutomation,
  ],
});
