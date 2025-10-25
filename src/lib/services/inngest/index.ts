import { Inngest } from "inngest";
import { INNGEST_EVENT_KEY } from "@/lib/services/env/private";

export const inngest = new Inngest({
  id: "endemit",
  eventKey: INNGEST_EVENT_KEY,
});
