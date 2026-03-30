# Production Deployment — On The List

Three PM2 processes, three subdomains, one server, one monorepo.

## Hostnames

| Hostname | App | Port |
|---|---|---|
| `onthelistapp.co.uk` (+ `www`) | `apps/web` (Next.js) | 3017 |
| `admin.onthelistapp.co.uk` | `apps/admin` (Next.js) | 3018 |
| `api.onthelistapp.co.uk` | `apps/api` (Express) | 3016 |

All three bind to **`0.0.0.0`** so they accept connections on any interface.

## Quick start on the server

```bash
# 1 — pull code
cd /path/to/fatsoma-clone
git pull

# 2 — install deps
npm ci

# 3 — build everything (NEXT_PUBLIC_* is baked in at build time)
npm run build

# 4 — start / restart PM2
pm2 start ecosystem.config.js
# or: pm2 restart ecosystem.config.js
```

## DNS

Point all three names to the server's public IP via **A records**:

```
onthelistapp.co.uk        A   <SERVER_IP>
www.onthelistapp.co.uk    A   <SERVER_IP>   (or CNAME → onthelistapp.co.uk)
admin.onthelistapp.co.uk  A   <SERVER_IP>
api.onthelistapp.co.uk    A   <SERVER_IP>
```

## TLS (Let's Encrypt)

```bash
sudo certbot certonly --nginx \
  -d onthelistapp.co.uk \
  -d www.onthelistapp.co.uk \
  -d admin.onthelistapp.co.uk \
  -d api.onthelistapp.co.uk
```

## nginx

1. Copy `deploy/nginx-onthelistapp.example.conf` → `/etc/nginx/sites-available/onthelistapp`
2. Adjust `ssl_certificate` / `ssl_certificate_key` paths if certbot created a different folder
3. `sudo ln -s /etc/nginx/sites-available/onthelistapp /etc/nginx/sites-enabled/`
4. `sudo nginx -t && sudo systemctl reload nginx`

## Environment variables (`.env` in repo root)

| Variable | Value | Used by |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.onthelistapp.co.uk` | web + admin (client-side fetch) |
| `NEXT_PUBLIC_BASE_URL` | `https://onthelistapp.co.uk` | web + admin |
| `CORS_ORIGIN` | `https://onthelistapp.co.uk,https://www.onthelistapp.co.uk,https://admin.onthelistapp.co.uk` | API |
| `WEB_URL` | `https://onthelistapp.co.uk` | API (Stripe return URLs, emails) |
| `MONGODB_URI` | connection string | API |
| `STRIPE_SECRET_KEY` | `sk_...` | API |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | API |
| `STRIPE_PUBLISHABLE_KEY` | `pk_...` | web |

**After changing any `NEXT_PUBLIC_*` variable you must rebuild:**

```bash
npm run build
pm2 restart ecosystem.config.js
```

## Stripe webhook

Set the endpoint in the Stripe dashboard to:

```
https://api.onthelistapp.co.uk/api/checkout/webhook
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## Uploads / images

The API serves uploaded files from `/uploads/`. Both `apps/web` and `apps/admin` Next.js configs allow images from `api.onthelistapp.co.uk`.
