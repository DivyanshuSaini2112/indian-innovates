import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Lazy-initialized client — only crashes if you call supabase.from() without env vars
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    if (!supabaseUrl) {
      // Return a no-op proxy so the app doesn't crash without env vars
      return createMockClient();
    }
    _client = createClient(supabaseUrl, supabaseAnon);
  }
  return _client;
}

/** Minimal mock client for development without Supabase configured */
function createMockClient(): SupabaseClient {
  const noop = () => ({ data: null, error: null, count: null });
  const chain: Record<string, unknown> = {};
  const proxy = new Proxy(chain, {
    get(_t, prop) {
      if (prop === "then") return undefined;
      if (prop === "single") return () => Promise.resolve(noop());
      if (prop === "select" || prop === "upsert" || prop === "insert" || prop === "delete" || prop === "update" || prop === "eq" || prop === "order" || prop === "head") {
        return () => new Proxy(chain, proxy);
      }
      return () => new Proxy(chain, proxy);
    },
    apply() { return Promise.resolve(noop()); }
  });
  return { from: () => new Proxy(chain, proxy) } as unknown as SupabaseClient;
}

// Exported proxy object that auto-lazily initializes
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getClient();
    const val = (client as unknown as Record<string, unknown>)[String(prop)];
    return typeof val === "function" ? val.bind(client) : val;
  }
});

/** Server-side service role client (bypasses RLS) */
export function getServiceClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey) return createMockClient();
  return createClient(supabaseUrl, serviceKey);
}
