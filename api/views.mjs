// Page-view counter. Every page load POSTs here and the total goes up by one
// (repeat visits count too). Stored in Upstash Redis, connected through the
// Vercel Marketplace, which provides the env vars below.
// Vercel may add a custom prefix to these names (e.g. STORAGE_KV_REST_API_URL),
// so match on the suffix.
const env = suffix => Object.entries(process.env).find(([k, v]) => k.endsWith(suffix) && v)?.[1];
const URL = env("KV_REST_API_URL") || env("UPSTASH_REDIS_REST_URL");
const TOKEN = env("KV_REST_API_TOKEN") || env("UPSTASH_REDIS_REST_TOKEN");
const KEY = "pageviews:home";
// Starting number for the displayed count. The site had 3 real views when this
// was set, so the page showed 2,100 at that point; each new view adds 1.
const OFFSET = 2097;

async function redis(cmd) {
  const r = await fetch(`${URL}/${cmd}/${KEY}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return Number((await r.json()).result) || 0;
}

function reply(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handle(cmd) {
  if (!URL || !TOKEN) return reply({ error: "counter not configured" }, 503);
  try {
    return reply({ views: OFFSET + (await redis(cmd)) });
  } catch (e) {
    return reply({ error: "counter unavailable" }, 502);
  }
}

export const GET = () => handle("get");   // read without counting
export const POST = () => handle("incr"); // count this view
