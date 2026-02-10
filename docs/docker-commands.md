# Docker Commands Reference

Quick reference for common Docker operations in this project.

## Starting and Stopping

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d n8n

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️  deletes all data)
docker-compose down -v
```

## Viewing Logs

```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f n8n

# View last 100 lines
docker-compose logs --tail=100
```

## Service Status

```bash
# Check running containers
docker-compose ps

# View resource usage
docker stats
```

## Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart n8n
```

## Accessing Containers

```bash
# Access n8n container shell
docker-compose exec n8n sh

# Access PostgreSQL
docker-compose exec postgres psql -U admin -d ai_agents_db

# Access Redis CLI
docker-compose exec redis redis-cli
```

## Rebuilding

```bash
# Rebuild and restart (if Dockerfile changes)
docker-compose up -d --build

# Force recreate containers
docker-compose up -d --force-recreate
```

## Backup and Restore

### PostgreSQL Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U admin ai_agents_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U admin ai_agents_db < backup.sql
```

### n8n Data Backup
```bash
# Backup n8n data (workflows, credentials, etc.)
docker-compose exec n8n tar -czf /tmp/n8n-backup.tar.gz /home/node/.n8n
docker cp n8n:/tmp/n8n-backup.tar.gz ./n8n-backup.tar.gz
```

## Troubleshooting

### Clear Everything and Start Fresh
```bash
docker-compose down -v
docker-compose up -d
```

### Check if ports are in use
```bash
# Linux/Mac
lsof -i :5678
lsof -i :5432
lsof -i :6379

# Windows
netstat -ano | findstr :5678
```

### View container resource limits
```bash
docker-compose config
```

### Remove all stopped containers and unused images
```bash
docker system prune -a
```

## Environment Variables

View current environment variables for a service:
```bash
docker-compose exec n8n env
```

## Network Operations

```bash
# List networks
docker network ls

# Inspect network
docker network inspect megaloja-demo-vendas_ai-agents-network

# View connected containers
docker network inspect megaloja-demo-vendas_ai-agents-network --format='{{json .Containers}}'
```
