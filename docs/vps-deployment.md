# VPS Deployment Guide (Hostinger / Ubuntu)

This guide provides step-by-step instructions for deploying the Cycling Monorepo to a VPS.

## 1. Prerequisites

Connect to your VPS via SSH:
```bash
ssh root@your_vps_ip
```

Update your system and install essential tools:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git curl build-essential -y
```

Install Node.js (Version 20+ recommended):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install PM2 globally to manage your processes:
```bash
sudo npm install -g pm2
```

## 2. Clone and Install

Clone your repository:
```bash
git clone https://github.com/your-repo/cycling-app.git
cd cycling-app
```

Install dependencies at the root:
```bash
npm install
```

## 3. Environment Setup

### API Configuration
Create and edit the `.env` file for the API:
```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
```
Ensure `PORT=4000` and `DATABASE_URL` are correct.

### Web Configuration
Create and edit the `.env.local` file for the web app:
```bash
cp apps/web/.env.example apps/web/.env.local
nano apps/web/.env.local
```
Set:
- `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`
- `NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com`

## 4. Build the Applications

Run the build command from the root:
```bash
npx turbo run build
```

## 5. Process Management (PM2)

Start the API:
```bash
pm2 start "npm run start --filter=api" --name cycling-api
```

Start the Web App:
```bash
pm2 start "npm run start --filter=web" --name cycling-web
```

Save the PM2 process list:
```bash
pm2 save
pm2 startup
```

## 6. Nginx Setup (Reverse Proxy)

Install Nginx:
```bash
sudo apt install nginx -y
```

Create a new configuration:
```bash
sudo nano /etc/nginx/sites-available/cycling-app
```

Add the following (replace domains with yours):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/cycling-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 7. SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

Follow the prompts to enable HTTPS.
