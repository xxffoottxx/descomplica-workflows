# Deploy Fresh n8n to Your Google Cloud VM

**VM Details:**
- Name: `descomplica-demo`
- Zone: `europe-southwest1-b`
- External IP: `34.175.249.49`

## Step 1: Connect to Your VM

```bash
gcloud compute ssh descomplica-demo --zone europe-southwest1-b
```

## Step 2: Install Docker on VM

Once connected to your VM, run these commands:

```bash
# Update system
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify installation
docker --version
docker compose version
```

## Step 3: Create Fresh n8n Setup

Create a new directory for the n8n installation:

```bash
mkdir -p ~/n8n-fresh
cd ~/n8n-fresh
```

Create the docker-compose.yml file:

```bash
cat > docker-compose.yml <<'EOF'
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=34.175.249.49
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - N8N_LOG_LEVEL=info
      - WEBHOOK_URL=http://34.175.249.49:5678/
      - GENERIC_TIMEZONE=Europe/Lisbon
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_BASIC_AUTH_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_BASIC_AUTH_PASSWORD}
      # Database
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      # AI Services
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - GEMINI_MODEL=gemini-1.5-flash
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - n8n-network
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    container_name: n8n-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n-network

volumes:
  n8n_data:
  postgres_data:

networks:
  n8n-network:
    driver: bridge
EOF
```

Create the .env file:

```bash
cat > .env <<'EOF'
# n8n Authentication - CHANGE THESE!
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=YourSecurePassword123!

# PostgreSQL Configuration - CHANGE THESE!
POSTGRES_USER=n8n_user
POSTGRES_PASSWORD=YourSecureDBPassword456!
POSTGRES_DB=n8n_db

# Google Gemini API Key (optional)
GOOGLE_API_KEY=your_google_api_key_here
EOF
```

## Step 4: Configure Security

Edit the .env file with secure passwords:

```bash
nano .env
```

**Important**: Change these values:
- `N8N_BASIC_AUTH_USER`: Your admin username
- `N8N_BASIC_AUTH_PASSWORD`: Strong password for n8n login
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Strong database password
- `GOOGLE_API_KEY`: Your Google API key (if using Gemini)

Save with `CTRL+X`, then `Y`, then `Enter`

## Step 5: Setup Firewall Rule

**From your local machine**, run:

```bash
gcloud compute firewall-rules create allow-n8n \
    --allow tcp:5678 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow n8n web access"
```

Or restrict to your IP only (more secure):

```bash
gcloud compute firewall-rules create allow-n8n \
    --allow tcp:5678 \
    --source-ranges YOUR_IP_ADDRESS/32 \
    --description "Allow n8n web access from specific IP"
```

## Step 6: Deploy n8n

**Back on your VM**, start the services:

```bash
# Pull the images
docker compose pull

# Start in background
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

Wait about 30 seconds for n8n to fully start.

## Step 7: Access n8n

Open your browser and go to:

```
http://34.175.249.49:5678
```

Login with the credentials you set in `.env`:
- Username: (what you set for `N8N_BASIC_AUTH_USER`)
- Password: (what you set for `N8N_BASIC_AUTH_PASSWORD`)

## Verification Commands

```bash
# Check if containers are running
docker compose ps

# Should show both n8n and postgres as "Up"

# Check n8n logs
docker compose logs n8n

# Check database
docker compose exec postgres psql -U n8n_user -d n8n_db -c '\dt'

# Test from VM
curl http://localhost:5678
```

## Useful Management Commands

```bash
# View logs (follow mode)
docker compose logs -f

# Restart n8n
docker compose restart n8n

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Update to latest version
docker compose pull
docker compose up -d

# Backup database
docker compose exec postgres pg_dump -U n8n_user n8n_db > backup_$(date +%Y%m%d).sql

# Check resource usage
docker stats
```

## Troubleshooting

### Can't access n8n from browser

1. **Check firewall rule exists:**
```bash
gcloud compute firewall-rules list | grep n8n
```

2. **Check containers are running:**
```bash
docker compose ps
```

3. **Check n8n logs for errors:**
```bash
docker compose logs n8n
```

4. **Test locally on VM:**
```bash
curl http://localhost:5678
```

### Database connection errors

```bash
# Check postgres is running
docker compose ps postgres

# Check postgres logs
docker compose logs postgres

# Try connecting manually
docker compose exec postgres psql -U n8n_user -d n8n_db
```

### Reset everything (if needed)

```bash
# WARNING: This deletes all data!
docker compose down -v
docker compose up -d
```

## Import Your Workflows

Once n8n is running, you can import your workflows:

1. Go to `http://34.175.249.49:5678`
2. Click on "Workflows" in the menu
3. Click "Import from File"
4. Upload your JSON files from `Example workflows/`

## Next Steps

1. ✅ Set up automated backups
2. ✅ Configure HTTPS with Let's Encrypt (recommended for production)
3. ✅ Set up a custom domain name
4. ✅ Configure monitoring/alerting
5. ✅ Import your existing workflows

## Security Recommendations

1. **Use HTTPS**: Set up a reverse proxy (Nginx) with Let's Encrypt SSL
2. **Restrict Firewall**: Limit access to specific IPs instead of 0.0.0.0/0
3. **Strong Passwords**: Use complex passwords in .env
4. **Regular Backups**: Schedule automated database backups
5. **Updates**: Keep Docker images updated regularly

## Backup Script

Create a backup script:

```bash
cat > ~/backup-n8n.sh <<'EOF'
#!/bin/bash
BACKUP_DIR=~/n8n-backups
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
cd ~/n8n-fresh
docker compose exec -T postgres pg_dump -U n8n_user n8n_db > $BACKUP_DIR/n8n_db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "n8n_db_*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/n8n_db_$DATE.sql"
EOF

chmod +x ~/backup-n8n.sh
```

Run backup manually:
```bash
~/backup-n8n.sh
```

Schedule daily backups:
```bash
crontab -e
# Add this line:
0 2 * * * ~/backup-n8n.sh
```

## Support

- n8n Documentation: https://docs.n8n.io/
- Docker Docs: https://docs.docker.com/compose/
- Your VM Console: https://console.cloud.google.com/compute/instances
