# Descomplica Workflows - Reusable n8n Components

A curated library of production-tested n8n workflow components extracted from real-world deployments. All personal data, API keys, and client-specific information have been sanitized for safe reuse.

## 📋 Quick Start

1. Browse the component categories below
2. Download the JSON file you need
3. Import into your n8n instance via **Workflows > Import from File**
4. Configure credentials (see Required Credentials in each component's metadata)
5. Customize parameters for your use case

## 🎯 Component Categories

### 1. Triggers
Pre-built webhook and event triggers ready to start your workflows.

- **whatsapp-whatsapp-webhook-verify.json**
  - WhatsApp webhook verification pattern
  - Handles GET requests for webhook verification token validation
  - Simple 3-node pattern: Webhook → Verify Token → Respond
  - **Required Credentials**: None
  - **Use Case**: WhatsApp Business API webhook setup

### 2. Integrations

#### Vapi (Voice AI Platform)

- **vapi-vapi-book-appointment.json**
  - Calendar appointment booking via voice
  - Integrates with Google Calendar
  - Handles availability checks and booking confirmation
  - **Required Credentials**: Google Calendar, HTTP (for Vapi)
  - **Nodes**: 9

- **vapi-vapi-check-calendar-availability.json**
  - Real-time calendar availability checking
  - Returns available slots for voice assistant
  - **Required Credentials**: Google Calendar, HTTP (for Vapi)
  - **Nodes**: 7

- **vapi-vapi-post-call-summary.json**
  - Post-call processing and summary generation
  - Stores call transcripts and metadata
  - **Required Credentials**: PostgreSQL, HTTP (for Vapi)
  - **Nodes**: 4

- **vapi-vapi-send-email.json**
  - Email sending triggered by voice commands
  - Gmail integration with dynamic content
  - **Required Credentials**: Gmail, HTTP (for Vapi)
  - **Nodes**: 8

- **vapi-vapi-transfer-call-to-human.json**
  - Human handoff pattern for voice AI
  - Escalation workflow when AI cannot handle request
  - **Required Credentials**: HTTP (for Vapi), notification service
  - **Nodes**: 6

### 3. Full Workflows

#### Flowise AI Assistants

- **flowise-assistente-de-conversao-flowise.json** (Sales Conversion Assistant)
  - WhatsApp-based sales conversation bot
  - Lead capture with structured data extraction
  - Intent classification (lead_capture, general, error)
  - Automatic lead routing to Gmail
  - **Required Credentials**: Flowise, Gmail, HTTP
  - **Nodes**: 10
  - **Features**:
    - Automatic lead data extraction from conversations
    - Reference ID generation
    - Email notifications for new leads
    - Fallback error handling

- **flowise-assistente-de-rh-flowise.json** (HR Assistant)
  - HR inquiry handling via WhatsApp
  - Employee question answering
  - Document and policy information retrieval
  - **Required Credentials**: Flowise, HTTP
  - **Nodes**: 16
  - **Features**:
    - Natural language HR query processing
    - Session management
    - Fallback responses

- **flowise-hotel-concierge-flowise.json** (Hotel Concierge)
  - Guest services chatbot
  - Booking inquiries and recommendations
  - Local information and services
  - **Required Credentials**: Flowise, HTTP
  - **Nodes**: 13
  - **Features**:
    - Multi-language support capability
    - Service request handling
    - Guest preference tracking

#### WhatsApp Integration

- **whatsapp-assistente-de-vendas-whatsapp.json** (Sales Assistant)
  - Full-featured WhatsApp sales automation
  - Product catalog integration
  - Order processing and tracking
  - Customer data management
  - **Required Credentials**: WhatsApp Business API, Google Sheets (optional), Gmail
  - **Nodes**: 16
  - **Features**:
    - Automated product recommendations
    - Order status updates
    - Customer segmentation
    - Business hours handling

#### Document Processing

- **invoice-ocr-processing.json**
  - Automated invoice processing from Gmail
  - OCR extraction via external service
  - Data storage in PostgreSQL
  - Google Sheets logging
  - **Required Credentials**: Gmail, Dropbox, PostgreSQL, Google Sheets
  - **Nodes**: 17
  - **Scheduled**: Every 15 minutes
  - **Features**:
    - Automatic PDF download from Gmail
    - OCR processing via API
    - Structured data extraction
    - Error handling and logging
    - Duplicate detection

## 📦 Installation

### Option 1: Individual Components

```bash
# Download a specific component
curl -O https://raw.githubusercontent.com/xxffoottxx/descomplica-workflows/main/integrations/vapi-vapi-book-appointment.json

# Import in n8n UI: Workflows > Import from File
```

### Option 2: Clone Repository

```bash
git clone https://github.com/xxffoottxx/descomplica-workflows.git
cd descomplica-workflows
```

## 🔧 Configuration Guide

### General Setup Steps

1. **Import Workflow**: Workflows > Import from File > Select JSON
2. **Review Nodes**: Check all nodes for placeholder values
3. **Configure Credentials**:
   - Click on any red node
   - Create or select existing credentials
   - Test connection
4. **Update Parameters**:
   - Replace `YOUR_*` placeholders with actual values
   - Update webhook paths: `/your-webhook-path` → `/your-actual-path`
   - Set API endpoints: `https://your-domain.com` → your actual domain
5. **Test**: Use "Execute Workflow" to test
6. **Activate**: Toggle "Active" when ready for production

### Common Credential Types

- **HTTP**: For external API integrations (Flowise, Vapi)
- **Gmail**: OAuth2 authentication
- **Google Calendar**: OAuth2 authentication
- **Google Sheets**: OAuth2 authentication
- **PostgreSQL**: Database connection
- **WhatsApp Business API**: Business Account credentials

### Placeholder Reference

Replace these placeholders in imported workflows:

- `YOUR_CREDENTIAL_NAME` → Your actual credential name in n8n
- `YOUR_API_KEY` → Your service API key
- `YOUR_CHATFLOW_ID` → Your Flowise chatflow ID
- `YOUR_SHEET_ID` → Your Google Sheets ID
- `/your-webhook-path` → Your webhook URL path
- `https://your-domain.com` → Your actual domain
- `your-email@example.com` → Your actual email
- `+XX XXX XXX XXX` → Your phone number

## 🏗️ Architecture Patterns

### Pattern 1: Webhook → Process → Respond
Simple synchronous request-response pattern.

```
Webhook → Code/Processing → Respond to Webhook
```

**Use Cases**: Vapi integrations, simple API endpoints

### Pattern 2: Trigger → Transform → Multi-Action
Scheduled or event-driven workflows with multiple outputs.

```
Schedule Trigger → Fetch Data → Split/Filter → [Gmail, Sheets, DB]
```

**Use Cases**: Invoice processing, batch operations

### Pattern 3: Webhook → AI Agent → Conditional → Actions
AI-powered workflows with dynamic routing.

```
Webhook → Flowise AI → Extract Intent → [Lead Capture, Email, Response]
```

**Use Cases**: Chatbots, intelligent assistants

## 📊 Node Type Reference

| Node Type | Count | Purpose |
|-----------|-------|---------|
| Code (JavaScript) | 33 | Custom logic, data transformation |
| Respond to Webhook | 19 | Synchronous HTTP responses |
| Gmail | 12 | Email operations |
| Webhook | 10 | HTTP endpoints |
| IF (Conditional) | 8 | Flow control |
| HTTP Request | 6 | External API calls |
| Dropbox | 5 | File storage |
| Switch | 4 | Multi-way routing |
| PostgreSQL | 4 | Database operations |
| Google Sheets | 3 | Spreadsheet integration |
| Google Calendar | 2 | Calendar operations |

## 🔒 Security & Privacy

✅ **All workflows have been sanitized**:
- No API keys or credentials
- No personal phone numbers or emails
- No client-specific domains
- No sensitive business data
- No database connection strings

⚠️ **Before deploying**:
- Review all Code nodes for hardcoded values
- Audit webhook paths for exposure
- Enable authentication where needed
- Use environment variables for secrets
- Test with non-production data first

## 🧪 Validation

Run the validation script to check for personal data leaks:

```bash
node scripts/validate.js
```

This script checks for:
- Email addresses (except placeholders)
- Phone numbers
- Specific domains
- API keys
- Google Sheets IDs

## 🤝 Contributing

Have a reusable workflow pattern to share?

1. Fork this repository
2. Sanitize ALL personal data using `scripts/extract-patterns.js` as reference
3. Add metadata to your workflow JSON
4. Run `node scripts/validate.js` to ensure clean
5. Update this README with your component description
6. Submit a pull request

## 📝 Component Metadata Structure

Each component includes metadata for discoverability:

```json
{
  "_metadata": {
    "name": "Component Name",
    "description": "What it does and why it's useful",
    "category": "trigger|integration|ai-agent|utility|full-workflow",
    "tags": ["tag1", "tag2"],
    "requiredCredentials": ["credential_type"],
    "source": "descomplica-production"
  },
  "nodes": [...],
  "connections": {...}
}
```

## 🛠️ Tools & Scripts

- **scripts/analyze-workflows.js**: Analyze n8n workflows for patterns
- **scripts/extract-patterns.js**: Extract and sanitize workflow components
- **scripts/validate.js**: Validate workflows for personal data leaks

## 📚 Use Cases

### 1. Voice AI Automation (Vapi)
Build voice-first customer service with calendar booking, email sending, and human handoff.

### 2. WhatsApp Business Automation
Create intelligent WhatsApp chatbots for sales, support, and lead generation.

### 3. AI-Powered Chatbots (Flowise)
Deploy conversational AI for HR, hospitality, and sales with pre-built patterns.

### 4. Document Processing
Automate invoice and document extraction with OCR and database storage.

## 🌟 Best Practices

1. **Start Simple**: Begin with single components, not full workflows
2. **Test Credentials First**: Verify all integrations before activating
3. **Version Control**: Keep JSON backups of your customized workflows
4. **Monitor Executions**: Watch for errors in n8n execution logs
5. **Scale Gradually**: Test with low traffic before production deployment
6. **Document Changes**: Note customizations for future reference

## 📞 Support

- **Issues**: https://github.com/xxffoottxx/descomplica-workflows/issues
- **n8n Community**: https://community.n8n.io
- **n8n Docs**: https://docs.n8n.io

## 📄 License

MIT License - Free to use, modify, and distribute with attribution.

## 🙏 Credits

These workflows were extracted from production systems built by Descomplica and sanitized for public use. All sensitive data has been removed to protect client privacy.

---

**⚡ Built with [n8n](https://n8n.io) - Fair-code workflow automation**
