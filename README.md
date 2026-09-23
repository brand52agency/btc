# BTC Signal Desk: standalone site

A single `index.html` with no backend and no build step. When someone opens it, the browser pulls daily BTC prices
(Coinbase first, then Binance's public data mirror) and computes this week's Trend + Value signal and the
2-year weekly log. If both price sources fail, it shows the signal snapshot built into the file.

## Deploy options (pick one)

**Vercel** (good if the domain is already on Vercel):
1. `npm i -g vercel`, then run `vercel --prod` inside this folder, or drag the folder into vercel.com/new.
2. Project → Settings → Domains → add e.g. `btc.yourdomain.com`.
3. At your DNS provider, add a `CNAME` record from `btc` to `cname.vercel-dns.com`.

**Netlify Drop** (fastest, no account setup): drag this folder onto app.netlify.com/drop, then go to
Domain settings → add a custom domain and follow the CNAME instructions.

**Cloudflare Pages** (if your DNS is on Cloudflare): Workers & Pages → Create → Pages → Upload assets →
select this folder → Custom domains → add `btc.yourdomain.com`. DNS is set up automatically.

**Inside an existing Next.js site** (e.g. the Noden app): put `index.html` at `public/btc/index.html`.
It will be served at `yourdomain.com/btc/`.

## Updating
- The live signal updates on its own.
- The backtest charts are frozen as of Sep 2026. Ask Claude to regenerate `index.html` if you ever want them refreshed.
- Weekly buy/sell notifications still come from the Claude scheduled task, separately from the site.

Not financial advice.
