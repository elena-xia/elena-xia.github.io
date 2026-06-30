# Cloudflare DNS Configuration for yidanxia.com → GitHub Pages

## Step 1: GitHub Pages Settings

1. Go to https://github.com/elena-xia/elena-xia.github.io/settings/pages
2. Under "Custom domain", enter `yidanxia.com` and click Save
3. Check "Enforce HTTPS" (may take a few minutes to become available after DNS propagates)

## Step 2: Cloudflare DNS Records

In your Cloudflare dashboard → DNS → Records, create **four** A records and one CNAME record:

| Type  | Name | Content             | Proxy status | TTL  |
|-------|------|---------------------|-------------|------|
| A     | @    | 185.199.108.153     | DNS only    | Auto |
| A     | @    | 185.199.109.153     | DNS only    | Auto |
| A     | @    | 185.199.110.153     | DNS only    | Auto |
| A     | @    | 185.199.111.153     | DNS only    | Auto |
| CNAME | www  | elena-xia.github.io | DNS only    | Auto |

## Important: Proxy Status

Set all records to **"DNS only"** (grey cloud), not "Proxied" (orange cloud). GitHub Pages handles its own HTTPS certificate via Let's Encrypt, and Cloudflare proxying can interfere with certificate provisioning.

If you want to use Cloudflare's proxy (orange cloud) for CDN/WAF benefits, you'll need to configure Cloudflare SSL mode to "Full" or "Full (strict)" and ensure the certificate provisions correctly first.

## Step 3: Verify

After DNS propagates (usually 5-30 minutes):
- `dig yidanxia.com` should return the four GitHub Pages IPs
- `dig www.yidanxia.com` should return a CNAME to elena-xia.github.io
- https://yidanxia.com should load your site
- https://www.yidanxia.com should redirect to https://yidanxia.com

## Notes

- The CNAME file in the repo root (`yidanxia.com`) tells GitHub which custom domain to serve
- If you ever remove the CNAME file, GitHub will stop serving the custom domain
- DNS changes can take up to 48 hours to propagate globally, but usually much faster with Cloudflare
