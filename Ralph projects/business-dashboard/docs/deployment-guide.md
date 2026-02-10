# Deployment Guide - Business Dashboard

## Overview

This PWA can be deployed in multiple ways. Choose based on your infrastructure and requirements.

## Option 1: Cloudflare Pages (Recommended)

**Pros:** Free, fast global CDN, automatic HTTPS, built-in analytics
**Cost:** Free tier is sufficient

### Steps:

1. **Connect Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial dashboard deployment"
   git remote add origin https://github.com/yourusername/dashboard.git
   git push -u origin main
   ```

2. **Create Cloudflare Pages Project**
   - Log in to Cloudflare Dashboard
   - Go to Pages > Create a project
   - Connect your GitHub repository
   - Build settings:
     - Build command: (leave empty)
     - Build output directory: `src`
     - Root directory: (leave empty)

3. **Deploy**
   - Click "Save and Deploy"
   - Your dashboard will be live at `https://your-project.pages.dev`

4. **Custom Domain (Optional)**
   - In Cloudflare Pages, go to Custom domains
   - Add your domain (e.g., `dashboard.yourbusiness.pt`)
   - Update DNS records as instructed

5. **Environment Variables**
   - Go to Settings > Environment variables
   - Add `DATA_WEBHOOK_URL` with your n8n webhook URL
   - Add `REPORT_WEBHOOK_URL` with your n8n report webhook URL

## Option 2: Netlify

**Pros:** Easy setup, great developer experience
**Cost:** Free tier available

### Steps:

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**
   ```bash
   cd /path/to/business-dashboard
   netlify init
   # Follow prompts, set publish directory to "src"
   netlify deploy --prod
   ```

3. **Configure**
   - Set environment variables in Netlify dashboard
   - Add custom domain if needed

## Option 3: Serve via n8n Static Assets

**Pros:** Everything in one place, no external hosting needed
**Cons:** n8n not optimized for serving static files

### Steps:

1. **Enable n8n Static Assets**
   Add to n8n environment variables:
   ```
   N8N_SERVE_STATIC_FILES=true
   N8N_STATIC_FILES_PATH=/path/to/dashboard/src
   ```

2. **Restart n8n**
   ```bash
   docker-compose restart n8n
   # or
   pm2 restart n8n
   ```

3. **Access Dashboard**
   Navigate to `https://your-n8n-instance.com/static/index.html`

## Option 4: Traditional Web Hosting

**Pros:** Maximum control
**Cons:** Manual setup required

### Steps:

1. **Upload Files**
   - Upload entire `src` folder to your web host
   - Ensure `index.html` is in the root directory

2. **Configure Web Server**

   **Apache (.htaccess):**
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

   # PWA service worker
   <Files "sw.js">
     Header set Service-Worker-Allowed "/"
     Header set Cache-Control "no-cache"
   </Files>
   ```

   **Nginx:**
   ```nginx
   server {
     listen 80;
     server_name dashboard.yourbusiness.pt;
     return 301 https://$server_name$request_uri;
   }

   server {
     listen 443 ssl http2;
     server_name dashboard.yourbusiness.pt;

     ssl_certificate /path/to/cert.pem;
     ssl_certificate_key /path/to/key.pem;

     root /var/www/dashboard/src;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }

     location /sw.js {
       add_header Cache-Control "no-cache";
       add_header Service-Worker-Allowed "/";
     }

     location ~* \\.(?:css|js|jpg|png|svg|ico|woff|woff2)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }
   }
   ```

## n8n Workflow Deployment

### Import Workflows

1. **Access n8n**
   Navigate to your n8n instance

2. **Import Data Collector**
   - Click "Add workflow" > "Import from File"
   - Select `workflows/data-collector.json`
   - Update Google Sheets credentials and Spreadsheet IDs
   - Replace `YOUR_SPREADSHEET_ID` with actual ID
   - Activate the workflow

3. **Import Report Generator**
   - Click "Add workflow" > "Import from File"
   - Select `workflows/report-generator.json`
   - Update credentials
   - Activate the workflow

4. **Get Webhook URLs**
   - Open "Webhook - Manual Refresh" node
   - Copy the "Test URL" (for development) or "Production URL"
   - Update `src/js/app.js` CONFIG object:
     ```javascript
     const CONFIG = {
       dataWebhookUrl: 'https://your-n8n.com/webhook/dashboard-refresh',
       reportWebhookUrl: 'https://your-n8n.com/webhook/generate-report',
       // ...
     };
     ```

## Configuration

### Update Webhook URLs

Edit `src/js/app.js`:

```javascript
const CONFIG = {
  dataWebhookUrl: 'YOUR_N8N_WEBHOOK_URL_HERE',
  reportWebhookUrl: 'YOUR_N8N_REPORT_WEBHOOK_URL_HERE',
  refreshInterval: 30 * 60 * 1000, // 30 minutes
  dataEndpoint: 'data/dashboard-data.json',
};
```

### Change Default PIN

The default PIN is `1234`. To change it:

1. Open browser console on the dashboard
2. Run:
   ```javascript
   await authManager.changePin('1234', 'your-new-pin');
   ```
3. Or edit `src/js/auth.js` and generate a new hash:
   ```javascript
   const pin = '9876';
   const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
   console.log(Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));
   ```

## Testing

### Local Testing

1. **Install a local web server:**
   ```bash
   # Python
   cd src
   python3 -m http.server 8000

   # Node.js
   npx http-server src -p 8000

   # PHP
   cd src
   php -S localhost:8000
   ```

2. **Access Dashboard:**
   Open `http://localhost:8000` in your browser

