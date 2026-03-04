# Social Media Scheduler Workflow Design
## Descomplicador.pt Content Management & Cross-Posting System

**Version:** 1.0
**Date:** 2026-03-04
**Target n8n Instance:** https://hub.descomplicador.pt
**Default LLM:** Gemini Flash 2.5

---

## System Overview

A two-workflow automation system for scheduling and cross-posting social media content across Instagram, LinkedIn, Facebook, YouTube, and Google Business Profile. Content is managed via Google Sheets, adapted per platform by AI, and posted automatically.

---

## Workflow 1: Content Scheduler

**Workflow Name:** `Social Media Scheduler - Daily Publisher`
**Trigger:** Schedule Trigger (Cron)
**Schedule:** `0 9 * * *` (09:00 Atlantic/Azores, daily)
**Purpose:** Read today's scheduled posts from Google Sheets, adapt content per platform using Gemini Flash 2.5, post to selected platforms, update status

### Node Sequence

#### 1. Schedule Trigger
- **Node Type:** `n8n-nodes-base.scheduleTrigger`
- **Configuration:**
  - Trigger Times: `0 9 * * *` (09:00 Azores time)
  - Timezone: `Atlantic/Azores`

#### 2. Read Content Calendar
- **Node Type:** `n8n-nodes-base.googleSheets`
- **Operation:** `Read Rows`
- **Configuration:**
  - Spreadsheet: `Descomplicador - Content Calendar` (by ID)
  - Sheet: `Calendario`
  - Range: `A2:J` (all data rows, skip header)
  - Filters: `data_publicacao = today()`

**Expected Columns:**
- A: `id` (auto-increment row ID)
- B: `data_publicacao` (date, format: YYYY-MM-DD)
- C: `pilar_conteudo` (text: Educação / Vendas / Bastidores / Resultados)
- D: `texto_principal` (text, main content, max 2000 chars)
- E: `imagem_url` (text, public URL to image file)
- F: `instagram` (checkbox/boolean)
- G: `linkedin` (checkbox/boolean)
- H: `facebook` (checkbox/boolean)
- I: `youtube` (checkbox/boolean)
- J: `status` (text: Agendado / Publicado / Erro)

#### 3. If Any Posts Today
- **Node Type:** `n8n-nodes-base.if`
- **Condition:** `{{ $json.length > 0 }}`
- **True:** Continue to adaptation
- **False:** Stop workflow (no posts scheduled)

#### 4. Loop Through Posts
- **Node Type:** `n8n-nodes-base.splitInBatches`
- **Batch Size:** 1
- **Purpose:** Process one post at a time through the entire pipeline

#### 5. Check Selected Platforms
- **Node Type:** `n8n-nodes-base.code`
- **Language:** JavaScript
- **Purpose:** Build array of selected platforms for this post

```javascript
const item = $input.item.json;
const platforms = [];

if (item.instagram) platforms.push('instagram');
if (item.linkedin) platforms.push('linkedin');
if (item.facebook) platforms.push('facebook');
if (item.youtube) platforms.push('youtube');

return {
  json: {
    postId: item.id,
    mainText: item.texto_principal,
    imageUrl: item.imagem_url,
    pilar: item.pilar_conteudo,
    platforms: platforms,
    rowNumber: item.id + 1 // for Google Sheets update later
  }
};
```

#### 6. Adapt Content for Platforms
- **Node Type:** `n8n-nodes-base.code`
- **Purpose:** Call Gemini Flash 2.5 for each platform to adapt content

**Logic:**
- Loop through `platforms` array
- For each platform, call Gemini Flash 2.5 via HTTP Request node (via sub-workflow or inline)
- Store adapted text in object keyed by platform

**Gemini Flash 2.5 Prompt Template (per platform):**

