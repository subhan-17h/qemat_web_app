# Webapp bundle-ingest deployment

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
