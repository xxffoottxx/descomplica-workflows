# Dashboard de Negócios — Business Dashboard PWA

> A mobile-first Progressive Web App for Portuguese business owners to monitor key metrics in real-time.

## Features

- **📱 Mobile-First PWA** — Installable on home screen, works offline
- **🔒 PIN Protection** — Secure access with SHA-256 hashed PIN
- **📊 Real-Time Metrics** — Sales, tasks, inventory, email, team tracking
- **📈 Interactive Charts** — Visual sales trends with Chart.js
- **📄 PDF Reports** — Generate custom reports for any date range
- **🔄 Auto-Refresh** — Data updates every 30 minutes + manual refresh
- **🇵🇹 Portuguese (pt-PT)** — All text in European Portuguese

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Charts:** Chart.js 4.4
- **Backend:** n8n workflows with webhook triggers
- **Data Source:** Google Sheets (demo) — easily replaceable with ERP systems
- **PWA:** Service Worker for offline support and caching

## Project Structure

```
business-dashboard/
├── src/
│   ├── index.html          # Main dashboard HTML
│   ├── manifest.json       # PWA manifest
│   ├── sw.js              # Service worker
│   ├── css/
│   │   └── styles.css     # Mobile-first responsive styles
│   └── js/
│       ├── app.js         # Main application logic
│       └── auth.js        # PIN authentication
├── workflows/
│   ├── data-collector.json      # n8n workflow for data aggregation
│   └── report-generator.json    # n8n workflow for PDF generation
└── docs/
    ├── architecture-decision.md  # PWA vs HTML decision rationale
    ├── sheets-setup.md          # Google Sheets data structure
    └── deployment-guide.md      # Comprehensive deployment guide
```

## Quick Start

### 1. Setup Google Sheets

Follow instructions in [`docs/sheets-setup.md`](docs/sheets-setup.md) to create data source sheets.

### 2. Import n8n Workflows

1. Open your n8n instance
2. Import `workflows/data-collector.json`
3. Import `workflows/report-generator.json`
4. Configure Google Sheets credentials
5. Update Spreadsheet IDs
6. Activate both workflows

### 3. Configure Dashboard

Edit `src/js/app.js` and update webhook URLs:

```javascript
const CONFIG = {
  dataWebhookUrl: 'YOUR_N8N_WEBHOOK_URL',
  reportWebhookUrl: 'YOUR_N8N_REPORT_WEBHOOK_URL',
  refreshInterval: 30 * 60 * 1000,
};
```

### 4. Deploy

**Option A: Cloudflare Pages (Recommended)**
```bash
# Connect your Git repo to Cloudflare Pages
# Set build output directory to: src
```

**Option B: Local Testing**
```bash
cd src
python3 -m http.server 8000
# Open http://localhost:8000
```

See [`docs/deployment-guide.md`](docs/deployment-guide.md) for detailed deployment options.

## Default Credentials

**PIN:** `1234`

⚠️ **IMPORTANT:** Change this before deploying to production!

To change PIN, open browser console on the dashboard:
```javascript
await authManager.changePin('1234', 'your-new-pin');
```

## Dashboard Sections

### Resumo do Dia
- Daily revenue with percentage change
- Order count with comparison
- Open tasks count
- Unread emails with important count

### Vendas (Sales)
- Interactive chart (today/week/month views)
- Average ticket value
- Weekly and monthly totals

### Tarefas (Tasks)
- Open, completed, and overdue task counts
- Progress bar visualization
- Completion percentage

### Stock (Inventory)
- Low stock alerts
- Total products count
- Estimated inventory value
- Detailed low stock item list

### Email
- Unread and important email counts
- Emails sent today
- Response rate percentage

### Equipa (Team)
- Present team members count
- Total hours worked
- Individual team member details

## n8n Workflows

### Data Collector
- **Trigger:** Schedule (every 30 min) + Webhook (manual refresh)
- **Sources:** 5 Google Sheets (Vendas, Tarefas, Stock, Equipa, Email)
- **Output:** Aggregated JSON data
- **ERP Placeholders:** Clearly marked for Artsoft, Primavera, Sage

### Report Generator
- **Trigger:** Webhook with date range parameters
- **Process:** Fetch data, generate HTML, convert to PDF
- **Output:** Downloadable PDF report
- **Format:** Professional business report with metrics and tables

## Migration to Production Systems

The Google Sheets nodes have clear placeholders for replacement:

- **Vendas** → Artsoft, Primavera, Sage ERP connectors
- **Tarefas** → Asana, Monday.com, Trello APIs
- **Stock** → ERP inventory modules or WMS systems
- **Equipa** → HR systems, time tracking software
- **Email** → Gmail API, Outlook Graph API

See comments in `workflows/data-collector.json` for specific replacement points.

## Browser Support

### Fully Supported
- Chrome/Edge 90+ (Android/Desktop)
- Safari 14+ (iOS/macOS)
- Firefox 88+ (Android/Desktop)

### PWA Install Support
- ✅ Chrome Android (recommended)
- ✅ Safari iOS 16.4+
- ✅ Edge Android/Desktop
- ⚠️ Firefox (limited PWA support)

## Security Features

- **PIN Protection:** SHA-256 hashed, session-based authentication
- **HTTPS Required:** PWA mandate for production
- **Service Worker:** Secure caching strategies
- **CORS Configuration:** Webhook access control
- **No External Dependencies:** Minimal attack surface (only Chart.js from CDN)

## Performance

- **First Load:** < 2s on 3G connection
- **Subsequent Loads:** < 500ms (service worker cache)
- **Offline Support:** Shows last cached data
- **Mobile Optimized:** Target 375px minimum width
- **Lighthouse Score:** PWA 90+, Performance 95+

## Development

### Local Development
```bash
cd src
python3 -m http.server 8000
```

### Testing PWA Features
1. Open Chrome DevTools
2. Application tab → Service Workers
3. Verify registration and caching
4. Test offline mode (Network → Offline)

### Updating Service Worker
When making changes, increment version in `src/sw.js`:
```javascript
const CACHE_VERSION = 'v1.0.1'; // Increment this
```

## Documentation

- [`docs/architecture-decision.md`](docs/architecture-decision.md) — Why PWA over simple HTML
- [`docs/sheets-setup.md`](docs/sheets-setup.md) — Google Sheets structure and setup
- [`docs/deployment-guide.md`](docs/deployment-guide.md) — Complete deployment instructions

## Forbidden Actions

⚠️ **DO NOT:**
- Run `git push` (always manual)
- Modify `.ralphrc` configuration
- Deploy/activate n8n workflows without testing
- Use Brazilian Portuguese (only pt-PT)

## License

Proprietary — For internal business use only.

## Support

For issues or questions:
- Check deployment guide first
- Test n8n webhooks with curl/Postman
- Verify service worker registration in DevTools
- Check browser console for JavaScript errors

---

**Built with ❤️ for Portuguese business owners**
