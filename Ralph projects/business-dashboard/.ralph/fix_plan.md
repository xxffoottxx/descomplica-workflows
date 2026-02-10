# Fix Plan — Business Dashboard + Report Generator

## High Priority
- [x] Document architecture decision (PWA vs HTML) in `docs/architecture-decision.md`
- [x] Build PIN protection screen (pt-PT, mobile-first, hash-based PIN storage)
- [x] Build dashboard layout with all metric sections: Resumo, Vendas, Tarefas, Stock, Email, Equipa
- [x] Implement responsive mobile-first CSS (target 375px minimum width)
- [x] Build n8n data collection workflow (`workflows/data-collector.json`) with schedule + webhook triggers

## Medium Priority
- [x] Add Chart.js charts: sales trend line, task completion bars, stock levels
- [x] Implement "Atualizar" button with webhook call and loading spinner
- [x] Build n8n report generator workflow (`workflows/report-generator.json`) with date range params
- [x] Implement "Gerar Relatório" button with date range picker UI
- [x] Create PDF report template with HTML-to-PDF conversion in n8n

## Low Priority
- [x] Document Google Sheets data structure in `docs/sheets-setup.md`
- [x] Add sample data for demo/testing
- [x] Mark ERP/CRM connector placeholders clearly in workflow JSONs (Artsoft, Primavera spots)
- [x] Write `docs/deployment-guide.md` — how to deploy to Cloudflare Pages or serve via n8n
- [x] Validate all workflows and frontend files

## Completed
- [x] Project initialization
- [x] PWA architecture with manifest.json and service worker
- [x] PIN protection with SHA-256 hashing
- [x] Full dashboard UI with all metric sections
- [x] Mobile-first responsive CSS (375px+)
- [x] Chart.js integration for sales visualization
- [x] n8n data collection workflow with Google Sheets
- [x] n8n PDF report generator workflow
- [x] Complete documentation (architecture, sheets setup, deployment)

## Notes
- ALL user-facing text in European Portuguese (pt-PT) — NEVER Brazilian Portuguese
- Mobile-first design (90%+ usage is phone)
- Google Sheets as demo data backend with clear placeholders for real ERP systems
- Keep it clean and professional — Stripe/Linear design inspiration
- Vanilla HTML/CSS/JS only, Chart.js is the only allowed library