3. **Test PWA:**
   - Chrome DevTools > Application > Service Workers
   - Verify service worker is registered
   - Test offline mode by disabling network in DevTools

### Mobile Testing

1. **Using ngrok (expose localhost to internet):**
   ```bash
   ngrok http 8000
   ```
   Access the HTTPS URL on your phone

2. **Or use your local IP:**
   ```bash
   python3 -m http.server 8000 --bind 0.0.0.0
   # Access at http://YOUR_LOCAL_IP:8000 on phone
   ```

## Security Considerations

1. **HTTPS Required:** PWAs require HTTPS in production (localhost is exempt)

2. **Change Default PIN:** Never deploy with PIN `1234` in production

3. **Webhook Security:**
   - Use n8n's built-in authentication for webhooks
   - Consider adding API keys or basic auth
   - Whitelist dashboard domain in n8n webhook settings

4. **CORS Configuration:**
   If dashboard and n8n are on different domains, configure CORS:
   - In n8n, set `N8N_CORS_ORIGIN=https://dashboard.yourbusiness.pt`

5. **Content Security Policy:**
   Add CSP headers for enhanced security:
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://your-n8n-instance.com;
   ```

## Monitoring

### Analytics

Add Cloudflare Analytics or Google Analytics:

```html
<!-- Add before </head> in index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking

Add Sentry for error monitoring:

```html
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  Sentry.init({ dsn: 'YOUR_SENTRY_DSN' });
</script>
```

## Updating the Dashboard

### Cloudflare Pages / Netlify:
```bash
git add .
git commit -m "Update dashboard"
git push
# Automatic deployment triggered
```

### Manual Hosting:
```bash
# Upload updated files via FTP/SFTP
# Clear browser cache or update service worker version
```

### Update Service Worker:
When making changes, update `CACHE_VERSION` in `src/sw.js`:
```javascript
const CACHE_VERSION = 'v1.0.1'; // Increment version
```

## Troubleshooting

**PWA not installing:**
- Verify HTTPS is enabled
- Check manifest.json is accessible
- Ensure service worker is registered (check DevTools > Application)

**Data not loading:**
- Verify webhook URLs are correct in app.js
- Check n8n workflows are activated
- Check CORS settings if cross-domain

**Offline mode not working:**
- Clear service worker and re-register
- Check cache storage in DevTools
- Verify service worker has no errors

**Charts not displaying:**
- Ensure Chart.js CDN is accessible
- Check browser console for errors
- Verify data structure matches expected format

## Production Checklist

- [ ] HTTPS enabled
- [ ] Default PIN changed
- [ ] Webhook URLs configured
- [ ] n8n workflows imported and activated
- [ ] Google Sheets connected (or production systems)
- [ ] PWA installable on mobile
- [ ] Offline mode working
- [ ] Custom domain configured (optional)
- [ ] Analytics added (optional)
- [ ] Error tracking added (optional)
- [ ] Tested on iOS Safari and Android Chrome
- [ ] Security headers configured

## Support

For issues or questions:
- Check n8n community: https://community.n8n.io/
- Review n8n documentation: https://docs.n8n.io/
- Test webhooks with curl or Postman before debugging frontend
