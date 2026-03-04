# Social Media Scheduler Setup Guide
## Complete Implementation Instructions for Descomplicador.pt

**Version:** 1.0
**Date:** 2026-03-04
**Estimated Setup Time:** 3-4 hours

---

## Prerequisites

Before starting, ensure you have:

- ✅ Access to n8n at https://hub.descomplicador.pt
- ✅ Google Account with access to Google Sheets
- ✅ Facebook Page for Descomplicador.pt
- ✅ Instagram Business Account (connected to Facebook Page)
- ✅ LinkedIn Company Page for Descomplicador.pt
- ✅ YouTube Channel (optional, for manual posting)
- ✅ Google Business Profile (optional, for manual posting)
- ✅ Admin access to all social media accounts

---

## Phase 1: Platform API Credentials Setup

### 1.1 Facebook & Instagram Setup

**Duration:** 30-45 minutes

#### Step 1: Create Facebook Developer App

1. Go to https://developers.facebook.com/apps/
2. Click "Create App"
3. Select "Business" as app type
4. Fill in:
   - **App Name:** `Descomplicador Social Automation`
   - **Contact Email:** `andrefloresbrasil@gmail.com`
   - **Business Account:** Select Descomplicador.pt (or create new)
5. Click "Create App"
6. Save the **App ID** (you'll need this later)

#### Step 2: Add Products

1. In app dashboard, click "Add Product"
2. Add **Facebook Login** → Click "Set Up"
3. Add **Instagram Graph API** → Click "Set Up"

#### Step 3: Configure Permissions

1. Go to "App Settings" → "Basic"
2. Add Privacy Policy URL: `https://hub.descomplicador.pt/privacy`
3. Add Terms of Service URL: (same as above, or separate if available)
4. Save changes

5. Go to "Permissions and Features"
6. Request these permissions (click "Get Advanced Access"):
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`

**Note:** Advanced Access requires Business Verification. If not yet verified:
- Use "Standard Access" (limited to 25 users, 250 API calls/hour)
- Submit for Business Verification (requires business documents)

#### Step 4: Generate Page Access Token

1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app from dropdown
3. Click "Generate Access Token"
4. Select these permissions:
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
5. Click "Generate Access Token" → Authenticate
6. Select your Facebook Page
7. Copy the **User Access Token** (short-lived)

#### Step 5: Convert to Long-Lived Page Token

1. Get your User Access Token from step 4
2. Run this command (replace placeholders):

```bash
curl -X GET "https://graph.facebook.com/v21.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id={APP_ID}" \
  -d "client_secret={APP_SECRET}" \
  -d "fb_exchange_token={SHORT_LIVED_USER_TOKEN}"
```

**Response:**
```json
{
  "access_token": "EAAxxxxx...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

3. Copy the new `access_token` (long-lived, ~60 days)

4. Get Page ID and Page Access Token:

```bash
curl -X GET "https://graph.facebook.com/v21.0/me/accounts" \
  -d "access_token={LONG_LIVED_USER_TOKEN}"
```

**Response:**
```json
{
  "data": [
    {
      "id": "123456789",
      "name": "Descomplicador.pt",
      "access_token": "EAAppppp...",
      "category": "Business Services",
      "tasks": ["ANALYZE", "ADVERTISE", "MODERATE", "CREATE_CONTENT"]
    }
  ]
}
```

5. Copy the **Page Access Token** from response (this one never expires if you have PAGE_PUBLIC_CONTENT_ACCESS)
6. Save both **Page ID** and **Page Access Token** securely

#### Step 6: Get Instagram Business Account ID

1. Use your Page Access Token:

```bash
curl -X GET "https://graph.facebook.com/v21.0/{PAGE_ID}" \
  -d "fields=instagram_business_account" \
  -d "access_token={PAGE_ACCESS_TOKEN}"
```

**Response:**
```json
{
  "instagram_business_account": {
    "id": "987654321"
  },
  "id": "123456789"
}
```

2. Save the **Instagram Business Account ID** (`987654321`)

#### Step 7: Test Access

```bash
# Test Facebook Page posting
curl -X POST "https://graph.facebook.com/v21.0/{PAGE_ID}/feed" \
  -d "message=Test post from API" \
  -d "access_token={PAGE_ACCESS_TOKEN}"

# Test Instagram posting (image required)
curl -X POST "https://graph.facebook.com/v21.0/{IG_ACCOUNT_ID}/media" \
  -d "image_url=https://exemplo.com/test-image.jpg" \
  -d "caption=Test post from API" \
  -d "access_token={PAGE_ACCESS_TOKEN}"
```

**Checklist:**
- ✅ Facebook App ID saved
- ✅ Page Access Token saved (never expires)
- ✅ Facebook Page ID saved
- ✅ Instagram Business Account ID saved
- ✅ Test posts successful on both platforms

---

### 1.2 LinkedIn Setup

**Duration:** 30 minutes

#### Step 1: Create LinkedIn Developer App

1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill in:
   - **App name:** `Descomplicador Social Automation`
   - **LinkedIn Page:** Select Descomplicador.pt company page
   - **Privacy policy URL:** `https://hub.descomplicador.pt/privacy`
   - **App logo:** Upload Descomplicador.pt logo (400×400px minimum)
4. Check "I have read and agree to these terms"
5. Click "Create app"

#### Step 2: Get Organization ID

1. Go to your Company Page: `https://www.linkedin.com/company/descomplicador-pt/`
2. Look at the URL — the last number is your Organization ID
   - Example: `linkedin.com/company/12345678/` → Organization ID is `12345678`
3. Alternative: Use API to get Organization URN:

```bash
curl -X GET "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

4. Save **Organization ID** (format: just the number, e.g., `12345678`)
5. Organization URN format: `urn:li:organization:{ID}` (e.g., `urn:li:organization:12345678`)

#### Step 3: Request API Products

1. In app dashboard, go to "Products" tab
2. Request access to:
   - **Share on LinkedIn** (for posting)
   - **Marketing Developer Platform** (for organization posts)
3. Click "Request access" for each
4. Fill in use case: "Automated content posting to company page"

**Note:** Marketing Developer Platform requires review (1-3 business days). Proceed with other setup while waiting.

#### Step 4: Configure OAuth 2.0

1. Go to "Auth" tab
2. Add Redirect URLs:
   - `https://hub.descomplicador.pt/rest/oauth2-credential/callback`
   - `http://localhost:5678/rest/oauth2-credential/callback` (for local testing)
3. Save changes
4. Copy **Client ID** and **Client Secret** (you'll need these for n8n)

#### Step 5: Test OAuth Flow (Manual)

1. Build authorization URL:
```
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={CLIENT_ID}&redirect_uri=https://hub.descomplicador.pt/rest/oauth2-credential/callback&scope=w_organization_social%20r_organization_social
```

2. Open in browser → Authorize app
3. Copy the `code` from redirect URL
4. Exchange code for access token:

```bash
curl -X POST "https://www.linkedin.com/oauth/v2/accessToken" \
  -d "grant_type=authorization_code" \
  -d "code={CODE}" \
  -d "client_id={CLIENT_ID}" \
  -d "client_secret={CLIENT_SECRET}" \
  -d "redirect_uri=https://hub.descomplicador.pt/rest/oauth2-credential/callback"
```

**Response:**
```json
{
  "access_token": "AQV...",
  "expires_in": 5184000,
  "refresh_token": "AQX...",
  "refresh_token_expires_in": 31536000
}
```

5. Save **Access Token** and **Refresh Token**

**Note:** n8n will handle OAuth flow automatically once configured. This manual test is just for validation.

#### Step 6: Test Posting

```bash
curl -X POST "https://api.linkedin.com/v2/ugcPosts" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "urn:li:organization:{ORG_ID}",
    "lifecycleState": "PUBLISHED",
    "specificContent": {
      "com.linkedin.ugc.ShareContent": {
        "shareCommentary": {
          "text": "Test post from API"
        },
        "shareMediaCategory": "NONE"
      }
    },
    "visibility": {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
  }'
```

**Checklist:**
- ✅ LinkedIn App created
- ✅ Client ID and Client Secret saved
- ✅ Organization ID / URN saved
- ✅ Marketing Developer Platform access approved (or pending)
- ✅ OAuth redirect URLs configured
- ✅ Test post successful

---

### 1.3 Google Services Setup (Gemini AI + Sheets)

**Duration:** 15 minutes

#### Step 1: Get Gemini Flash 2.5 API Key

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Select project or create new: "Descomplicador Automation"
4. Copy the **API Key** (format: `AIzaSy...`)
5. Save securely

**Free Tier Limits:**
- 60 requests per minute
- 1,500 requests per day
- No credit card required

#### Step 2: Create Google Cloud Service Account (for Sheets)

**Option A: Use Existing Service Account**

If you already have the n8n service account (`n8n-automation@n8n-resumo-dia.iam.gserviceaccount.com`):

1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Find your existing service account
3. Verify it has `Google Sheets API` enabled
4. If not, add permission:
   - Click service account email
   - Go to "Permissions" tab
   - Add role: `Sheets Editor` or `Editor`
5. Skip to Step 3 below

**Option B: Create New Service Account**

1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Select project (or create new): "n8n-resumo-dia" or "Descomplicador Automation"
3. Click "Create Service Account"
4. Fill in:
   - **Name:** `n8n-sheets-automation`
   - **ID:** (auto-generated)
   - **Description:** `Service account for n8n Google Sheets access`
5. Click "Create and Continue"
6. Grant role: **Editor** (or `Sheets Editor` for least privilege)
7. Click "Continue" → "Done"

#### Step 3: Create Service Account Key

1. Click on the service account email
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select **JSON** format
5. Click "Create" → Key file downloads automatically
6. Save this JSON file securely (you'll upload it to n8n)

#### Step 4: Enable Google Sheets API

1. Go to https://console.cloud.google.com/apis/library
2. Search for "Google Sheets API"
3. Click "Google Sheets API"
4. Click "Enable"

**Checklist:**
- ✅ Gemini API Key saved
- ✅ Service Account email saved
- ✅ Service Account JSON key file downloaded
- ✅ Google Sheets API enabled

---

### 1.4 YouTube & Google Business (Optional)

**Note:** These platforms require manual posting. API credentials are optional.

#### YouTube (Community Posts - Manual Only)

**Current Status:** YouTube Community Tab API is not publicly available.

**What You Can Automate:**
- Video uploads via YouTube Data API v3
- Video description updates
- Playlist management

**Setup for Video Uploads (Optional):**

1. Go to https://console.cloud.google.com/apis/library
2. Search "YouTube Data API v3" → Enable
3. Use same Google Cloud project and Service Account as Sheets
4. Grant OAuth scope: `https://www.googleapis.com/auth/youtube.upload`

**Recommendation:** Skip for now. Focus on platforms with full API support.

#### Google Business Profile (Manual Only)

**Current Status:** Google Business Profile API (local posts) is deprecated.

**Workaround:**
- Manual posting via https://business.google.com/
- Third-party tools (Hootsuite, Buffer) if needed

**Recommendation:** Skip automation. Mark as manual in workflow.

---

## Phase 2: Google Sheets Setup

**Duration:** 30 minutes

### 2.1 Create Content Calendar Spreadsheet

Follow the detailed instructions in `content-calendar-template.md`.

**Quick Setup:**

1. Go to https://sheets.google.com
2. Create new spreadsheet: "Descomplicador - Content Calendar"
3. Create three tabs: `Calendario`, `Config`, `Guia`
4. Copy all column headers and validation rules from template
5. Add example rows (optional)

### 2.2 Share with Service Account

1. Click "Share" button (top right)
2. Add email: `{your-service-account-email}@{project}.iam.gserviceaccount.com`
   - Example: `n8n-automation@n8n-resumo-dia.iam.gserviceaccount.com`
3. Set permission: **Editor** (n8n needs write access)
4. Uncheck "Notify people"
5. Click "Share"

### 2.3 Get Spreadsheet ID

1. Look at URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
2. Copy the `{SPREADSHEET_ID}` (long alphanumeric string)
3. Save it for n8n configuration

**Checklist:**
- ✅ Spreadsheet created with all tabs
- ✅ Headers and validation rules configured
- ✅ Shared with Service Account (Editor permission)
- ✅ Spreadsheet ID saved

---

## Phase 3: n8n Configuration

**Duration:** 1-2 hours

### 3.1 Create Credentials in n8n

#### Credential 1: Gemini API (Google AI)

1. Log in to n8n: https://hub.descomplicador.pt
2. Go to "Credentials" (left sidebar)
3. Click "Add Credential"
4. Search for "Google AI" or "HTTP Request"
5. If using HTTP Request:
   - **Name:** `Gemini Flash 2.5 API`
   - **Authentication:** `Generic Credential Type` → `API Key`
   - **API Key Name:** `x-goog-api-key` (header)
   - **API Key Value:** `{YOUR_GEMINI_API_KEY}`
6. Save

**Alternative: Use AI Agent Node**

If n8n has native Google AI / Gemini node:
1. Select "Google AI Credential"
2. Enter API Key
3. Select model: `gemini-2.0-flash-exp`

#### Credential 2: Google Sheets (Service Account)

1. Click "Add Credential"
2. Search "Google Sheets"
3. Select "Google Sheets Service Account"
4. Upload the JSON key file (from Phase 1, Step 3)
5. **Name:** `Google Sheets - Descomplicador`
6. Save

#### Credential 3: Facebook/Instagram (Page Access Token)

1. Click "Add Credential"
2. Search "HTTP Request" (there's no native Facebook credential)
3. Select "Generic Credential Type" → "Header Auth"
4. **Name:** `Facebook Page Access Token`
5. **Header Name:** `Authorization`
6. **Header Value:** `Bearer {YOUR_PAGE_ACCESS_TOKEN}`
7. Save

#### Credential 4: LinkedIn OAuth2

1. Click "Add Credential"
2. Search "LinkedIn"
3. If native LinkedIn credential exists:
   - Select "LinkedIn OAuth2 API"
   - Enter **Client ID** and **Client Secret**
   - Set **Scope:** `w_organization_social r_organization_social`
   - Click "Connect" → Authorize in popup
4. If no native credential:
   - Use "OAuth2 API" generic credential
   - **Authorization URL:** `https://www.linkedin.com/oauth/v2/authorization`
   - **Access Token URL:** `https://www.linkedin.com/oauth/v2/accessToken`
   - **Client ID:** `{YOUR_CLIENT_ID}`
   - **Client Secret:** `{YOUR_CLIENT_SECRET}`
   - **Scope:** `w_organization_social r_organization_social`
   - **Auth URI Query Parameters:** `response_type=code`
5. Save

#### Credential 5: Email (SMTP)

1. Click "Add Credential"
2. Search "SMTP"
3. Select "SMTP"
4. Enter:
   - **User:** `andrefloresbrasil@gmail.com` (or your email)
   - **Password:** (use App Password if Gmail)
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Security:** `TLS`
5. Save

**Gmail App Password Setup:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "n8n Social Scheduler"
4. Click "Generate"
5. Copy the 16-character password
6. Use this as SMTP password in n8n

**Checklist:**
- ✅ Gemini API credential created
- ✅ Google Sheets Service Account credential created
- ✅ Facebook Page Access Token credential created
- ✅ LinkedIn OAuth2 credential created
- ✅ SMTP credential created

---

### 3.2 Import Workflow 1: Content Scheduler

**Note:** Workflow JSON files are not included in this guide. They must be created based on `workflow-design.md` specifications.

**Manual Import Steps:**

1. In n8n, click "Workflows" (left sidebar)
2. Click "Add Workflow" → "Import from File"
3. Select `Social-Media-Scheduler-Daily-Publisher.json`
4. Workflow opens in editor

**Configure Nodes:**

#### Node: Schedule Trigger
- **Cron Expression:** `0 9 * * *` (09:00 daily)
- **Timezone:** `Atlantic/Azores`

#### Node: Read Content Calendar (Google Sheets)
- **Credential:** Select `Google Sheets - Descomplicador`
- **Spreadsheet ID:** Paste your spreadsheet ID
- **Sheet:** `Calendario`
- **Range:** `A2:J`
- **Filters:** Custom (see workflow design for filter logic)

#### Node: Adapt for Instagram (AI Agent or HTTP Request)
- **Credential:** Select `Gemini Flash 2.5 API`
- **Model:** `gemini-2.0-flash-exp`
- **Prompt:** Copy from `workflow-design.md` (Instagram prompt)

#### Node: Post to Instagram (HTTP Request)
- **Authentication:** Select `Facebook Page Access Token`
- **URL:** `https://graph.facebook.com/v21.0/{IG_ACCOUNT_ID}/media`
- **Replace `{IG_ACCOUNT_ID}`** with your Instagram Business Account ID (from Phase 1.1 Step 6)
- **Method:** POST
- **Body (JSON):**
```json
{
  "image_url": "={{ $json.imageUrl }}",
  "caption": "={{ $json.adaptedContent.instagram }}",
  "access_token": "={{ $credentials.facebookPageAccessToken }}"
}
```

#### Node: Post to LinkedIn (HTTP Request)
- **Authentication:** Select `LinkedIn OAuth2`
- **URL:** `https://api.linkedin.com/v2/ugcPosts`
- **Method:** POST
- **Headers:**
  - `X-Restli-Protocol-Version: 2.0.0`
  - `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "author": "urn:li:organization:{YOUR_ORG_ID}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "={{ $json.adaptedContent.linkedin }}"
      },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```
- **Replace `{YOUR_ORG_ID}`** with your LinkedIn Organization ID (from Phase 1.2)

#### Node: Post to Facebook (HTTP Request)
- **Authentication:** Select `Facebook Page Access Token`
- **URL:** `https://graph.facebook.com/v21.0/{PAGE_ID}/photos`
- **Replace `{PAGE_ID}`** with your Facebook Page ID
- **Method:** POST
- **Body (JSON):**
```json
{
  "url": "={{ $json.imageUrl }}",
  "message": "={{ $json.adaptedContent.facebook }}",
  "access_token": "={{ $credentials.facebookPageAccessToken }}"
}
```

#### Node: Update Sheet Status (Google Sheets)
- **Credential:** Select `Google Sheets - Descomplicador`
- **Operation:** Update Row
- **Spreadsheet ID:** Same as Read node
- **Sheet:** `Calendario`
- **Row Number:** `={{ $json.rowNumber }}`
- **Column:** J (Status)
- **Value:** `Publicado` (or `Erro` based on error handling)

#### Node: Send Summary Notification (Email Send)
- **Credential:** Select SMTP credential
- **To:** `andrefloresbrasil@gmail.com`
- **Subject:** `Publicação automática - {{ $now.format('DD/MM/YYYY') }}`
- **Email Type:** HTML
- **Body:** Copy from `workflow-design.md` (HTML template)

5. **Save workflow** (Ctrl+S or click "Save" button)
6. **Activate workflow** (toggle switch in top right)

---

### 3.3 Import Workflow 2: AI Content Adapter

1. Click "Add Workflow" → "Import from File"
2. Select `Social-Media-AI-Content-Adapter.json`
3. Workflow opens in editor

**Configure Nodes:**

#### Node: Webhook Trigger
- **Path:** `social-media-adapter`
- **HTTP Method:** POST
- **Response Mode:** Wait for response
- **Note:** Webhook URL will be: `https://hub.descomplicador.pt/webhook/social-media-adapter`

#### Nodes: Adapt for [Platform] (5 AI nodes)
- **Credential:** Select `Gemini Flash 2.5 API`
- **Model:** `gemini-2.0-flash-exp`
- **Temperature:** 0.7
- **Max Tokens:** 3000
- **Prompt:** Copy from `workflow-design.md` (one for each platform)

4. **Save workflow**
5. **Activate workflow**

---

### 3.4 Test Workflows

#### Test 1: AI Content Adapter (Webhook)

```bash
curl -X POST "https://hub.descomplicador.pt/webhook/social-media-adapter" \
  -H "Content-Type: application/json" \
  -d '{
    "mainText": "Automatizar o seu negócio nunca foi tão fácil. Com as ferramentas certas, pode poupar horas de trabalho manual todos os dias.",
    "pilar": "Educação"
  }'
```

**Expected Response:**
```json
{
  "original": "Automatizar o seu negócio...",
  "pilar": "Educação",
  "adapted": {
    "instagram": "[Adapted text with hashtags]",
    "linkedin": "[Adapted professional text]",
    "facebook": "[Adapted conversational text]",
    "youtube": "[Adapted educational text]",
    "googleBusiness": "[Adapted local text]"
  },
  "metadata": {
    "generatedAt": "2026-03-04T10:30:00.000Z",
    "model": "gemini-2.0-flash-exp"
  }
}
```

#### Test 2: Content Scheduler (Manual Execution)

1. Add a test post to Google Sheets:
   - **Date:** Today's date
   - **Pilar:** Educação
   - **Text:** "Teste de publicação automática"
   - **Image URL:** Use a valid test image (e.g., placeholder service)
   - **Platforms:** Check Instagram + Facebook only (start simple)
   - **Status:** Agendado

2. In n8n, open "Social Media Scheduler" workflow
3. Click "Execute Workflow" button (top right)
4. Wait for execution to complete
5. Check results:
   - ✅ Instagram post appeared
   - ✅ Facebook post appeared
   - ✅ Google Sheet status updated to "Publicado"
   - ✅ Email notification received

#### Test 3: Scheduled Execution

1. Wait for 09:00 (Azores time) next day
2. Verify workflow executes automatically
3. Check execution history in n8n

**Troubleshooting:**

**Error: "Invalid image URL"**
- Ensure image URL is public (no login required)
- Test URL in incognito browser
- Use direct link (not Google Drive share link — convert to direct)

**Error: "Invalid access token" (Instagram/Facebook)**
- Verify Page Access Token hasn't expired
- Re-generate token following Phase 1.1 steps

**Error: "Organization not found" (LinkedIn)**
- Verify Organization URN format: `urn:li:organization:{ID}`
- Check app has access to the company page

**Error: "Rate limit exceeded"**
- Wait 1 hour (Facebook rate limit)
- Reduce number of posts in test

---

## Phase 4: Operational Setup

### 4.1 Create Image Hosting Solution

**Recommended: Cloudflare R2 Bucket**

1. Go to https://dash.cloudflare.com/ → R2
2. Create bucket: `descomplicador-social-media`
3. Enable public access
4. Upload test images
5. Get public URL format: `https://pub-{bucket-id}.r2.dev/{file-name}`

**Alternative: Self-Hosted on VM**

```bash
# SSH into VM
ssh -i "C:\Users\andre\.ssh\gcloud-key" andrefloresbrasil@34.175.249.49

# Create directory
mkdir -p /home/andrefloresbrasil/static/social-media-images

# Update Caddyfile
nano /home/andrefloresbrasil/n8n-starter-kit/Caddyfile
```

Add route:
```
hub.descomplicador.pt {
    # Existing routes...

    handle /media/* {
        root * /home/andrefloresbrasil/static/social-media-images
        file_server
    }
}
```

Restart Caddy:
```bash
docker exec n8n_caddy caddy reload --config /etc/caddy/Caddyfile
```

Upload images:
```bash
scp -i "C:\Users\andre\.ssh\gcloud-key" image.jpg andrefloresbrasil@34.175.249.49:/home/andrefloresbrasil/static/social-media-images/
```

URL format: `https://hub.descomplicador.pt/media/image.jpg`

### 4.2 Schedule First Month of Content

1. Open Google Sheets content calendar
2. Plan 20-30 posts for next month (aim for 1 post/day)
3. Balance content pillars:
   - 40% Educação (tips, how-to)
   - 30% Vendas (promos, testimonials)
   - 20% Bastidores (behind-the-scenes)
   - 10% Resultados (metrics, case studies)
4. Upload all images to hosting solution
5. Fill in all rows with dates, text, image URLs, platforms, status "Agendado"

### 4.3 Set Up Monitoring

#### Daily Checklist (09:15 AM)
- Check email notification for posting summary
- Verify posts appeared on all platforms
- Review any "Erro" status in sheet
- Manually post YouTube/Google Business content (if applicable)

#### Weekly Review (Every Monday)
- Check upcoming posts (next 7 days)
- Ensure all image URLs are accessible
- Plan new content to fill gaps

#### Monthly Maintenance
- Export sheet to backup
- Clean up old posts (>90 days)
- Review engagement metrics (manual, or via platform analytics)
- Adjust content strategy based on performance

---

## Phase 5: Advanced Configuration (Optional)

### 5.1 Add Post Scheduling (Delayed Publishing)

Modify workflow to respect custom post times:
- Add column K to Google Sheets: `hora_publicacao` (time, format: HH:MM)
- Update workflow to delay execution until specified time
- Use n8n `Wait` node with dynamic time calculation

### 5.2 Add Engagement Tracking

Create new workflow: "Social Media Engagement Tracker"
- Scheduled daily (evening)
- Fetch post engagement data from each platform API
- Store in Google Sheets (separate tab: "Analytics")
- Build weekly summary report

**APIs Required:**
- Instagram Insights API
- Facebook Graph API (insights)
- LinkedIn Analytics API

### 5.3 Add LinkedIn Image Upload

Extend LinkedIn posting to support images:

1. **Upload image to LinkedIn Assets API:**
```bash
# Step 1: Register upload
POST https://api.linkedin.com/v2/assets?action=registerUpload
{
  "registerUploadRequest": {
    "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
    "owner": "urn:li:organization:{ORG_ID}",
    "serviceRelationships": [
      {
        "relationshipType": "OWNER",
        "identifier": "urn:li:userGeneratedContent"
      }
    ]
  }
}

# Step 2: Upload image binary to returned uploadUrl
PUT {uploadUrl}
Headers: Authorization: Bearer {ACCESS_TOKEN}
Body: [binary image data]

# Step 3: Use asset URN in post
```

2. Add "Upload Image to LinkedIn" node before "Post to LinkedIn" in workflow
3. Pass asset URN to post node

---

## Support & Maintenance

### Getting Help

**Technical Issues:**
- Check n8n execution history for error details
- Review platform API documentation (links below)
- Email: andrefloresbrasil@gmail.com

**Platform API Documentation:**
- Facebook/Instagram: https://developers.facebook.com/docs/graph-api
- LinkedIn: https://learn.microsoft.com/en-us/linkedin/marketing/
- YouTube: https://developers.google.com/youtube/v3
- Google AI: https://ai.google.dev/docs

### Updating Workflow

When making changes to workflow logic:
1. Export current workflow (backup)
2. Make changes in n8n editor
3. Test with manual execution
4. Export updated workflow JSON
5. Save to `descomplica-workflows/social-media-scheduler/` directory
6. Commit to GitHub

### Credential Rotation Schedule

| Credential | Rotation Frequency | How to Rotate |
|-----------|-------------------|--------------|
| Facebook Page Token | Every 60 days (if using short-lived) | Regenerate via Graph API Explorer |
| LinkedIn OAuth2 | Auto-refreshed by n8n | Manual re-auth if refresh token expires |
| Gemini API Key | Annually (or if compromised) | Generate new key in AI Studio |
| SMTP Password | Annually (or if compromised) | Generate new App Password |
| Service Account Key | Every 2 years (or if compromised) | Create new key in Google Cloud Console |

---

## Troubleshooting Guide

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Spreadsheet not found" | Service account not shared | Re-share sheet with SA email (Editor permission) |
| "Invalid access token" | Token expired or revoked | Re-generate token via platform developer console |
| "Image URL not accessible" | URL requires authentication | Use public hosting (R2, Imgur, or self-hosted public path) |
| "Rate limit exceeded" | Too many API calls | Wait 1 hour, reduce post frequency, or upgrade API tier |
| "Organization not found" (LinkedIn) | Wrong URN format or no access | Verify URN format, check app has page access |
| "Caption too long" (Instagram) | Text exceeds 2200 chars | Check AI adapter prompt — should enforce limit |
| Workflow doesn't execute at 09:00 | Wrong timezone setting | Verify Schedule Trigger timezone is Atlantic/Azores |
| Email notification not received | SMTP credentials wrong | Test SMTP with manual email send node |
| Posts appear on some platforms but not others | Platform-specific error | Check execution log, test each platform node individually |

### Debug Workflow

Add these nodes after each major step for debugging:

**Debug Logger Node:**
```
Node Type: n8n-nodes-base.function
Code:
console.log('Step: Post to Instagram');
console.log('Data:', JSON.stringify($input.all(), null, 2));
return $input.all();
```

Enable debug logging in n8n:
```bash
# SSH into VM
docker exec -it n8n sh

# Inside container
export N8N_LOG_LEVEL=debug
```

View logs:
```bash
docker logs n8n -f
```

---

## Security Checklist

Before going live, verify:

- ✅ All API credentials stored in n8n Credential Manager (not hardcoded)
- ✅ Service Account JSON key file deleted from local machine (keep encrypted backup only)
- ✅ Facebook/Instagram App set to "Live" mode (not Development)
- ✅ LinkedIn App approved for Marketing Developer Platform
- ✅ Google Sheets shared only with Service Account (not public)
- ✅ n8n webhook paths use HTTPS (not HTTP)
- ✅ SMTP password is App Password (not account password)
- ✅ No API keys or tokens committed to Git
- ✅ Image hosting URLs are public but not guessable (use UUIDs in filenames)

---

## Success Metrics

Track these KPIs monthly:

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Posts published successfully | >95% | Email notifications + sheet status |
| Time saved vs manual posting | >30 hours/month | (Posts × 5 platforms × 3 min) - 5 min |
| Platform error rate | <5% | Count "Erro" status in sheet |
| Engagement rate | Platform-specific baseline | Manual review of likes/comments/shares |
| Content pillar balance | 40/30/20/10 split | COUNT in Google Sheets by pilar |

---

## Next Steps After Setup

1. **Week 1:** Monitor daily, fix any errors immediately
2. **Week 2:** Analyze which content pillars perform best
3. **Week 3:** Optimize posting times (test different hours)
4. **Month 2:** Add engagement tracking workflow
5. **Month 3:** Build analytics dashboard (Grafana or Data Studio)
6. **Month 6:** Evaluate adding video content automation (YouTube uploads)

---

## Appendix: Environment Variables (n8n VM)

If adding new variables to n8n Docker setup:

```bash
# SSH into VM
ssh -i "C:\Users\andre\.ssh\gcloud-key" andrefloresbrasil@34.175.249.49

# Edit docker-compose.yml
cd /home/andrefloresbrasil/n8n-starter-kit
nano docker-compose.yml
```

Add under n8n service:
```yaml
environment:
  # Existing vars...
  - SOCIAL_MEDIA_MODE=production
  - FB_PAGE_ID=${FB_PAGE_ID}
  - IG_ACCOUNT_ID=${IG_ACCOUNT_ID}
  - LINKEDIN_ORG_ID=${LINKEDIN_ORG_ID}
```

Create `.env` file (if not exists):
```bash
nano .env
```

Add:
```
FB_PAGE_ID=123456789
IG_ACCOUNT_ID=987654321
LINKEDIN_ORG_ID=12345678
```

Restart n8n:
```bash
docker-compose down
docker-compose up -d
```

---

## Final Checklist

Before marking setup as complete:

**Platform Credentials:**
- ✅ Facebook Page Access Token generated and saved
- ✅ Instagram Business Account ID retrieved
- ✅ LinkedIn OAuth2 configured and tested
- ✅ Gemini API Key generated and tested
- ✅ Google Sheets Service Account created and shared

**Google Sheets:**
- ✅ Content calendar created with all tabs
- ✅ Validation rules configured
- ✅ Shared with Service Account (Editor permission)
- ✅ Example posts added for testing

**n8n Workflows:**
- ✅ All credentials created in n8n
- ✅ Workflow 1 (Content Scheduler) imported and configured
- ✅ Workflow 2 (AI Content Adapter) imported and configured
- ✅ Both workflows activated
- ✅ Test execution successful (manual trigger)

**Operational:**
- ✅ Image hosting solution set up
- ✅ First month of content planned in calendar
- ✅ Daily monitoring checklist created
- ✅ Email notifications working

**Documentation:**
- ✅ All IDs/tokens saved in secure location (password manager)
- ✅ Workflow JSONs exported and committed to GitHub
- ✅ Setup guide reviewed and understood

---

**Congratulations! Your social media automation system is live.**

For ongoing support, refer to:
- `workflow-design.md` — Architecture and node specifications
- `content-calendar-template.md` — Sheet structure and data validation
- This guide — Setup and troubleshooting

**Last Updated:** 2026-03-04
**Setup Time Logged:** ~4 hours (first-time setup)
**Maintenance Time:** ~30 min/week

---

**End of Setup Guide**
