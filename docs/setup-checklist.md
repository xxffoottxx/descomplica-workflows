# Setup Information Checklist

This checklist helps you gather all the information needed to configure your AI agents platform with Google Cloud VM and Gemini API.

## ✅ Information Collection Checklist

### 1. Google Cloud VM Information

#### External IP Address
**What it is:** The public IP address of your VM where n8n will be accessible

**How to find it:**

**Option A - Via Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Compute Engine > VM Instances**
3. Look for your VM in the list
4. The **External IP** column shows your IP (e.g., `34.123.45.67`)

**Option B - Via Command Line (if gcloud CLI installed):**
```bash
gcloud compute instances list
```
Look for the **EXTERNAL_IP** column

**Option C - From inside the VM (SSH):**
```bash
curl -s http://checkip.amazonaws.com
```

**What to save:**
```
VM_EXTERNAL_IP=_____._____._____.____
```

---

#### VM Region/Zone
**What it is:** The geographic location where your VM runs

**How to find it:**

**Via Google Cloud Console:**
1. **Compute Engine > VM Instances**
2. Click on your VM name
3. Look for **Zone** (e.g., `us-central1-a`)

**Via Command Line:**
```bash
gcloud compute instances list --format="table(name,zone)"
```

**What to save:**
```
VM_ZONE=________________  (e.g., us-central1-a)
VM_REGION=______________  (e.g., us-central1)
```

---

#### VM Specifications
**What it is:** Your VM's machine type, CPU, and memory

**How to find it:**
1. **Compute Engine > VM Instances**
2. Click on your VM
3. Look for **Machine type** (e.g., `e2-medium (2 vCPU, 4 GB memory)`)

**What to save:**
```
VM_MACHINE_TYPE=________  (e.g., e2-medium)
VM_CPU=_____              (e.g., 2)
VM_MEMORY=_____           (e.g., 4 GB)
```

---

#### SSH Connection Details
**What it is:** How to connect to your VM

**How to find it:**

**Via Google Cloud Console:**
1. **Compute Engine > VM Instances**
2. Click **SSH** button next to your VM (opens terminal)
3. Or click the dropdown next to SSH and select "View gcloud command":
   ```bash
   gcloud compute ssh VM_NAME --zone=ZONE
   ```

**What to save:**
```
VM_NAME=________________
SSH_USERNAME=___________  (usually your Google account username)
SSH_COMMAND=____________  (the full gcloud compute ssh command)
```

---

### 2. Google Gemini API Information

#### API Key
**What it is:** Your authentication key for Gemini API

**How to get it:**

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click **Get API Key** button (top right)
3. If you don't have a project:
   - Click **Create API key in new project**
   - Wait for key generation
4. If you have existing projects:
   - Select project or create new one
   - Click **Create API key**
5. Copy the key (starts with `AIza...`)

**Important:** Keep this secret! Don't share or commit to git.

**What to save:**
```
GOOGLE_API_KEY=AIza________________________
```

---

#### API Quota & Limits
**What it is:** Your API usage limits

**How to check:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services > Dashboard**
3. Find "Generative Language API" (Gemini)
4. Click on it
5. Go to **Quotas** tab
6. Check your limits:
   - Requests per minute
   - Tokens per minute
   - Daily quota

**Default Free Tier (as of 2024):**
- 15 requests per minute
- 1 million input tokens per minute
- 32,000 output tokens per minute

**What to save:**
```
GEMINI_RATE_LIMIT=_____ requests/minute
GEMINI_DAILY_LIMIT=_____ requests/day (if applicable)
```

---

#### Enabled APIs
**What it is:** Verify Gemini API is enabled in your project

**How to verify:**