```
SYSTEM:
És um copywriter especializado em conteúdo para redes sociais em português europeu (pt-PT).
Vais adaptar conteúdo para a plataforma: {platform}

REGRAS GERAIS:
- Usa português europeu (pt-PT), não brasileiro
- Mantém o tom profissional mas acessível
- Não uses emojis em excesso (máximo 3)
- O conteúdo é para Descomplicador.pt (automação e IA para negócios locais)

REGRAS POR PLATAFORMA:

INSTAGRAM:
- Máximo 2200 caracteres
- Inclui 5-8 hashtags relevantes (no final, após linha em branco)
- Tom mais visual e inspirador
- Inclui call-to-action direto
- Formato: texto principal + linha em branco + hashtags

LINKEDIN:
- Máximo 3000 caracteres
- Tom profissional e thought-leadership
- Sem hashtags excessivos (máximo 3, se necessário)
- Inclui pergunta de engagement no final (opcional)
- Estrutura: gancho inicial (1-2 linhas) + desenvolvimento + conclusão/CTA

FACEBOOK:
- Máximo 63206 caracteres (mas idealmente 100-250 para melhor alcance)
- Tom conversacional e engagement-focused
- Pergunta de engagement no final
- Pode incluir 2-3 emojis estratégicos

YOUTUBE:
- Para Community Post: máximo 5000 caracteres
- Tom educativo e direto
- Convida ao engagement (like, comentário, subscrição)
- Sem hashtags (YouTube gere isso automaticamente)

USER:
Pilar de conteúdo: {pilar}
Texto original:
{mainText}

Adapta este conteúdo para {platform}, seguindo as regras acima.
Responde APENAS com o texto adaptado, sem explicações ou comentários adicionais.
```

**Implementation Approach:**

Create a **sub-workflow** called `Social Media - AI Content Adapter` with:
- **Webhook Trigger** (POST)
- **Input:** `{ platform, mainText, pilar }`
- **AI Agent Node** (Gemini Flash 2.5) with prompt template above
- **Response Node:** return adapted text

Main workflow calls sub-workflow via HTTP Request for each platform.

#### 7. Post to Instagram (If Selected)
- **Node Type:** `n8n-nodes-base.httpRequest`
- **Method:** POST
- **URL:** `https://graph.facebook.com/v21.0/{instagram-business-account-id}/media`
- **Authentication:** Generic Credential (Bearer Token)
- **Headers:**
  - `Authorization: Bearer {INSTAGRAM_ACCESS_TOKEN}`
- **Body (JSON):**
```json
{
  "image_url": "{{ $json.imageUrl }}",
  "caption": "{{ $json.adaptedContent.instagram }}",
  "access_token": "={{ $credentials.instagram.accessToken }}"
}
```
- **Then POST to:** `https://graph.facebook.com/v21.0/{instagram-business-account-id}/media_publish`
  - Body: `{ "creation_id": "{response.id}" }`

**Limitations:**
- **Only images and carousels** (no Reels via API)
- Image must be publicly accessible URL
- Requires Instagram Business Account connected to Facebook Page
- Rate limit: 25 posts per 24h per user

#### 8. Post to LinkedIn (If Selected)
- **Node Type:** `n8n-nodes-base.httpRequest`
- **Method:** POST
- **URL:** `https://api.linkedin.com/v2/ugcPosts`
- **Authentication:** OAuth2
- **Headers:**
  - `Authorization: Bearer {LINKEDIN_ACCESS_TOKEN}`
  - `X-Restli-Protocol-Version: 2.0.0`
