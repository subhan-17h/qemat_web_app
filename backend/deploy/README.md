# Webapp deployment

The production backend checkout is `/opt/qemat/qemat_web_app/backend`.
The timer checks grocery metadata five minutes after boot and every 15 minutes thereafter.
The ingest command is version-aware, so unchanged bundles do not write to PostgreSQL.

Create `/etc/qemat/alerts.env` with the Gmail SMTP username, App Password, and recipient described in
the price-updater deployment guide. Keep it out of Git, owned by `root:ubuntu`, with mode `0640`.

Copy the three files in `deploy/systemd/` to `/etc/systemd/system/`, then run:

```bash
sudo systemd-analyze verify /etc/systemd/system/qemat-*.service /etc/systemd/system/qemat-*.timer
sudo systemctl daemon-reload
sudo systemctl start qemat-bundle-ingest.service
sudo systemctl enable --now qemat-bundle-ingest.timer
```

Useful checks:

```bash
systemctl list-timers qemat-bundle-ingest.timer
sudo systemctl status qemat-bundle-ingest.service qemat-bundle-ingest.timer
sudo journalctl -u qemat-bundle-ingest.service -n 100 --no-pager
```

## QR redirect domain

Before changing DNS, deploy the backend and verify both routes through the existing API host:

```bash
curl -sS -D - -o /dev/null https://api.qemat.pk/a
curl -sS -D - -o /dev/null https://api.qemat.pk/i
```

Add these production environment values to the backend service configuration and restart it:

```dotenv
QR_ANALYTICS_ADMIN_EMAILS=your-admin-account@example.com
QR_ANALYTICS_SECRET=<output-of-openssl-rand-hex-32>
CORS_ORIGINS=https://qemat.pk,https://www.qemat.pk
```

Install the checked-in Nginx configuration, validate it, and reload Nginx:

```bash
sudo cp deploy/nginx/go.qemat.pk.conf /etc/nginx/sites-available/go.qemat.pk
sudo ln -s /etc/nginx/sites-available/go.qemat.pk /etc/nginx/sites-enabled/go.qemat.pk
sudo nginx -t
sudo systemctl reload nginx
```

Change the `go.qemat.pk` DNS A record to `140.245.20.134`. After DNS resolves to Oracle, provision TLS and
verify the final redirect headers without following them:

```bash
sudo certbot --nginx -d go.qemat.pk
curl -sS -D - -o /dev/null https://go.qemat.pk/a
curl -sS -D - -o /dev/null https://go.qemat.pk/i
```

Expected behavior is `302 Found`, `Cache-Control: no-store, max-age=0`, and the exact Google Play or Qemat
destination in the `Location` header. Do not distribute the poster until both HTTPS checks pass.
