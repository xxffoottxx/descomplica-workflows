# Google Cloud VM Deployment Guide

This guide walks you through deploying the n8n starter kit on a Google Cloud VM using Docker.

## Step 1: Prepare Your Google Cloud VM

### 1.1 Create a VM Instance (if not already done)

```bash
# Recommended specs:
# - Machine type: e2-medium or better (2 vCPU, 4GB RAM minimum)
# - Boot disk: Ubuntu 22.04 LTS (20GB minimum)
# - Firewall: Allow HTTP and HTTPS traffic
```

### 1.2 Connect to Your VM

```bash
# From your local machine
gcloud compute ssh YOUR_VM_NAME --zone YOUR_ZONE

# Or use the SSH button in Google Cloud Console
```

## Step 2: Install Docker and Docker Compose on VM

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER

# Apply group changes (or logout and login again)
newgrp docker

# Verify installation
docker --version
docker compose version
```

## Step 3: Configure Google Cloud Firewall

### 3.1 Create Firewall Rule for n8n

```bash
# Allow port 5678 for n8n
gcloud compute firewall-rules create allow-n8n \
    --allow tcp:5678 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow n8n access"

# Optional: Allow PostgreSQL (only if you need external access)
gcloud compute firewall-rules create allow-postgres \
    --allow tcp:5432 \
    --source-ranges YOUR_IP/32 \
    --description "Allow PostgreSQL access from specific IP"
```

### 3.2 Get Your VM's External IP

```bash
# From your VM
curl ifconfig.me

# Or from Google Cloud Console
gcloud compute instances describe YOUR_VM_NAME --zone YOUR_ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

## Step 4: Transfer Files to Google Cloud VM

### Option A: Using Git (Recommended)

```bash
# On your VM
cd ~
git clone YOUR_REPOSITORY_URL
cd descomplica-demos
```

### Option B: Using gcloud SCP

```bash
# From your local machine (in the project directory)
gcloud compute scp --recurse . YOUR_VM_NAME:~/descomplica-demos --zone YOUR_ZONE
```

### Option C: Using rsync (if available)

```bash
# From your local machine
gcloud compute config-ssh
rsync -avz --exclude '.git' --exclude 'node_modules' . YOUR_VM_NAME.YOUR_ZONE.YOUR_PROJECT:~/descomplica-demos/
```

## Step 5: Configure Environment for Cloud Deployment

```bash
# On your VM, navigate to project directory
cd ~/descomplica-demos

# Copy environment template
cp .env.example .env

# Edit the .env file
nano .env
```

### Update these critical values in `.env`:

```bash
# Get your VM's external IP first
EXTERNAL_IP=$(curl -s ifconfig.me)

# n8n Configuration - UPDATE THESE
N8N_HOST=YOUR_VM_EXTERNAL_IP        # Replace with actual IP
N8N_PROTOCOL=http                   # Use https if you set up SSL
WEBHOOK_URL=http://YOUR_VM_EXTERNAL_IP:5678/

# Security - CHANGE THESE!
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=your_secure_username
N8N_BASIC_AUTH_PASSWORD=your_secure_password

# PostgreSQL - CHANGE THESE!
POSTGRES_USER=n8n_user
POSTGRES_PASSWORD=your_secure_postgres_password
POSTGRES_DB=n8n_db

# Timezone
TIMEZONE=America/Sao_Paulo  # Or your timezone

# AI Services (if using Gemini)
GOOGLE_API_KEY=your_google_api_key_here
LLM_PROVIDER=gemini  # or ollama if running locally
```

## Step 6: Create Required Docker Volume

```bash
# Create the external volume referenced in docker-compose.yml
docker volume create self-hosted-ai-starter-kit_n8n_storage
```

## Step 7: Deploy the Services

```bash
# Pull the latest images
docker compose pull

# Start all services in detached mode
docker compose up -d

# Check if containers are running
docker compose ps

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f n8n
```

## Step 8: Access n8n

Open your browser and navigate to:
```
http://YOUR_VM_EXTERNAL_IP:5678
```

Login with the credentials you set in `.env`:
- Username: `your_secure_username`
- Password: `your_secure_password`

## Step 9: Verify Services

```bash
# Check all containers are healthy
docker compose ps

# Test n8n
curl http://localhost:5678

# Test PostgreSQL connection
docker compose exec postgres psql -U YOUR_POSTGRES_USER -d n8n_db -c '\dt'

# Test Redis
docker compose exec redis redis-cli ping
```

## Troubleshooting

### Containers not starting

```bash
# Check logs for errors
docker compose logs

# Check specific service
docker compose logs n8n
docker compose logs postgres

# Restart services
docker compose restart
```

### Can't access n8n from browser

```bash
# Verify firewall rule exists
gcloud compute firewall-rules list | grep n8n

# Check if n8n is listening
docker compose exec n8n netstat -tlnp | grep 5678

# Check VM external IP
curl ifconfig.me
```

### Database connection issues

```bash
# Check if postgres is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Verify database exists
docker compose exec postgres psql -U YOUR_POSTGRES_USER -l
```

### Memory issues

```bash
# Check VM memory
free -h

# If low on memory, consider upgrading VM or adjusting NODE_OPTIONS
# Edit docker-compose.yml and reduce:
NODE_OPTIONS=--max-old-space-size=2048  # Instead of 4096
```

## Maintenance Commands

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v

# Restart services
docker compose restart

# Update to latest images
docker compose pull
docker compose up -d

# View resource usage
docker stats

# Clean up unused Docker resources
docker system prune -a
```

## Security Best Practices

### 1. Set up HTTPS with Let's Encrypt (Recommended)

Consider using a reverse proxy like Nginx or Traefik with SSL certificates.

### 2. Restrict Firewall Rules

```bash
# Instead of 0.0.0.0/0, use your specific IP
gcloud compute firewall-rules update allow-n8n \
    --source-ranges YOUR_IP/32
```

### 3. Use Strong Passwords

Always change default passwords in `.env` file.

### 4. Regular Backups

```bash
# Backup PostgreSQL database
docker compose exec postgres pg_dump -U YOUR_POSTGRES_USER n8n_db > backup_$(date +%Y%m%d).sql

# Backup n8n data
docker run --rm -v self-hosted-ai-starter-kit_n8n_storage:/data -v $(pwd):/backup alpine tar czf /backup/n8n_backup_$(date +%Y%m%d).tar.gz -C /data .
```

### 5. Monitor Logs

```bash
# Set up log rotation
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Then restart Docker:
```bash
sudo systemctl restart docker
```

## Next Steps

1. Import your workflows from [Example workflows](Example%20workflows/)
2. Configure AI services (Ollama or Gemini)
3. Set up SSL/HTTPS for production use
4. Configure domain name instead of IP address
5. Set up automated backups
6. Monitor resource usage and scale VM if needed

## Useful Links

- [n8n Documentation](https://docs.n8n.io/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Google Cloud Firewall Rules](https://cloud.google.com/vpc/docs/firewalls)