- **Body (JSON):**
```json
{
  "author": "urn:li:organization:{organization-id}",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "{{ $json.adaptedContent.linkedin }}"
      },
      "shareMediaCategory": "IMAGE",
      "media": [
        {
          "status": "READY",
          "media": "{{ $json.imageUrl }}"
        }
      ]
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

**Limitations:**
- Requires LinkedIn Company Page
- OAuth2 app must have `w_organization_social` scope
- Rate limit: 100 posts per day per organization
- Image must be pre-uploaded via Assets API (multi-step process)

**Note:** LinkedIn image posting via API is complex (requires asset upload first). For MVP, consider **text-only posts** and include note in `setup-guide.md` that images require manual upload or additional workflow complexity.

#### 9. Post to Facebook (If Selected)
- **Node Type:** `n8n-nodes-base.httpRequest`
- **Method:** POST
- **URL:** `https://graph.facebook.com/v21.0/{page-id}/photos`
- **Authentication:** Generic Credential (Bearer Token)
- **Body (JSON):**
```json
{
  "url": "{{ $json.imageUrl }}",
  "message": "{{ $json.adaptedContent.facebook }}",
  "access_token": "={{ $credentials.facebook.accessToken }}"
}
```

**Limitations:**
- Requires Facebook Page (not personal profile)
- Page Access Token (never expires if set correctly)
- Rate limit: 200 calls per user per hour

#### 10. Post to YouTube Community (If Selected)
- **Node Type:** `n8n-nodes-base.httpRequest`
- **Method:** POST
- **URL:** `https://www.googleapis.com/youtube/v3/posts`
- **Authentication:** OAuth2 (Google)
- **Body (JSON):**
```json
{
  "snippet": {
    "text": "{{ $json.adaptedContent.youtube }}"
  }
}
```

**Limitations:**
- **YouTube Community Tab API is experimental** and not publicly available
- Workaround: Use YouTube Data API v3 to post **video descriptions** or **playlists updates**, but **Community Tab requires manual posting**
- **Recommendation:** Skip YouTube automation for now, mark as manual

#### 11. Post to Google Business Profile (If Selected)
- **Status:** **API DEPRECATED**
- **Google Business Profile API** (formerly Google My Business) is being phased out
- **Current status (2026):** Local Post creation via API is no longer supported
- **Workaround:** Use **Google Business Profile dashboard** or third-party tools (Hootsuite, Buffer)
- **Recommendation:** Skip automation, mark as manual

#### 12. Collect Results
- **Node Type:** `n8n-nodes-base.code`
- **Purpose:** Aggregate posting results (success/failure per platform)

```javascript
const results = {
  postId: $json.postId,
  instagram: $node["Post to Instagram"].json?.success || false,
  linkedin: $node["Post to LinkedIn"].json?.success || false,
  facebook: $node["Post to Facebook"].json?.success || false,
  youtube: false, // manual
  googleBusiness: false, // manual
  errors: []
};

// Collect any error messages
if ($node["Post to Instagram"].json?.error) {
  results.errors.push(`Instagram: ${$node["Post to Instagram"].json.error}`);
}
// Repeat for other platforms

return { json: results };
```

#### 13. Update Sheet Status
- **Node Type:** `n8n-nodes-base.googleSheets`
- **Operation:** `Update Row`
- **Configuration:**
  - Row Number: `{{ $json.rowNumber }}`
  - Column J (status): `Publicado` (if all succeeded) or `Erro` (if any failed)

#### 14. Send Summary Notification
- **Node Type:** `n8n-nodes-base.emailSend`
- **To:** `andrefloresbrasil@gmail.com`
- **Subject:** `Publicação automática - {{ $now.format('DD/MM/YYYY') }}`
- **Body (HTML):**
```html
<h2>Resumo da Publicação Automática</h2>
<p><strong>Data:</strong> {{ $now.format('DD/MM/YYYY HH:mm') }}</p>
<p><strong>Posts processados:</strong> {{ $json.length }}</p>

<h3>Resultados:</h3>
<ul>
  {{ for post in $json }}
  <li>
    <strong>Post #{{ post.postId }}</strong><br>
    Instagram: {{ post.instagram ? '✅' : '❌' }}<br>
    LinkedIn: {{ post.linkedin ? '✅' : '❌' }}<br>
    Facebook: {{ post.facebook ? '✅' : '❌' }}<br>
    {{ if post.errors.length > 0 }}
      <strong style="color: red;">Erros:</strong>
      <ul>
        {{ for error in post.errors }}
        <li>{{ error }}</li>
        {{ endfor }}
      </ul>
    {{ endif }}
  </li>
  {{ endfor }}
</ul>

<p><em>Dashboard: <a href="https://hub.descomplicador.pt/business-dashboard/">Ver estado completo</a></em></p>
```

