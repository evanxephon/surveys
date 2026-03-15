# Aliyun Deploy Guide

This guide is for:

- Aliyun Hong Kong
- Ubuntu 22.04
- no Docker
- public access enabled (`OPEN_ACCESS=1`)

## 1. Create the server

- Create an Aliyun Simple Application Server or ECS instance in Hong Kong.
- Use Ubuntu 22.04.
- Open security group ports `80` and `443`.

## 2. Install runtime packages

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 3. Upload the code

Recommended: use a private git repository.

```bash
cd /srv
sudo git clone <your-private-repo-url> surveys
sudo chown -R $USER:$USER /srv/surveys
cd /srv/surveys
```

## 4. Install dependencies and build

```bash
npm ci
npm run build
```

## 5. Create a dedicated user

```bash
sudo useradd --system --home /srv/surveys --shell /usr/sbin/nologin www-data || true
sudo chown -R www-data:www-data /srv/surveys
```

If `www-data` already exists, the command is safe to ignore.

## 6. Configure systemd

Copy the service file:

```bash
sudo cp deploy/systemd/surveys.service /etc/systemd/system/surveys.service
```

Edit the secret before starting:

```bash
sudo nano /etc/systemd/system/surveys.service
```

Replace:

```text
SESSION_SECRET=replace-with-a-long-random-secret
```

with a real long random secret.

Then start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable surveys
sudo systemctl start surveys
sudo systemctl status surveys
```

## 7. Configure Nginx

Copy the Nginx config:

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

Enable the site:

```bash
sudo ln -sf /etc/nginx/sites-available/surveys.conf /etc/nginx/sites-enabled/surveys.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Point the domain

Add an `A` record at your DNS provider:

- host: `@`
- value: your server public IP

Optional:

- host: `www`
- value: your server public IP

## 9. Enable HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example -d www.your-domain.example
```

If you only use one domain, just keep one `-d`.

## 10. Update the app later

```bash
cd /srv/surveys
git pull
npm ci
npm run build
sudo systemctl restart surveys
```

## 11. Notes

- `OPEN_ACCESS=1` means the access code page is bypassed.
- `data/app.sqlite` stays on the server and should not go into git.
- Current image assets are large. The app works, but later you may want to compress them for faster loading.
