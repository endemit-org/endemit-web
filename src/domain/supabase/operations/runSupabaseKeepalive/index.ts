import "server-only";

import { inngest } from "@/lib/services/inngest";
import { supabaseServer } from "@/lib/services/supabase";

/**
 * Scheduled function that pings Supabase weekly to prevent
 * free tier project from pausing due to inactivity.
 *
 * Runs every Monday at 9:00 AM (Europe/Ljubljana timezone).
 */
export const runSupabaseKeepalive = inngest.createFunction(
  { id: "supabase-keepalive", retries: 3 },
  { cron: "TZ=Europe/Ljubljana 0 9 * * 1" },
  async ({ step }) => {
    await step.run("ping-supabase", async () => {
      const channel = supabaseServer.channel("heartbeat");
      await channel.subscribe();
      await supabaseServer.removeChannel(channel);

      return { status: "alive", timestamp: new Date().toISOString() };
    });

    return { success: true };
  }
);