---

## Workflow 2: Content Repurposer (AI Adaptation Utility)

**Workflow Name:** `Social Media - AI Content Adapter`
**Trigger:** Webhook (POST)
**Purpose:** Take a piece of content and return platform-specific versions using Gemini Flash 2.5

### Node Sequence

#### 1. Webhook Trigger
- **Node Type:** `n8n-nodes-base.webhook`
- **HTTP Method:** POST
- **Path:** `social-media-adapter`
- **Response Mode:** Wait for response
- **Expected Input:**
```json
{
  "mainText": "string (required)",
  "pilar": "string (optional: Educação / Vendas / Bastidores / Resultados)",
  "imageUrl": "string (optional)"
}
```

#### 2. Validate Input
- **Node Type:** `n8n-nodes-base.if`
- **Condition:** `{{ $json.body.mainText && $json.body.mainText.length > 10 }}`
- **True:** Continue
- **False:** Return 400 error

#### 3. Adapt for Instagram
- **Node Type:** `n8n-nodes-base.langchainAgent` or HTTP Request to Google AI API
- **LLM:** Gemini Flash 2.5
- **Configuration:**
  - Model: `gemini-2.0-flash-exp`
  - Temperature: 0.7
  - Max Tokens: 3000
- **Prompt:**
```
SYSTEM:
És um copywriter especializado em conteúdo para Instagram em português europeu (pt-PT).

REGRAS:
- Usa português europeu (pt-PT), não brasileiro
- Máximo 2200 caracteres
- Inclui 5-8 hashtags relevantes (no final, após linha em branco)
- Tom visual e inspirador
- Call-to-action direto
- Formato: texto principal + linha em branco + hashtags
- Máximo 3 emojis
- O conteúdo é para Descomplicador.pt (automação e IA para negócios locais)

USER:
{{ if $json.body.pilar }}Pilar de conteúdo: {{ $json.body.pilar }}{{ endif }}

Texto original:
{{ $json.body.mainText }}

Adapta este conteúdo para Instagram, seguindo as regras acima.
Responde APENAS com o texto adaptado, sem explicações.
```

#### 4. Adapt for LinkedIn
- **Same structure as node 3, different prompt:**
```
SYSTEM:
És um copywriter especializado em conteúdo para LinkedIn em português europeu (pt-PT).

REGRAS:
- Usa português europeu (pt-PT), não brasileiro
- Máximo 3000 caracteres
- Tom profissional e thought-leadership
- Sem hashtags excessivos (máximo 3)
- Estrutura: gancho inicial (1-2 linhas) + desenvolvimento + conclusão/CTA
- Pode incluir pergunta de engagement no final
- O conteúdo é para Descomplicador.pt (automação e IA para negócios locais)

USER:
{{ if $json.body.pilar }}Pilar de conteúdo: {{ $json.body.pilar }}{{ endif }}

Texto original:
{{ $json.body.mainText }}

Adapta este conteúdo para LinkedIn, seguindo as regras acima.
Responde APENAS com o texto adaptado.
```

#### 5. Adapt for Facebook
```
SYSTEM:
És um copywriter especializado em conteúdo para Facebook em português europeu (pt-PT).

REGRAS:
- Usa português europeu (pt-PT), não brasileiro
- Idealmente 100-250 caracteres para melhor alcance
- Tom conversacional e engagement-focused
- Pergunta de engagement no final
- 2-3 emojis estratégicos
- O conteúdo é para Descomplicador.pt (automação e IA para negócios locais)

USER:
{{ if $json.body.pilar }}Pilar de conteúdo: {{ $json.body.pilar }}{{ endif }}

Texto original:
{{ $json.body.mainText }}

Adapta este conteúdo para Facebook, seguindo as regras acima.
Responde APENAS com o texto adaptado.
```

