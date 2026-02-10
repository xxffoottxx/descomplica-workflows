# Google Cloud Deployment Checklist

Use this checklist to ensure you have everything ready before deploying to Google Cloud.

## Pre-Deployment Checklist

### 1. Google Cloud Setup
- [ ] Google Cloud account created
- [ ] Project created in Google Cloud Console
- [ ] Billing enabled on the project
- [ ] `gcloud` CLI installed on local machine
- [ ] Authenticated with `gcloud auth login`

### 2. VM Instance
- [ ] VM instance created with these specs:
  - [ ] Machine type: **e2-medium** or better (2 vCPU, 4GB RAM minimum)
  - [ ] Boot disk: **Ubuntu 22.04 LTS** (20GB minimum)
  - [ ] Region/Zone selected (choose closest to users)
  - [ ] HTTP/HTTPS traffic allowed in VM creation
- [ ] VM is running
- [ ] Can SSH into VM successfully
- [ ] External IP noted: `___________________`

### 3. Security Configuration
- [ ] Strong password chosen for n8n admin
- [ ] Strong password chosen for PostgreSQL
- [ ] Firewall rules planned:
  - [ ] Port 5678 for n8n access
  - [ ] Port 5432 for PostgreSQL (optional, only if needed externally)
  - [ ] SSH port 22 (usually pre-configured)

### 4. Domain & DNS (Optional but Recommended)
- [ ] Domain name available
- [ ] DNS provider access
- [ ] A record ready to point to VM IP
- [ ] SSL certificate plan (Let's Encrypt recommended)

### 5. Files & Configuration
- [ ] Project files ready to transfer to VM
- [ ] `.env` file reviewed
- [ ] Sensitive data removed from git repository
- [ ] Workflow JSON files in `Example workflows/` folder
- [ ] API keys available (if using Gemini):
  - [ ] Google Gemini API key: https://ai.google.dev/

### 6. Backup Strategy
- [ ] Backup solution planned for PostgreSQL
- [ ] Backup solution planned for n8n data volume
- [ ] Backup schedule decided
- [ ] Backup storage location chosen

## Deployment Steps

### Option A: Automated Deployment (Recommended)

1. **Transfer files to VM**
```bash
# Using gcloud scp from local machine
gcloud compute scp --recurse . YOUR_VM_NAME:~/descomplica-demos --zone YOUR_ZONE

# Or clone from git on the VM
ssh YOUR_VM_NAME
git clone YOUR_REPO_URL
cd descomplica-demos
```

2. **Run deployment script**
```bash
chmod +x scripts/deploy-gcloud.sh
./scripts/deploy-gcloud.sh
```

3. **Configure firewall**
```bash
gcloud compute firewall-rules create allow-n8n \
    --allow tcp:5678 \
    --source-ranges 0.0.0.0/0
```

4. **Access n8n**
Open browser to: `http://YOUR_VM_IP:5678`

### Option B: Manual Deployment

Follow step-by-step guide in [GOOGLE_CLOUD_DEPLOYMENT.md](GOOGLE_CLOUD_DEPLOYMENT.md)

## Post-Deployment Checklist

### Immediate
- [ ] Can access n8n web interface
- [ ] Can login with configured credentials
- [ ] All containers running: `docker compose ps`
- [ ] No errors in logs: `docker compose logs`
- [ ] PostgreSQL responding: `docker compose exec postgres psql -U admin -d n8n_db -c '\dt'`
- [ ] Redis responding: `docker compose exec redis redis-cli ping`

### First Hour
- [ ] Import test workflow from `Example workflows/`
- [ ] Test workflow execution
- [ ] Verify webhooks work with external URL
- [ ] Check resource usage: `docker stats`
- [ ] Review logs for any warnings

### First Day
- [ ] Set up monitoring/alerting
- [ ] Configure automated backups
- [ ] Test backup and restore process
- [ ] Document any custom configurations
- [ ] Share access details with team (if applicable)

### First Week
- [ ] Review resource usage patterns
- [ ] Optimize VM size if needed
- [ ] Set up HTTPS with reverse proxy
- [ ] Configure custom domain (if applicable)
- [ ] Set up log rotation
- [ ] Test disaster recovery procedure

## Security Hardening (Recommended)

### Essential
- [ ] Change all default passwords
- [ ] Enable n8n basic authentication
- [ ] Restrict firewall to specific IPs (if possible)
- [ ] Keep Docker and system packages updated

### Recommended
- [ ] Set up HTTPS/SSL with Let's Encrypt
- [ ] Use reverse proxy (Nginx/Traefik)
- [ ] Enable fail2ban for SSH protection
- [ ] Set up automated security updates
- [ ] Configure log monitoring

### Advanced
- [ ] Implement VPN for admin access
- [ ] Use secrets management (Google Secret Manager)
- [ ] Enable audit logging
- [ ] Set up intrusion detection
- [ ] Regular security audits

## Monitoring & Maintenance

### Daily
- [ ] Check service status: `docker compose ps`
- [ ] Review error logs: `docker compose logs --tail=50`
- [ ] Monitor disk space: `df -h`

### Weekly
- [ ] Review all logs for issues
- [ ] Check backup success
- [ ] Monitor resource usage trends
- [ ] Update Docker images if needed

### Monthly
- [ ] Test backup restoration
- [ ] Review and rotate logs
- [ ] Update system packages
- [ ] Review security configurations
- [ ] Optimize based on usage patterns

## Troubleshooting Quick Reference

### Service won't start
```bash
docker compose logs SERVICE_NAME
docker compose restart SERVICE_NAME
```

### Can't access n8n
1. Check firewall: `gcloud compute firewall-rules list`
2. Check container: `docker compose ps n8n`
3. Check port: `curl http://localhost:5678`

### Database connection issues
```bash
docker compose logs postgres
docker compose exec postgres psql -U admin -l
```

### Out of memory
```bash
free -h
docker stats
# Consider upgrading VM or reducing NODE_OPTIONS in docker-compose.yml
```

### Reset everything (nuclear option)
```bash
# WARNING: This deletes all data!
docker compose down -v
docker volume create self-hosted-ai-starter-kit_n8n_storage
# Edit .env with correct configuration
docker compose up -d
```

## Useful Commands Reference

```bash
# View logs
docker compose logs -f

# Check status
docker compose ps

# Restart service
docker compose restart n8n

# Stop all
docker compose down

# Start all
docker compose up -d

# Update images
docker compose pull && docker compose up -d

# Backup database
docker compose exec postgres pg_dump -U admin n8n_db > backup.sql

# Check resource usage
docker stats

# VM info
gcloud compute instances describe YOUR_VM_NAME

# SSH to VM
gcloud compute ssh YOUR_VM_NAME
```

## Support Resources

- **Full Deployment Guide**: [GOOGLE_CLOUD_DEPLOYMENT.md](GOOGLE_CLOUD_DEPLOYMENT.md)
- **Quick Start**: [QUICK_START_GCLOUD.md](QUICK_START_GCLOUD.md)
- **n8n Documentation**: https://docs.n8n.io/
- **Docker Compose Docs**: https://docs.docker.com/compose/
- **Google Cloud Docs**: https://cloud.google.com/compute/docs

## Emergency Contacts

Document your emergency contacts and escalation procedures:

- **Cloud Admin**: ________________
- **DevOps Lead**: ________________
- **On-Call**: ________________

## Notes

Use this space to document deployment-specific details:

```
VM Name: ____________________
VM Zone: ____________________
External IP: ____________________
Domain: ____________________
Deployment Date: ____________________
Deployed By: ____________________
Special Configurations: ____________________
```
