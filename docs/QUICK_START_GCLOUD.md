# Quick Start Guide for Google Cloud Deployment

## Prerequisites Checklist
- [ ] Google Cloud VM created (Ubuntu 22.04 LTS, e2-medium or better)
- [ ] SSH access to VM configured
- [ ] Project files on VM (via git clone or scp)

## One-Command Deployment

Once you're on your VM in the project directory:

```bash
chmod +x scripts/deploy-gcloud.sh && ./scripts/deploy-gcloud.sh
```

This script will:
1. Install Docker and Docker Compose
2. Configure environment with your VM's IP
3. Prompt for secure credentials
4. Create volumes and start all services
5. Verify deployment

## Manual Deployment (5 Steps)

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Get Your VM IP and Configure
```bash
export EXTERNAL_IP=$(curl -s ifconfig.me)
echo "Your IP: $EXTERNAL_IP"

cp .env.example .env
nano .env  # Update N8N_HOST and WEBHOOK_URL with your IP
```

### 3. Create Volume
```bash
docker volume create self-hosted-ai-starter-kit_n8n_storage
```

### 4. Start Services
```bash
docker compose up -d
```

### 5. Setup Firewall
```bash
gcloud compute firewall-rules create allow-n8n \
    --allow tcp:5678 \
    --source-ranges 0.0.0.0/0
```

## Access n8n

```
http://YOUR_VM_IP:5678
```

Default credentials (change in `.env`):
- Username: `admin`
- Password: `changeme`

## Essential Commands

### View Status
```bash
docker compose ps                # Container status
docker compose logs -f           # All logs (follow mode)
docker compose logs -f n8n       # n8n logs only
docker stats                     # Resource usage
```

### Control Services
```bash
docker compose start             # Start all services
docker compose stop              # Stop all services
docker compose restart           # Restart all services
docker compose restart n8n       # Restart specific service
docker compose down              # Stop and remove containers
docker compose up -d             # Start in background
```

### Update Deployment
```bash
docker compose pull              # Pull latest images
docker compose up -d             # Recreate containers
```

### Troubleshooting
```bash
# Check if n8n is responding
curl http://localhost:5678

# Check container health
docker compose ps
docker inspect n8n

# View recent errors
docker compose logs --tail=50 n8n

# Restart if stuck
docker compose restart n8n

# Full reset (WARNING: loses data if no backups)
docker compose down -v
docker volume create self-hosted-ai-starter-kit_n8n_storage
docker compose up -d
```

### Backup Database
```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U YOUR_USER n8n_db > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20260122.sql | docker compose exec -T postgres psql -U YOUR_USER n8n_db
```

### Backup n8n Data
```bash
docker run --rm \
  -v self-hosted-ai-starter-kit_n8n_storage:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/n8n_backup_$(date +%Y%m%d).tar.gz -C /data .
```

## Firewall Management

### Create Rules
```bash
# Allow n8n access
gcloud compute firewall-rules create allow-n8n \
    --allow tcp:5678 \
    --source-ranges 0.0.0.0/0

# Allow from specific IP only (more secure)
gcloud compute firewall-rules create allow-n8n \
    --allow tcp:5678 \
    --source-ranges YOUR_IP/32
```

### List Rules
```bash
gcloud compute firewall-rules list
```

### Delete Rule
```bash
gcloud compute firewall-rules delete allow-n8n
```

## Common Issues

### "Cannot connect to n8n"
1. Check firewall: `gcloud compute firewall-rules list | grep n8n`
2. Check container: `docker compose ps`
3. Check logs: `docker compose logs n8n`
4. Verify IP: `curl ifconfig.me`

### "Database connection failed"
1. Check postgres: `docker compose ps postgres`
2. Check logs: `docker compose logs postgres`
3. Verify credentials in `.env`

### "Out of memory"
1. Check usage: `free -h`
2. Upgrade VM instance type
3. Or reduce memory in docker-compose.yml:
   - Change `NODE_OPTIONS=--max-old-space-size=2048`

### "Port already in use"
```bash
# Find what's using port 5678
sudo lsof -i :5678
# Or
sudo netstat -tlnp | grep 5678

# Stop the conflicting service or change port in docker-compose.yml
```

## Security Checklist

- [ ] Change default passwords in `.env`
- [ ] Set up HTTPS with reverse proxy (Nginx/Traefik)
- [ ] Restrict firewall to specific IPs if possible
- [ ] Enable automated backups
- [ ] Keep Docker images updated
- [ ] Monitor logs regularly
- [ ] Use strong authentication
- [ ] Consider using a domain name instead of IP

## Next Steps

1. **Import Workflows**: Upload JSON files from `Example workflows/`
2. **Configure AI**: Set up Gemini API key or Ollama
3. **Setup HTTPS**: Use Nginx reverse proxy with Let's Encrypt
4. **Custom Domain**: Point domain to VM IP
5. **Monitoring**: Set up uptime monitoring
6. **Backups**: Schedule automated backups

## Need Help?

- Full guide: [GOOGLE_CLOUD_DEPLOYMENT.md](GOOGLE_CLOUD_DEPLOYMENT.md)
- n8n docs: https://docs.n8n.io/
- Docker docs: https://docs.docker.com/compose/