#### 6. Adapt for YouTube Community
```
SYSTEM:
És um copywriter especializado em conteúdo para YouTube Community Posts em português europeu (pt-PT).

REGRAS:
- Usa português europeu (pt-PT), não brasileiro
- Máximo 5000 caracteres
- Tom educativo e direto
- Convida ao engagement (like, comentário, subscrição)
- Sem hashtags (YouTube gere isso automaticamente)
- O conteúdo é para Descomplicador.pt (automação e IA para negócios locais)

USER:
{{ if $json.body.pilar }}Pilar de conteúdo: {{ $json.body.pilar }}{{ endif }}

Texto original:
{{ $json.body.mainText }}

Adapta este conteúdo para YouTube Community, seguindo as regras acima.
Responde APENAS com o texto adaptado.
```

#### 7. Adapt for Google Business Profile
```
SYSTEM:
És um copywriter especializado em conteúdo para Google Business Profile em português europeu (pt-PT).

REGRAS:
- Usa português europeu (pt-PT), não brasileiro
- Máximo 1500 caracteres
- Tom local e focado em benefícios imediatos
- Inclui call-to-action (Visite-nos, Contacte-nos, Saiba mais)
- Sem hashtags
- Foca em relevância local (Açores / Portugal)
- O conteúdo é para Descomplicador.pt (automação e IA para negócios locais)

USER:
{{ if $json.body.pilar }}Pilar de conteúdo: {{ $json.body.pilar }}{{ endif }}

Texto original:
{{ $json.body.mainText }}

Adapta este conteúdo para Google Business Profile, seguindo as regras acima.
Responde APENAS com o texto adaptado.
```

#### 8. Merge Results
- **Node Type:** `n8n-nodes-base.code`
- **Purpose:** Combine all adapted versions into single response object

```javascript
return {
  json: {
    original: $node["Webhook Trigger"].json.body.mainText,
    pilar: $node["Webhook Trigger"].json.body.pilar || null,
    adapted: {
      instagram: $node["Adapt for Instagram"].json.text,
      linkedin: $node["Adapt for LinkedIn"].json.text,
      facebook: $node["Adapt for Facebook"].json.text,
      youtube: $node["Adapt for YouTube Community"].json.text,
      googleBusiness: $node["Adapt for Google Business Profile"].json.text
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      model: "gemini-2.0-flash-exp"
    }
  }
};
```

#### 9. Respond
- **Node Type:** `n8n-nodes-base.respondToWebhook`
- **Response Mode:** Using Response Body
- **Response Body:** `{{ $json }}`

---

## Platform Integration Details

### Instagram (Business Account)

**API:** Instagram Graph API
**Authentication:** Facebook Access Token (Page-level)
**Node Type:** `n8n-nodes-base.httpRequest`

**Setup Requirements:**
1. Instagram Business Account connected to Facebook Page
2. Facebook Developer App with permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
3. Page Access Token (never expires if configured correctly)

**What's Possible:**
- ✅ Post single images
- ✅ Post carousels (up to 10 images)
- ✅ Schedule posts (up to 75 days in advance)
- ❌ Post Reels (API support limited/experimental)
- ❌ Post Stories (requires Instagram Basic Display API, limited)

**Rate Limits:**
- 25 API-published posts per 24 hours per user

**Implementation Notes:**
- Two-step process: Create media object → Publish container
- Image must be publicly accessible HTTPS URL (no base64)
- Caption max 2200 characters
- Hashtags count toward character limit

### LinkedIn (Company Page)

