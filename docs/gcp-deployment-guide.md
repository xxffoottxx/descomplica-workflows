# Google Cloud Platform Deployment Guide

This guide covers deploying your AI agents platform to Google Cloud VM with Gemini API integration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [VM Setup](#vm-setup)
3. [Deployment](#deployment)
4. [Network Configuration](#network-configuration)
5. [Security](#security)
6. [Monitoring](#monitoring)
7. [Backup & Recovery](#backup--recovery)
8. [Cost Optimization](#cost-optimization)

## Prerequisites

### Google Cloud Resources
- ✅ Google Cloud Platform account
- ✅ Google Cloud VM (Compute Engine)
- ✅ Gemini API access & API key

### Required Tools
- `gcloud` CLI installed locally
- SSH access to your VM
- Domain name (optional, for production)

## VM Setup

### Recommended VM Specifications

**Development/Testing:**
```
Machine type: e2-medium (2 vCPU, 4 GB memory)
Boot disk: 30 GB SSD
OS: Ubuntu 22.04 LTS
Region: Choose closest to your users
```

**Production:**
```
Machine type: e2-standard-2 (2 vCPU, 8 GB memory)
Boot disk: 50 GB SSD
OS: Ubuntu 22.04 LTS
Region: Choose closest to your users
Enable automatic restart: Yes
On host maintenance: Migrate VM instance
```

### Creating VM via gcloud CLI

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create VM
gcloud compute instances create ai-agents-vm \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-ssd \
  --tags=http-server,https-server,n8n-server \
  --metadata=startup-script='#!/bin/bash
    apt-get update
    apt-get install -y docker.io docker-compose git
    systemctl enable docker
    systemctl start docker
    usermod -aG docker $USER'

# SSH into VM
gcloud compute ssh ai-agents-vm --zone=us-central1-a
```

### Manual VM Setup (via Console)

1. Go to **Compute Engine > VM Instances**
2. Click **Create Instance**
3. Configure:
   - **Name**: `ai-agents-vm`
   - **Region**: `us-central1` (or closest to users)
   - **Machine type**: `e2-medium`
   - **Boot disk**: Ubuntu 22.04 LTS, 30 GB SSD
   - **Firewall**: Allow HTTP, HTTPS traffic
4. Click **Create**

## Initial Server Configuration

### 1. Connect to VM

```bash
# Via gcloud
gcloud compute ssh ai-agents-vm --zone=us-central1-a

# Or via SSH (if you have external IP)
ssh username@EXTERNAL_IP
```

### 2. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
# SSH back in
```

### 4. Install Git

```bash
sudo apt install git -y
```

### 5. Configure Firewall (GCP Firewall Rules)

```bash
# Create firewall rule for n8n
gcloud compute firewall-rules create allow-n8n \
  --allow tcp:5678 \
  --target-tags n8n-server \
  --description "Allow n8n web interface"

# Create firewall rule for demo site
gcloud compute firewall-rules create allow-demo-site \
  --allow tcp:8080 \
  --target-tags n8n-server \
  --description "Allow demo site access"

# Optional: PostgreSQL (only if needed externally)
# gcloud compute firewall-rules create allow-postgres \
#   --allow tcp:5432 \
#   --source-ranges YOUR_IP/32 \
#   --target-tags n8n-server \
#   --description "Allow PostgreSQL access"
```

## Deployment

### 1. Clone Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Or if private repo
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your actual values
nano .env
```

**Key configurations for GCP:**

```bash
# n8n Configuration
N8N_HOST=YOUR_EXTERNAL_IP  # or your domain
N8N_PROTOCOL=http          # Change to https if using SSL
WEBHOOK_URL=http://YOUR_EXTERNAL_IP:5678/
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=your_admin_username
N8N_BASIC_AUTH_PASSWORD=your_strong_password

# PostgreSQL
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_database_password
POSTGRES_DB=ai_agents_db

# Gemini API (Your actual API key)
GOOGLE_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
LLM_PROVIDER=gemini

# Ollama (optional, for local testing)
# Leave these even if using Gemini primarily
OLLAMA_HOST=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2
```

### 3. Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Verify Deployment

```bash
# Check n8n is running
curl http://localhost:5678

# Check from your local machine
curl http://YOUR_EXTERNAL_IP:5678
```

## Network Configuration

### Get Your External IP

```bash
# From within VM
curl -s http://checkip.amazonaws.com

# From local machine
gcloud compute instances describe ai-agents-vm \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

### Reserve Static IP (Recommended for Production)

```bash
# Create static IP
gcloud compute addresses create ai-agents-static-ip \
  --region=us-central1

# Get the IP address
gcloud compute addresses describe ai-agents-static-ip \
  --region=us-central1 \
  --format='get(address)'

# Assign to VM
gcloud compute instances delete-access-config ai-agents-vm \
  --zone=us-central1-a \
  --access-config-name="external-nat"

gcloud compute instances add-access-config ai-agents-vm \
  --zone=us-central1-a \
  --access-config-name="external-nat" \
  --address=STATIC_IP_ADDRESS
```

### Domain Configuration

If you have a domain:

1. **Add DNS A Record**
   - Point to your VM's external IP
   - Example: `agents.yourdomain.com` → `YOUR_EXTERNAL_IP`

2. **Update .env**
   ```bash
   N8N_HOST=agents.yourdomain.com
   WEBHOOK_URL=https://agents.yourdomain.com/
   ```

3. **Setup SSL** (See SSL/HTTPS section below)

### SSL/HTTPS Setup with Let's Encrypt

**Option 1: Using Nginx Reverse Proxy**

```bash
# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/n8n

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name agents.yourdomain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Webhook support
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d agents.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

**Option 2: Using Traefik (Docker)**

See [docs/traefik-ssl-setup.md](./traefik-ssl-setup.md) for Traefik configuration.

## Security

### 1. Firewall Best Practices

```bash
# Only allow necessary ports
gcloud compute firewall-rules list --filter="targetTags:n8n-server"

# Restrict PostgreSQL access to specific IPs only
gcloud compute firewall-rules create allow-postgres-limited \
  --allow tcp:5432 \
  --source-ranges YOUR_OFFICE_IP/32 \
  --target-tags n8n-server
```

### 2. Secure .env File

```bash
# Set proper permissions
chmod 600 .env

# Never commit .env to git
# Already in .gitignore, but verify:
cat .gitignore | grep .env
```

### 3. Enable n8n Basic Auth

Already configured in `.env`:
```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=your_admin_username
N8N_BASIC_AUTH_PASSWORD=your_strong_password
```

### 4. Regular Updates

```bash
# Create update script
nano ~/update-services.sh
```

```bash
#!/bin/bash
cd ~/YOUR_REPO
docker-compose pull
docker-compose up -d
docker system prune -f
```

```bash
chmod +x ~/update-services.sh

# Run weekly
sudo crontab -e
# Add: 0 2 * * 0 /home/USERNAME/update-services.sh
```

### 5. SSH Hardening

```bash
# Disable password authentication (use SSH keys only)
sudo nano /etc/ssh/sshd_config

# Set:
# PasswordAuthentication no
# PubkeyAuthentication yes

sudo systemctl restart sshd
```

### 6. API Key Security

- Store Gemini API key only in `.env`
- Never commit to git
- Rotate keys regularly
- Monitor API usage in Google Cloud Console

## Monitoring

### 1. Docker Monitoring

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f n8n
docker-compose logs -f postgres

# Resource usage
docker stats

# Create monitoring script
nano ~/check-services.sh
```

```bash
#!/bin/bash
echo "=== Container Status ==="
docker-compose ps

echo -e "\n=== Resource Usage ==="
docker stats --no-stream

echo -e "\n=== Disk Usage ==="
df -h

echo -e "\n=== Recent n8n logs ==="
docker-compose logs --tail=20 n8n
```

### 2. Google Cloud Monitoring

```bash
# Install monitoring agent
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install

# View metrics in GCP Console
# Operations > Monitoring > Dashboards
```

### 3. Uptime Monitoring

Use Google Cloud Monitoring uptime checks:

1. Go to **Monitoring > Uptime checks**
2. Create check for `http://YOUR_IP:5678`
3. Set alert policy for downtime

### 4. Log Management

```bash
# Rotate Docker logs
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
docker-compose restart
```

## Backup & Recovery

### 1. Database Backup

```bash
# Create backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U admin ai_agents_db | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup n8n data
docker-compose exec -T n8n tar -czf - /home/node/.n8n > $BACKUP_DIR/n8n_backup_$DATE.tar.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x ~/backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 3 * * * /home/USERNAME/backup-db.sh
```

### 2. Backup to Google Cloud Storage

```bash
# Install gsutil (if not already)
sudo apt install google-cloud-sdk -y

# Authenticate
gcloud auth login

# Create bucket
gsutil mb -l us-central1 gs://YOUR-BUCKET-NAME-backups

# Update backup script to upload
nano ~/backup-db.sh
# Add at end:
# gsutil cp $BACKUP_DIR/*_$DATE.sql.gz gs://YOUR-BUCKET-NAME-backups/
```

### 3. Configuration Backup

```bash
# Backup .env and docker-compose.yml
cp .env ~/backups/env_$DATE
cp docker-compose.yml ~/backups/docker-compose_$DATE.yml

# Upload to GCS
gsutil cp ~/backups/env_$DATE gs://YOUR-BUCKET-NAME-backups/config/
```

### 4. Restore Procedure

```bash
# Download backup from GCS
gsutil cp gs://YOUR-BUCKET-NAME-backups/db_backup_TIMESTAMP.sql.gz ~/restore/

# Restore database
gunzip ~/restore/db_backup_TIMESTAMP.sql.gz
docker-compose exec -T postgres psql -U admin ai_agents_db < ~/restore/db_backup_TIMESTAMP.sql

# Restore n8n data
docker-compose down
docker volume rm YOUR_REPO_n8n_data
docker-compose up -d
docker-compose exec -T n8n tar -xzf - -C / < ~/restore/n8n_backup_TIMESTAMP.tar.gz
docker-compose restart n8n
```

## Cost Optimization

### 1. VM Right-Sizing

**Development/Testing:**
- Use **e2-micro** (free tier eligible: 1 instance per month)
  - 0.25-2 vCPU, 1 GB memory
  - Good for light testing
  - Free tier: ~$5/month savings

**Production:**
- Start with **e2-medium**, scale up if needed
- Monitor CPU/memory usage
- Consider committed use discounts (1 or 3 year)

### 2. Disk Optimization

```bash
# Use standard persistent disk instead of SSD for non-critical data
# Standard: $0.04/GB/month
# SSD: $0.17/GB/month

# Clean up old Docker images
docker system prune -a -f

# Monitor disk usage
df -h
```

### 3. Network Optimization

- Keep VM in same region as your users (reduces latency & cost)
- Use GCP internal networking when possible
- Monitor egress costs (first 1 TB free per month)

### 4. Gemini API Cost Management

**Free Tier Limits (as of 2024):**
- 15 requests per minute
- 1 million tokens per minute (input)
- 32,000 tokens per minute (output)

**Best Practices:**
- Implement caching for repeated queries
- Use Ollama for development/testing
- Monitor usage in Google Cloud Console
- Set up budget alerts

**Set Budget Alert:**
```bash
# Via Cloud Console
# Billing > Budgets & alerts > Create budget
# Set alert at 50%, 90%, 100% of expected usage
```

### 5. Scheduled Shutdown (Development Only)

```bash
# Stop VM during non-business hours
# Create shutdown schedule
gcloud compute instances add-resource-policies ai-agents-vm \
  --resource-policies=SCHEDULE_NAME \
  --zone=us-central1-a

# Or use cron to stop services
# crontab -e
# 0 22 * * * docker-compose down  # Stop at 10 PM
# 0 8 * * * docker-compose up -d  # Start at 8 AM
```

### 6. Cost Monitoring

```bash
# Check current costs
gcloud billing accounts list
gcloud billing budgets list

# Export billing to BigQuery for analysis
# Billing > Billing export > Configure
```

## Automated Deployment Script

Create a one-command deployment:

```bash
nano ~/deploy.sh
```

```bash
#!/bin/bash
set -e

echo "=== AI Agents Platform - GCP Deployment ==="

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt install docker-compose -y
fi

# Clone or update repo
if [ -d "~/ai-agents-demo" ]; then
    echo "Updating repository..."
    cd ~/ai-agents-demo
    git pull
else
    echo "Cloning repository..."
    cd ~
    git clone YOUR_REPO_URL ai-agents-demo
    cd ai-agents-demo
fi

# Setup environment
if [ ! -f ".env" ]; then
    echo "Setting up environment..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
    nano .env
fi

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Show status
echo -e "\n=== Deployment Complete! ==="
docker-compose ps

echo -e "\n=== Access URLs ==="
EXTERNAL_IP=$(curl -s http://checkip.amazonaws.com)
echo "n8n: http://$EXTERNAL_IP:5678"
echo "Demo Site: http://$EXTERNAL_IP:8080"

echo -e "\n=== Next Steps ==="
echo "1. Access n8n and create your first workflow"
echo "2. Check logs: docker-compose logs -f"
echo "3. Setup backups: ~/backup-db.sh"
echo "4. Configure SSL: See docs/gcp-deployment-guide.md"
```

```bash
chmod +x ~/deploy.sh
```

## Quick Reference Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f n8n

# Update services
git pull && docker-compose pull && docker-compose up -d

# Backup database
~/backup-db.sh

# Check status
docker-compose ps && docker stats --no-stream

# Clean up
docker system prune -a -f
```

## Troubleshooting

### Issue: Can't connect to n8n

```bash
# Check if services are running
docker-compose ps

# Check firewall
gcloud compute firewall-rules list --filter="targetTags:n8n-server"

# Check port is listening
sudo netstat -tulpn | grep 5678

# Check logs
docker-compose logs n8n
```

### Issue: Out of disk space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a -f

# Remove old backups
find ~/backups -name "*.gz" -mtime +30 -delete
```

### Issue: Gemini API errors

```bash
# Verify API key
echo $GOOGLE_API_KEY

# Test directly
curl -X POST \
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# Check quota in Cloud Console
# APIs & Services > Dashboard > Gemini API
```

### Issue: High memory usage

```bash
# Check memory
free -h

# Check container usage
docker stats

# Restart specific service
docker-compose restart n8n

# Consider upgrading VM
gcloud compute instances set-machine-type ai-agents-vm \
  --machine-type e2-standard-2 \
  --zone us-central1-a
```

## Additional Resources

- [Google Cloud Documentation](https://cloud.google.com/docs)
- [n8n Documentation](https://docs.n8n.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [GCP Pricing Calculator](https://cloud.google.com/products/calculator)

## Support

For issues specific to this deployment:
1. Check logs: `docker-compose logs -f`
2. Review this documentation
3. Check GCP Console for alerts
4. Review [docs/troubleshooting.md](./troubleshooting.md)
