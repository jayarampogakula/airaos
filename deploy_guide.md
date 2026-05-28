# Hostinger VPS Production Deployment Guide

GatiDesk is built as a static Single Page React Application (SPA) powered by Vite. You can deploy it to your Hostinger VPS using one of the two standard methods below.

---

## Method 1: Serving Static Build via Nginx (Recommended & Fast)

This method builds the static HTML/JS/CSS assets on your machine (or VPS) and serves them directly using Nginx.

### Step 1: Install Nginx on Hostinger VPS (Ubuntu)
Connect to your Hostinger VPS via SSH and run:
```bash
sudo apt update
sudo apt install nginx -y
```

### Step 2: Build the Application
On your local machine or VPS, run the build command inside the project directory:
```bash
npm run build
```
This compiles everything into a `dist/` directory.

### Step 3: Copy Static Files to VPS
Transfer the contents of the `dist/` folder to your VPS web root `/var/www/html/agentstackos`. You can use SCP, SFTP, or Git:
```bash
# Example via SCP
scp -r dist/* root@your_vps_ip:/var/www/html/agentstackos
```

### Step 4: Configure Nginx Configuration
Create a server block configuration to serve the React SPA and prevent `404` errors when reloading routes:
```bash
sudo nano /etc/nginx/sites-available/agentstackos
```
Paste the following server configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com; # Replace with your domain

    root /var/www/html/agentstackos;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Enable Gzip Compression for fast page loads
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

Enable the site configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/agentstackos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemerctl restart nginx
```

---

## Method 2: Deployment via Docker / Coolify

If you use Docker or a control panel like **Coolify** on Hostinger VPS, you can deploy in one step using the root `Dockerfile` and `nginx.conf` provided in the codebase.

### Step 1: Install Docker on VPS
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Step 2: Build & Run Container
Navigate to your project root on the VPS and run:
```bash
# Build the Docker image
docker build -t agentstackos:latest .

# Run the container mapping Port 80
docker run -d -p 80:80 --name agentstackos agentstackos:latest
```

### Step 3: Coolify Automated Git Deployment
1. Log in to your Coolify panel on your Hostinger VPS.
2. Create a new project and select **Private Git repository** or **Public Git repository**.
3. Choose **Dockerfile** as the buildpack.
4. Coolify will automatically read the `Dockerfile` at the root, build it, set up the Nginx proxy, and link SSL certificates via Traefik automatically!