1. [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services > Enabled APIs & services**
3. Search for "Generative Language API" or "Gemini"
4. Should show **API enabled**

**If not enabled:**
1. Go to **APIs & Services > Library**
2. Search "Generative Language API"
3. Click on it
4. Click **Enable**

**What to save:**
```
API_ENABLED=Yes/No
PROJECT_ID=________________
```

---

### 3. Google Cloud Project Information

#### Project ID
**What it is:** Your Google Cloud project identifier

**How to find it:**

**Via Console:**
1. Look at the top of any Google Cloud Console page
2. Project name is shown, click it
3. A dialog shows all projects with their IDs
4. Copy your **Project ID** (not the name)

**Via Command Line:**
```bash
gcloud config get-value project
```

**What to save:**
```
GCP_PROJECT_ID=________________
```

---

#### Billing Status
**What it is:** Verify billing is enabled for API usage

**How to check:**

1. [Billing Console](https://console.cloud.google.com/billing)
2. Check if project has billing account linked
3. View current charges under **Cost breakdown**

**What to verify:**
- [ ] Billing account is linked
- [ ] Billing is active
- [ ] Budget alerts are set (recommended)

**What to save:**
```
BILLING_ACTIVE=Yes/No
MONTHLY_BUDGET=$_____ (optional, for your tracking)
```

---

### 4. Network & Firewall Information

#### Firewall Rules
**What it is:** Which ports are open on your VM

**How to check:**

**Via Console:**
1. **VPC Network > Firewall**
2. Look for rules that apply to your VM
3. Common rules:
   - `default-allow-http` (port 80)
   - `default-allow-https` (port 443)
   - `default-allow-ssh` (port 22)

**Via Command Line:**
```bash
gcloud compute firewall-rules list
```

**What to verify:**
- [ ] Port 22 (SSH) is open
- [ ] Port 80 (HTTP) is open (for n8n)
- [ ] Port 443 (HTTPS) is open (if using SSL)

**What to save:**
```
FIREWALL_TAGS=_____________ (tags assigned to your VM)
```

**Ports you'll need:**
- Port 5678: n8n interface
- Port 5432: PostgreSQL (only if accessing externally)
- Port 6379: Redis (only if accessing externally)
- Port 8080: Demo site

---

#### Domain Name (Optional)
**What it is:** Custom domain for your n8n instance

**If you have a domain:**

**What to save:**
```
DOMAIN_NAME=________________  (e.g., agents.yourdomain.com)
DNS_PROVIDER=_______________  (e.g., Cloudflare, GoDaddy)
```

**DNS Configuration needed:**
- A Record: `agents.yourdomain.com` → `YOUR_VM_EXTERNAL_IP`
- TTL: 300 (5 minutes) for testing, 3600 (1 hour) for production

**If you don't have a domain:**
- You can use the VM's external IP directly
- Example: `http://34.123.45.67:5678`

---

### 5. Security & Access

#### SSH Keys
**What it is:** Your SSH authentication

**How to check:**

**If using gcloud SSH (recommended):**
- Keys are managed automatically by Google
- Just use: `gcloud compute ssh VM_NAME --zone=ZONE`

**If using manual SSH:**
1. Check if you have SSH keys:
   ```bash
   ls -la ~/.ssh/
   ```
2. Look for `id_rsa` and `id_rsa.pub` (or `id_ed25519`)

**What to verify:**
- [ ] Can successfully SSH into VM
- [ ] Have sudo access on VM

---

#### Admin Credentials
**What to choose:** Username and password for n8n admin access

**Security recommendations:**
- Use strong password (16+ characters)
- Don't reuse passwords
- Consider using a password manager

**What to save (securely!):**
```
N8N_ADMIN_USERNAME=_____________
N8N_ADMIN_PASSWORD=_____________
POSTGRES_PASSWORD=______________
```

---

## 📋 Configuration Summary

Once you've gathered all the information, you'll create a `.env` file with:

```bash
# n8n Configuration
N8N_HOST=YOUR_VM_EXTERNAL_IP              # From section 1
N8N_PROTOCOL=http
WEBHOOK_URL=http://YOUR_VM_EXTERNAL_IP:5678/
TIMEZONE=America/New_York                  # Your timezone
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=YOUR_ADMIN_USERNAME    # From section 5
N8N_BASIC_AUTH_PASSWORD=YOUR_ADMIN_PASSWORD # From section 5

# PostgreSQL Configuration
POSTGRES_USER=admin
POSTGRES_PASSWORD=YOUR_DB_PASSWORD         # From section 5
POSTGRES_DB=ai_agents_db

# AI Services - Gemini
GOOGLE_API_KEY=YOUR_GEMINI_API_KEY        # From section 2
GEMINI_MODEL=gemini-1.5-flash
LLM_PROVIDER=gemini

# Optional: Ollama (for local testing)
OLLAMA_HOST=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2
```

---

## 🔍 Quick Information Gathering Commands

Run these commands to collect most information automatically:

**If you have gcloud CLI installed:**
```bash
# Save this as get-gcp-info.sh
echo "=== GCP VM Information ==="
echo "Project ID: $(gcloud config get-value project)"
echo ""
echo "=== VM Details ==="
gcloud compute instances list --format="table(name,zone,machineType,networkInterfaces[0].accessConfigs[0].natIP)"
echo ""
echo "=== Firewall Rules ==="
gcloud compute firewall-rules list --format="table(name,targetTags,allowed)"
```

**From inside your VM (SSH in first):**
```bash
# Save this as get-vm-info.sh
echo "=== System Information ==="
echo "External IP: $(curl -s http://checkip.amazonaws.com)"
echo "Hostname: $(hostname)"
echo "OS: $(lsb_release -d | cut -f2)"
echo "CPU: $(nproc) cores"
echo "Memory: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Disk: $(df -h / | awk 'NR==2 {print $2}')"
echo ""
echo "=== Docker Status ==="
if command -v docker &> /dev/null; then
    echo "Docker: Installed ($(docker --version))"
    echo "Docker Compose: $(docker-compose --version 2>&1 || echo 'Not installed')"
else
    echo "Docker: Not installed"
fi
```

---

## ✅ Pre-Deployment Checklist

Before starting deployment, verify you have:

- [ ] VM External IP address
- [ ] VM SSH access (can connect)
- [ ] Gemini API key
- [ ] Gemini API is enabled in GCP project
- [ ] Billing is active on GCP project
- [ ] Firewall allows ports 22, 80, 5678
- [ ] Chosen admin username/password
- [ ] (Optional) Domain name configured

---

## 📝 Next Steps

Once you have all this information:

1. **SSH into your VM**
   ```bash
   gcloud compute ssh YOUR_VM_NAME --zone=YOUR_ZONE
   ```

2. **Clone this repository**
   ```bash
   git clone YOUR_REPO_URL
   cd YOUR_REPO
   ```

3. **Create `.env` file**
   ```bash
   cp .env.example .env
   nano .env  # Fill in your information
   ```

4. **Deploy**
   ```bash
   ./scripts/start.sh
   ```

5. **Access n8n**
   - Open browser: `http://YOUR_VM_EXTERNAL_IP:5678`
   - Login with your admin credentials

---

## 🆘 Getting Help

If you're stuck finding any information:

1. **Google Cloud Console**: Most information is in the [Console](https://console.cloud.google.com)
2. **Google Cloud Shell**: Built-in terminal in GCP Console (top right, terminal icon)
3. **Documentation**: See [docs/gcp-deployment-guide.md](./gcp-deployment-guide.md)
4. **Support**: Check GCP support or community forums

---

## 📚 Related Documentation

- [GCP Deployment Guide](./gcp-deployment-guide.md) - Full deployment instructions
- [LLM Setup Guide](./llm-setup-guide.md) - Gemini & Ollama configuration
- [Docker Commands Reference](./docker-commands.md) - Docker management
