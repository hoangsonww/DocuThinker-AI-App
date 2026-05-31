import { createClient } from "@supabase/supabase-js";

// Public, browser-safe values. The anon key cannot read the private bucket on
// its own — uploads are authorized by a short-lived signed-upload token minted
// server-side (service_role stays on the backend).
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const SUPABASE_BUCKET =
  process.env.REACT_APP_SUPABASE_BUCKET || "docuthinker";

// Null when envs are absent — callers fall back to the through-backend upload.
export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      })
    : null;