**API:** LinkedIn Marketing API (UGC Posts)
**Authentication:** OAuth2
**Node Type:** `n8n-nodes-base.httpRequest`

**Setup Requirements:**
1. LinkedIn Company Page
2. LinkedIn Developer App with permissions: `w_organization_social`, `r_organization_social`
3. OAuth2 flow to get access token
4. Organization URN (e.g., `urn:li:organization:12345678`)

**What's Possible:**
- ✅ Post text-only updates
- ✅ Post with external links (preview card)
- ⚠️ Post with images (requires multi-step asset upload)
- ✅ Schedule posts (via third-party tools, not native API)
- ❌ Post videos (requires separate Video API)

**Rate Limits:**
- 100 posts per day per organization
- 500 API calls per application per day per user

**Implementation Notes:**
- **Image posting is complex** (requires Assets API upload first)
- For MVP, recommend **text-only posts** + manual image upload
- Or: Add image upload sub-workflow (upload → get asset URN → create post with asset reference)

### Facebook (Page)

**API:** Facebook Graph API
**Authentication:** Page Access Token
**Node Type:** `n8n-nodes-base.httpRequest`

**Setup Requirements:**
1. Facebook Page
2. Facebook Developer App with permissions: `pages_manage_posts`, `pages_read_engagement`
3. Page Access Token (can be set to never expire)

**What's Possible:**
- ✅ Post photos with captions
- ✅ Post videos
- ✅ Post links (with preview)
- ✅ Schedule posts (via `scheduled_publish_time` parameter)
- ✅ Post carousels

**Rate Limits:**
- 200 calls per hour per user
- No specific post count limit (within rate limit)

**Implementation Notes:**
- Simplest API of all platforms
- Photos: POST to `/{page-id}/photos` with `url` + `message`
- Videos: POST to `/{page-id}/videos` (larger file size, longer processing)

### YouTube (Community Posts)

**API:** ⚠️ **Not publicly available**
**Current Status:** YouTube Community Tab posting via API is **experimental/restricted**

**What's Possible:**
- ❌ Post to Community Tab (API not available)
- ✅ Upload videos (YouTube Data API v3)
- ✅ Update video descriptions
- ✅ Manage playlists

**Workaround:**
- **Manual posting** via YouTube Studio
- **Video uploads** can be automated (if Descomplicador.pt creates video content)
- Third-party tools (Buffer, Hootsuite) claim Community Tab support but use scraping (against ToS)

**Recommendation:**
- **Skip automation** for Community Tab
- Mark as "Manual" in workflow
- If video content creation is planned, add video upload workflow later

### Google Business Profile

**API:** ⚠️ **Deprecated / Limited**
**Current Status:** Google Business Profile API (formerly My Business API) is being phased out

**What's Possible (as of 2026):**
- ⚠️ Local Posts API is deprecated (sunset 2024)
- ✅ Read business info (location, hours, etc.)
- ✅ Manage reviews (read/reply)
- ❌ Create posts (no longer supported)

**Workaround:**
- **Manual posting** via Google Business Profile dashboard
- Third-party tools (Hootsuite, Buffer, Podium) use official partnerships or scraping

**Recommendation:**
- **Skip automation** for Google Business Profile posts
- Mark as "Manual" in workflow
- Focus automation on platforms with stable APIs (Instagram, Facebook, LinkedIn)

---

## Manual Posting Requirements

The following platforms **cannot be automated** with current API availability:

| Platform | Reason | Workaround |
|----------|--------|-----------|
| YouTube Community | API not publicly available | Manual via YouTube Studio |
| Google Business Profile | API deprecated | Manual via Business Profile dashboard |

**Workflow Behavior for Manual Platforms:**
- AI adapter generates content for all platforms (including YouTube + Google Business)
- Content Scheduler workflow logs "manual required" for these platforms
- Email notification includes adapted content for manual copy-paste
- Spreadsheet status: `Publicado (manual pendente)`

