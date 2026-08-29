# 🚀 Docker & Docker Compose Deployment Guide

This guide covers how to build, run, and deploy the entire **Borewell Motor Automation** system using Docker and Docker Compose.

---

## 🏗 System Components

| Service Name | Technology | Container Port | Exposed Host Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `backend` | Express Node.js | `3030` | `3030` | Core API & MQTT Engine |
| `frontend-admin` | React SPA + Nginx | `80` | `6061` | Admin Dashboard |
| `frontend-enduser` | Flutter Web + Nginx | `80` | `8080` | End-User Web App |
| `mongodb` | MongoDB 7.0 | `27017` | `27017` | Database |
| `redis` | Redis Alpine | `6379` | `6379` | Cache / Session store |
| `mosquitto` | Eclipse Mosquitto | `1883` | `1883` | MQTT Broker (Local) |

---

## ⚡ Quickstart (Local Development)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
- Git installed.

### Step 1: Clone & Prepare Environment Variables
Copy `.env.docker.example` to `.env`:

```bash
cp .env.docker.example .env
```

### Step 2: Build & Start All Containers

Run the following command in the project root:

```bash
docker compose up --build -d
```

To view live application logs across all services:

```bash
docker compose logs -f
```

To view logs for a specific service (e.g., backend):

```bash
docker compose logs -f backend
```

---

## 🌐 Accessing Services

Once started, access the services via your browser or API clients:

- **Backend Health & API Base**: `http://localhost:3030`
- **Frontend Admin Dashboard**: `http://localhost:6061`
- **Frontend End-User Web App**: `http://localhost:8080`
- **Local MongoDB**: `mongodb://localhost:27017`
- **Local Redis**: `redis://localhost:6379`

---

## ☁️ Cloud Deployment Guide (VPS / AWS / DigitalOcean / Linode)

### Step 1: Prepare your Cloud Instance
1. Launch an Ubuntu 22.04 LTS instance with at least **2 GB RAM** and **1 CPU core**.
2. Install Docker & Docker Compose plugin:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-v2
   sudo systemctl enable --now docker
   ```

### Step 2: Clone Repository & Configure Environment
```bash
git clone <your-repository-url> borewell-automation
cd borewell-automation
cp .env.docker.example .env
nano .env  # Update domain names, IP addresses, JWT secret, and DB credentials
```

### Step 3: Run Containers in Production
```bash
docker compose up --build -d
```

### Step 4: (Optional) SSL Setup with Nginx & Certbot

To attach SSL/HTTPS to your services on your server using domain names (e.g. `admin.yourdomain.com`, `api.yourdomain.com`):

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure Nginx proxy block:
```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable SSL:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🛠 Common Operations & Maintenance

### Stopping the Services
```bash
docker compose down
```

### Rebuilding a Specific Container (e.g. after code changes in Backend)
```bash
docker compose build backend
docker compose up -d backend
```

### Cleaning Up Unused Docker Resources
```bash
docker system prune -f
```
