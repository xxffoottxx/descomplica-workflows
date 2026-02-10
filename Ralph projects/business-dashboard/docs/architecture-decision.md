# Architecture Decision: PWA vs Simple HTML Page

## Decision: Progressive Web App (PWA)

**Date:** 2026-02-10
**Status:** Accepted

## Context

We are building a mobile-first business dashboard for local business owners in Portugal. The primary use case is checking key metrics throughout the day on mobile devices (90%+ mobile usage expected).

### Requirements
- Mobile-first design (must work excellently on phones)
- PIN/password protection for security
- Manual refresh button ("Atualizar")
- PDF report generation ("Gerar Relatório")
- Professional and polished feel
- Works reliably on mobile networks (can be spotty)
- Quick access throughout the day

## Options Considered

### Option 1: Simple HTML Page
**Pros:**
- Simpler to build and deploy
- No service worker complexity
- Easy to update and maintain
- Works on any web server

**Cons:**
- Always requires internet connection
- No offline capability
- Can't be added to home screen with app-like experience
- Must re-enter URL or bookmark
- Less professional feel on mobile
- Reloads entire page on every visit

### Option 2: Progressive Web App (PWA)
**Pros:**
- **Can be installed to home screen** — business owners can tap an icon like a native app
- **Works offline** — can show last cached data even without connection
- **Faster loading** — service worker caches assets and data
- **Better mobile experience** — full-screen, no browser chrome
- **Professional feel** — indistinguishable from native app
- **Splash screen support** — branded loading experience
- **Push notifications** (future enhancement for alerts)
- **Better engagement** — studies show 40% higher engagement vs mobile web

**Cons:**
- Slightly more complex initial setup
- Requires HTTPS (already planned for production)
- Service worker management adds some code
- Browser compatibility considerations (but good support in 2026)

## Decision

**We will build a Progressive Web App (PWA).**

### Rationale

1. **User Experience**: Business owners will access this dashboard 5-10+ times per day. Having it as an installable app icon is significantly more convenient than navigating to a URL.

2. **Offline Resilience**: Portuguese mobile networks can be unreliable in some areas. A PWA can show the last cached data even offline, which is better than a white screen.

3. **Professional Image**: A PWA feels more professional and polished — it shows we care about their experience.

4. **Performance**: Service worker caching makes subsequent loads nearly instant, which matters when checking metrics quickly between tasks.

5. **Minimal Additional Complexity**: The delta between a simple HTML page and a PWA is:
   - A `manifest.json` file (~30 lines)
   - A service worker (`sw.js`, ~100 lines for basic caching)
   - A few meta tags in HTML

   This is well worth the UX improvement.

6. **Future-Proof**: Starting as a PWA opens doors for future enhancements like push notifications for critical alerts (low stock, high-priority tasks, etc.)

## Implementation Plan

### Required Files
```
src/
├── index.html          # Main dashboard with PWA meta tags
├── manifest.json       # PWA manifest (name, icons, theme)
├── sw.js              # Service worker for caching
├── css/
│   └── styles.css     # Mobile-first styles
└── js/
    ├── app.js         # Main application logic
    └── auth.js        # PIN protection
```

### PWA Manifest Structure
```json
{
  "name": "Dashboard de Negócios",
  "short_name": "Dashboard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [...]
}
```

### Service Worker Strategy
- **Cache-first** for static assets (HTML, CSS, JS)
- **Network-first with fallback** for data API calls
- Cache the last successful data response for offline viewing
- Cache lifetime: 30 days for assets, 1 hour for data

### Installation Prompt
- Detect if user hasn't installed the app
- Show a subtle, dismissible banner after 2-3 visits: "Adicionar ao ecrã inicial para acesso rápido"
- Don't be annoying — one-time prompt with option to dismiss permanently

## Acceptance Criteria

- [ ] App can be installed to home screen on iOS Safari and Android Chrome
- [ ] Works offline and shows last cached data
- [ ] Loads in under 2 seconds on 3G connection after first visit
- [ ] Feels indistinguishable from a native app when opened from home screen
- [ ] All PWA best practices met (Lighthouse PWA audit score 90+)

## Validation

Test on:
- Android Chrome (primary target)
- iOS Safari (secondary but important)
- Screen sizes: 375px (iPhone SE), 390px (iPhone 12/13), 412px (Android common)

## Notes

- Keep service worker simple initially — we can optimize caching strategies later
- Provide clear update mechanism when new version is deployed
- Consider versioning the cache to force updates when needed
- Document the offline experience clearly for users (show "Dados offline" indicator)

## References

- [PWA Best Practices 2026](https://web.dev/pwa)
- [Service Worker Cookbook](https://serviceworke.rs/)
- Target: Lighthouse PWA Score 90+