---

## Error Handling & Monitoring

### Per-Platform Error Handling
- Each posting node has `continueOnFail: true`
- Errors captured in Collect Results node
- Failed platforms logged to Google Sheet + notification email

### Common Error Scenarios

**Instagram:**
- Invalid image URL (not HTTPS or not publicly accessible)
- Rate limit exceeded (25 posts/day)
- Caption too long (>2200 chars)
- Business account not connected to Facebook Page

**LinkedIn:**
- Invalid organization URN
- Access token expired (requires re-authentication)
- Rate limit exceeded (100 posts/day)
- Image asset upload failure (if using images)

**Facebook:**
- Invalid page ID
- Access token expired or insufficient permissions
- Image URL blocked by Facebook (policy violation)
- Rate limit exceeded (200 calls/hour)

### Monitoring Workflow (Optional Future Enhancement)

Create a separate workflow: `Social Media - Post Monitor`
- Scheduled hourly
- Reads Google Sheets for posts with status `Erro`
- Retries failed posts (with exponential backoff)
- Escalates repeated failures via email/WhatsApp

---

## Security & Credentials

### Required Credentials in n8n

| Platform | Credential Type | Required Scopes/Permissions |
|----------|----------------|---------------------------|
| Google Sheets | OAuth2 | `spreadsheets` |
| Instagram | Generic (Bearer Token) | Page Access Token with `instagram_content_publish` |
| LinkedIn | OAuth2 | `w_organization_social` |
| Facebook | Generic (Bearer Token) | Page Access Token with `pages_manage_posts` |
| Gemini Flash 2.5 | API Key | Google AI Studio API Key |
| Email (SMTP) | Generic | SMTP server credentials |

### Token Management

**Facebook/Instagram Page Access Token:**
- Generate via Facebook Graph API Explorer
- Set to "Never expires" (requires Page admin role)
- Store in n8n Generic Credential with header: `Authorization: Bearer {token}`

**LinkedIn OAuth2:**
- Use n8n OAuth2 credential type
- Refresh token valid for 60 days (n8n auto-refreshes)
- App must be approved for Marketing API access

