# AWS Deploy Guide

This guide is for:

- AWS Lightsail
- Ubuntu 22.04
- no Docker
- public access enabled (`OPEN_ACCESS=1`)

## Fast path

If the project is already cloned on the server, you can run one command from the repo root:

```bash
sudo bash deploy/aws/bootstrap.sh --domain your-domain.example --email you@example.com
```

Optional:

```bash
sudo bash deploy/aws/bootstrap.sh --domain your-domain.example --email you@example.com --with-www
```

If DNS is not ready yet:

```bash
sudo bash deploy/aws/bootstrap.sh --domain your-domain.example --skip-ssl
```

After DNS is ready, run:

```bash
sudo certbot --nginx --redirect -m you@example.com -d your-domain.example
```

## 1. Create the server

- Create a Lightsail instance.
- Choose `Ubuntu 22.04`.
- Recommended region:
  - `ap-east-1` Hong Kong
  - or `ap-southeast-1` Singapore
  - or `ap-northeast-1` Tokyo
- Recommended plan for this project: `2 GB RAM`.

## 2. Open ports

Allow:

- `80` HTTP
- `443` HTTPS

SSH:

- keep `22`
- but restrict it to your own IP if possible

## 3. Connect to the server

Use the Lightsail browser terminal or your own SSH client.

## 4. Install runtime packages

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 5. Upload the code

Recommended: use a private git repository.

```bash
cd /srv
sudo git clone <your-private-repo-url> surveys
sudo chown -R $USER:$USER /srv/surveys
cd /srv/surveys
```

## 6. Install and build

```bash
npm ci
npm run build
```

## 7. Create a dedicated runtime user

```bash
sudo useradd --system --home /srv/surveys --shell /usr/sbin/nologin www-data || true
sudo chown -R www-data:www-data /srv/surveys
```

## 8. Configure systemd

Copy the service file:

```bash
sudo cp deploy/systemd/surveys.service /etc/systemd/system/surveys.service
```

Edit the secret:

```bash
sudo nano /etc/systemd/system/surveys.service
```

Replace:

```text
SESSION_SECRET=replace-with-a-long-random-secret
```

with a real long random string.

Then start the app:

```bash
sudo systemctl daemon-reload
sudo systemctl enable surveys
sudo systemctl start surveys
sudo systemctl status surveys
```

## 9. Configure Nginx

Copy the config:

```bash
sudo cp deploy/nginx/surveys.conf /etc/nginx/sites-available/surveys.conf
```

Edit the domain:

```bash
sudo nano /etc/nginx/sites-available/surveys.conf
```

Replace:

```text
server_name your-domain.example;
```

with your real domain.

Enable it:

```bash
sudo ln -sf /etc/nginx/sites-available/surveys.conf /etc/nginx/sites-enabled/surveys.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 10. Point the domain

Add an `A` record at your DNS provider:

- host: `@`
- value: your Lightsail public IP

Optional:

- host: `www`
- value: your Lightsail public IP

## 11. Enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example -d www.your-domain.example
```

If you only use one domain, keep one `-d`.

## 12. Update the app later

```bash
cd /srv/surveys
git pull
npm ci
npm run build
sudo systemctl restart surveys
```

## 13. Current runtime mode

This project is currently set for public access:

```text
OPEN_ACCESS=1
```

That means:

- no access-code screen
- users can open the link directly

If you want to restore access-code auth later, remove `OPEN_ACCESS=1` from the service file and restart.

## 14. Notes

- `data/app.sqlite` stays on the server and should not go into git.
- The portraits have been compressed for mobile delivery, but regular backups are still important.
- Start simple. Add CDN only after you have real traffic and know you need it.
