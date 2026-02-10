# Quick Setup Instructions

## Prerequisites

- n8n instance (self-hosted or cloud)
- Google account for Sheets
- Web hosting (Cloudflare Pages recommended) or local server for testing

## Step 1: Google Sheets Setup (15 minutes)

1. Create a new Google Spreadsheet
2. Create 5 sheets with these exact names:
   - `Vendas`
   - `Tarefas`
   - `Stock`
   - `Equipa`
   - `Email Metrics`

3. Add headers and sample data following [`docs/sheets-setup.md`](docs/sheets-setup.md)

4. Copy your Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

## Step 2: n8n Workflow Import (10 minutes)

### Import Data Collector

1. Open n8n
2. Click "+" → "Import from File"
3. Select `workflows/data-collector.json`
4. Configure Google Sheets credentials (OAuth2)
5. Open each Google Sheets node and update:
   - Document ID: `YOUR_SPREADSHEET_ID`
   - Sheet name: (should be correct already)

6. **IMPORTANT:** Open "Process & Aggregate Data" node
   - Copy code from `workflows/data-processor-code.js`
   - Paste into the jsCode field
   - Save

7. Activate the workflow
8. Copy the Webhook URL from "Webhook - Manual Refresh" node

### Import Report Generator

1. Click "+" → "Import from File"
2. Select `workflows/report-generator.json`
3. Configure Google Sheets credentials (same as above)
4. Update Spreadsheet ID in "Fetch Sales Data" node
5. Activate the workflow
6. Copy the Webhook URL from "Webhook - Generate Report" node

## Step 3: Configure Dashboard (5 minutes)

1. Open `src/js/app.js`
2. Find the CONFIG object (around line 10):

```javascript
const CONFIG = {
  dataWebhookUrl: 'PASTE_DATA_COLLECTOR_WEBHOOK_URL_HERE',
  reportWebhookUrl: 'PASTE_REPORT_GENERATOR_WEBHOOK_URL_HERE',
  refreshInterval: 30 * 60 * 1000,
  dataEndpoint: 'data/dashboard-data.json',
};
```

3. Replace the URLs with your n8n webhook URLs
4. Save the file

## Step 4: Deploy Dashboard (Choose One)

### Option A: Cloudflare Pages (Recommended)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial dashboard"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. Go to Cloudflare Dashboard → Pages
3. "Create a project" → Connect GitHub
4. Build settings:
   - Build output directory: `src`
   - Leave build command empty
5. Deploy
6. Your dashboard will be live at `https://your-project.pages.dev`

### Option B: Local Testing

```bash
cd src
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser

**Note:** For PWA features, you need HTTPS. Use ngrok for mobile testing:
```bash
ngrok http 8000
```

## Step 5: Test (5 minutes)

1. Open dashboard URL
2. Enter PIN: `1234`
3. You should see demo data in all sections
4. Click "Atualizar" button - it should fetch data from n8n
5. Click "Gerar Relatório" - select date range and generate PDF

## Step 6: Change Default PIN

**CRITICAL:** Change the default PIN before sharing!

1. Open browser console on the dashboard (F12)
2. Run:
   ```javascript
   await authManager.changePin('1234', 'YOUR-NEW-PIN');
   ```
3. Confirm: "PIN changed successfully"
4. Test by logging out and back in with new PIN

## Step 7: Mobile Installation (Optional)

### On Android (Chrome)

1. Open dashboard URL on mobile Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Tap "Add"
4. Dashboard icon appears on home screen

### On iOS (Safari)

1. Open dashboard URL in Safari
2. Tap share button (square with arrow)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"

## Troubleshooting

### Dashboard shows "Erro ao carregar dados"
- Check webhook URLs in `src/js/app.js`
- Verify n8n workflows are activated
- Test webhooks with curl:
  ```bash
  curl -X POST https://your-n8n-url/webhook/dashboard-refresh
  ```

### n8n workflow fails
- Check Google Sheets credentials are authorized
- Verify Spreadsheet ID is correct
- Ensure sheet names match exactly
- Check if "Process & Aggregate Data" code was pasted

### PWA not installing
- Must be served over HTTPS (except localhost)
- Check manifest.json is accessible
- Verify service worker is registered (DevTools → Application)

### Charts not displaying
- Check Chart.js CDN is accessible
- Verify data structure in browser console
- Check for JavaScript errors in console

### PIN not working
- Clear browser cache and localStorage
- Default PIN is `1234`
- Try resetting PIN in browser console

## Next Steps

### For Production

1. **Replace Google Sheets** with real systems:
   - See notes in workflow nodes for connector options
   - Common: Artsoft, Primavera, Sage, custom APIs

2. **Add custom domain:**
   - In Cloudflare Pages: Custom domains → Add domain
   - Update DNS records

3. **Secure webhooks:**
   - Add authentication to n8n webhooks
   - Configure CORS: `N8N_CORS_ORIGIN=https://dashboard.yourdomain.pt`

4. **Create PWA icons:**
   - Generate 72px to 512px PNG icons
   - Place in `src/assets/` folder
   - Icons referenced in manifest.json

5. **Optional enhancements:**
   - Add Google Analytics
   - Add Sentry error tracking
   - Customize colors/branding
   - Add more metrics

## Support

- **Documentation:** See `docs/` folder for detailed guides
- **n8n Community:** https://community.n8n.io/
- **Issue:** Check browser console first, then n8n workflow logs

---

**Setup Time:** ~35 minutes total
**Difficulty:** Beginner-friendly

Enjoy your new dashboard! 🚀
