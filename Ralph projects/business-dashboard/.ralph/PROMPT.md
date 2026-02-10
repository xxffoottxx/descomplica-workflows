# Ralph — Business Dashboard + Report Generator

## Context
You are Ralph, building a mobile-first business dashboard for local business owners in Portugal. The dashboard provides a bird's-eye view of daily/weekly/monthly metrics across email, tasks, staff, sales, and inventory. It updates every 30 minutes via an n8n workflow and includes a manual refresh button and PDF report generation.

## FORBIDDEN
- NEVER run `git push`
- NEVER modify `.ralphrc`
- NEVER deploy or activate workflows on n8n
- NEVER use Brazilian Portuguese — all text must be European Portuguese (pt-PT)

## Architecture Decision
You must decide between a PWA (Progressive Web App) or a simple HTML page. Consider:
- Target users are business owners checking on their phone throughout the day
- Must work well on mobile (90%+ usage is mobile)
- Needs PIN/password protection
- Needs an "Atualizar" button and "Gerar Relatório" feature
- Must feel professional and polished

Document your decision and reasoning in `docs/architecture-decision.md`.

## System Components

### 1. n8n Data Collection Workflow (`workflows/data-collector.json`)
- **Trigger**: Schedule node — every 30 minutes
- **Also**: Webhook trigger for manual "Atualizar" button
- **Data sources** (Google Sheets as demo backend):
  - Email metrics sheet: unread count, important emails today, response rate
  - Tasks sheet: open tasks, completed today, overdue
  - Staff sheet: who's working today, attendance, hours
  - Sales sheet: today's revenue, orders, average ticket, comparison to yesterday/last week
  - Stock/Inventory sheet: low stock alerts, total items, value
- **Output**: Aggregated JSON saved to a static endpoint or file that the dashboard reads
- **Placeholders**: Mark clearly where ERP/CRM connectors would replace Sheets (e.g., Artsoft, Primavera)

### 2. Dashboard Frontend
- Mobile-first responsive design
- PIN protection screen on load (4-6 digit PIN, stored as hash)
- Language: all labels, headers, buttons in pt-PT
- Sections:
  - **Resumo do Dia** — key metrics cards (receita, pedidos, tarefas, emails)
  - **Vendas** — today/week/month with simple chart
  - **Tarefas** — open, completed, overdue with progress bar
  - **Stock** — low stock alerts, inventory value
  - **Email** — unread count, important flagged
  - **Equipa** — who's in today, hours logged
- **"Atualizar" button** — calls the webhook to refresh data, shows loading spinner
- **"Gerar Relatório" button** — opens date range picker, generates PDF

### 3. PDF Report Generator (`workflows/report-generator.json`)
- Triggered via webhook with `startDate` and `endDate` parameters
- Pulls data from Google Sheets for the specified range
- Generates a beautiful PDF with:
  - Company header/logo placeholder
  - Date range
  - Summary metrics with comparison to previous period
  - Charts: sales trend line, task completion bar chart, stock levels
  - Key highlights and alerts
- Use HTML-to-PDF approach (generate HTML report, convert with a headless browser or n8n's built-in capabilities)
- Return PDF as downloadable file or send via email

## Design Guidelines
- Clean, modern design — think Stripe Dashboard or Linear
- Color palette: professional blues/grays with accent color for alerts
- Large, readable numbers for key metrics
- Icons for each section (use simple SVG or Unicode symbols — no external icon libraries that need CDN)
- Smooth transitions and loading states
- Dark mode support is a nice-to-have but not required

## Google Sheets Data Structure
Create sample sheets structure in `docs/sheets-setup.md`:
- `Vendas` sheet: Date, Order ID, Amount, Items, Customer, Status
- `Tarefas` sheet: Task, Assignee, Status, Due Date, Priority
- `Stock` sheet: Product, SKU, Quantity, Min Quantity, Unit Price, Supplier
- `Equipa` sheet: Name, Role, Date, Check-in, Check-out, Status
- `Email Metrics` sheet: Date, Unread, Important, Sent, Response Rate

## Tech Constraints
- Frontend: vanilla HTML + CSS + JS (no frameworks)
- Charts: lightweight library OK (Chart.js is fine, no D3.js overkill)
- No server-side rendering needed — static files served by n8n or Cloudflare Pages
- PDF generation within n8n workflow capabilities

## Validation
- Dashboard must be fully functional on mobile (test at 375px width)
- All text in pt-PT
- PIN screen must actually block access
- Atualizar button must trigger real webhook call
- All n8n workflow JSONs must be valid and parseable
- Charts must render with sample data

## Status Reporting (CRITICAL)

At the end of your response, ALWAYS include:

```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
WORK_TYPE: IMPLEMENTATION | TESTING | DOCUMENTATION | REFACTORING
EXIT_SIGNAL: false | true
RECOMMENDATION: <one line summary of what to do next>
---END_RALPH_STATUS---
```

Set EXIT_SIGNAL: true only when ALL fix_plan.md items are [x].
