import "server-only";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PRIVATE_KEY } from "@/lib/services/env/private";
import { PUBLIC_SUPABASE_URL } from "@/lib/services/env/public";

export const supabaseServer = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_PRIVATE_KEY
);