**Gemini Flash 2.5:**
- API Key from Google AI Studio (https://aistudio.google.com/apikey)
- Free tier: 60 requests per minute
- Store in n8n Generic Credential or direct in node config

---

## Workflow JSON Structure

### File Names
- `Social-Media-Scheduler-Daily-Publisher.json`
- `Social-Media-AI-Content-Adapter.json`

### Import Instructions
1. Open n8n at https://hub.descomplicador.pt
2. Click "Add workflow" → "Import from File"
3. Select JSON file
4. Update all credential references (Google Sheets, Instagram, LinkedIn, Facebook, Gemini)
5. Update Google Sheets spreadsheet ID in "Read Content Calendar" node
6. Activate workflow

---

## Testing Strategy

### Unit Testing (Per Node)
1. **Test Schedule Trigger:** Manually execute workflow
2. **Test Google Sheets Read:** Execute with known sheet, verify row parsing
3. **Test AI Adapter:** Send test webhook with sample content, verify all 5 adaptations
4. **Test Each Platform Node:** Use test accounts, verify post creation

### Integration Testing (Full Flow)
1. Add test post to Google Sheets (today's date, all platforms selected)
2. Wait for scheduled execution (or trigger manually)
3. Verify posts appear on all platforms
4. Verify Google Sheet status updated to "Publicado"
5. Verify email notification received with correct summary

### Error Testing
1. Test with invalid image URL → verify error handling
2. Test with platform API credentials removed → verify graceful degradation
3. Test with empty sheet → verify workflow stops gracefully

---

## Future Enhancements

### Phase 2 Features
- **Multi-image carousels** (Instagram, Facebook)
- **Video posting** (YouTube, Facebook, Instagram)
- **LinkedIn image upload** (via Assets API)
- **Best time to post** analysis (read engagement data per platform)
- **A/B testing** (two versions of same content, track engagement)
- **Content recycling** (suggest old posts to re-share)

### Analytics Dashboard
- Separate workflow to fetch post engagement data (likes, comments, shares)
- Store in PostgreSQL or Google Sheets
- Build Grafana dashboard or Google Data Studio report

### Content Calendar UI
- Replace Google Sheets with custom web UI
- Built with vanilla HTML/CSS/JS (per Descomplicador.pt stack)
- Hosted on Caddy static path: `/social-media-calendar/`
- API endpoints in n8n for CRUD operations

---

## Maintenance Notes

### Credential Refresh Schedule
- **LinkedIn OAuth2:** Auto-refreshed by n8n (check every 30 days)
- **Facebook/Instagram Page Token:** Check every 60 days (should never expire if configured correctly)
- **Gemini API Key:** Check monthly for quota limits

### Platform API Version Updates
- **Instagram Graph API:** Currently v21.0 (check for updates quarterly)
- **LinkedIn API:** v2 stable (check for deprecation notices)
- **Facebook Graph API:** Currently v21.0 (major versions supported for 2 years)

### Workflow Backup
- Export workflow JSON monthly
- Store in `descomplica-workflows/social-media-scheduler/backups/`
- Commit to GitHub after any significant changes

---

## Cost Analysis

### API Costs (Monthly Estimates)

| Service | Usage | Cost |
|---------|-------|------|
| Gemini Flash 2.5 | ~150 requests/month (5 platforms × 30 days) | Free (under 60 RPM limit) |
| Instagram API | Free | $0 |
| LinkedIn API | Free | $0 |
| Facebook API | Free | $0 |
| Google Sheets API | Free | $0 |
| **Total** | | **$0/month** |

### Time Savings
- **Manual posting time:** ~15 min/post × 5 platforms × 30 days = **37.5 hours/month**
- **Automated posting time:** ~5 min/month (reviewing calendar + notifications) = **5 min/month**
- **Time saved:** **37+ hours/month**

---

## Support & Troubleshooting

### Common Issues

**"Sheet not found" error:**
- Verify Google Sheets ID in workflow configuration
- Check n8n has access to the sheet (share with service account email)

**"Invalid access token" error (Instagram/Facebook):**
- Regenerate Page Access Token in Facebook Graph API Explorer
- Update credential in n8n
- Verify token has correct permissions

**"Organization not found" error (LinkedIn):**
- Verify organization URN format: `urn:li:organization:{id}`
- Check app has access to the organization (admin must approve)

**"Content exceeds character limit" error:**
- AI adapter should enforce limits, but verify prompt templates
- Check raw content length before adaptation

**Posts not appearing on platform:**
- Check platform's moderation queue (Instagram, LinkedIn review some posts)
- Verify account is not shadowbanned or restricted
- Check API response for warnings

### Debug Mode
Add a "Debug Logger" node after each major step:
- **Node Type:** `n8n-nodes-base.httpRequest`
- **Method:** POST
- **URL:** Slack webhook or custom logging endpoint
- **Body:** `{{ JSON.stringify($json, null, 2) }}`

---

## Appendix: n8n Privacy Configuration

As specified in `CLAUDE.md`, all n8n instances must disable telemetry:

```bash
N8N_DIAGNOSTICS_ENABLED=false
N8N_VERSION_NOTIFICATIONS_ENABLED=false
N8N_TEMPLATES_ENABLED=false
N8N_ONBOARDING_FLOW_DISABLED=true
EXTERNAL_FRONTEND_HOOKS_URLS=
N8N_DIAGNOSTICS_CONFIG_FRONTEND=
N8N_DIAGNOSTICS_CONFIG_BACKEND=
```

These are already configured on `hub.descomplicador.pt` — no changes needed.

---

**End of Workflow Design Document**
