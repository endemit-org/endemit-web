import "server-only";

import { inngest } from "@/lib/services/inngest";
import { supabaseServer } from "@/lib/services/supabase";

/**
 * Scheduled function that pings Supabase every 2 hours to prevent
 * free tier project from pausing due to inactivity.
 *
 * Performs both database and realtime activity to ensure Supabase
 * registers the project as active.
 */
export const runSupabaseKeepalive = inngest.createFunction(
  {
    id: "supabase-keepalive",
    retries: 3,
    triggers: [{ cron: "0 */2 * * *" }],
  },
  async ({ step }) => {
    const timestamp = new Date().toISOString();

    // Database activity - upsert to keepalive table
    // Even if the table doesn't exist, the request counts as DB activity
    const dbResult = await step.run("ping-database", async () => {
      const { error } = await supabaseServer.from("system_config").upsert(
        { id: 1, updated_at: timestamp },
        { onConflict: "id" }
      );

      return { success: !error, error: error?.message, timestamp };
    });

    // Realtime activity - broadcast message
    const realtimeResult = await step.run("broadcast-heartbeat", async () => {
      const channel = supabaseServer.channel("system:heartbeat");

      await channel.httpSend("heartbeat", {
        timestamp,
        source: "keepalive",
      });

      await supabaseServer.removeChannel(channel);

      return { broadcast: true, timestamp };
    });

    return { success: true, db: dbResult, realtime: realtimeResult };
  }
);
