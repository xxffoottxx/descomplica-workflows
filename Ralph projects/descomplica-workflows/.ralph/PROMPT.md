# Ralph — Descomplica Reusable Workflow Library

## Context
You are Ralph, building a reusable n8n workflow component library by analyzing existing production workflows. The goal is to extract common patterns, strip personal/client data, and organize them into a GitHub repository that accelerates future client deployments.

## FORBIDDEN
- NEVER leave any personal data, API keys, client names, or specific business info in the output workflows
- NEVER delete or modify the production workflows on n8n
- NEVER modify `.ralphrc`

## Environment
- n8n API: `https://n8n.descomplicador.pt`
- API key is in env var `N8N_API_KEY` — use it with header `X-N8N-API-KEY`
- GitHub token is in env var `GH_TOKEN` / `GITHUB_TOKEN`
- GitHub username: `xxffoottxx`
- Target repo: `xxffoottxx/descomplica-workflows`

## n8n API Reference
- List workflows: `GET /api/v1/workflows` (paginated, use `?limit=100`)
- Get workflow: `GET /api/v1/workflows/{id}`
- Response contains: `name`, `nodes`, `connections`, `settings`, `active`

## What to Build

### Phase 1: Fetch & Analyze
1. Use `curl` with the n8n API to fetch ALL active workflows
2. Save raw JSONs locally for analysis
3. Identify recurring patterns:
   - Common node combinations (e.g., webhook → filter → respond)
   - AI agent setups (agent + memory + tools)
   - WhatsApp message handling patterns
   - Error handling patterns
   - Scheduling patterns
   - Data transformation chains

### Phase 2: Extract & Generalize
For each identified pattern:
1. Extract the relevant nodes and connections
2. Replace ALL personal/client-specific data with generic placeholders:
   - Credentials → `"credentialName": "YOUR_CREDENTIAL_NAME"`
   - URLs → `https://your-domain.com/...`
   - Phone numbers → `+XXXXXXXXXXX`
   - Email addresses → `your-email@example.com`
   - API keys → `YOUR_API_KEY`
   - Webhook paths → `your-webhook-path`
   - Chatflow IDs → `YOUR_CHATFLOW_ID`
3. Keep node types, typeVersions, parameters structure, and connection topology intact
4. Generate unique UUIDs for node IDs
5. Add a `_metadata` field to each workflow JSON with: `name`, `description`, `category`, `tags`, `requiredCredentials`

### Phase 3: Organize & Document
Create this repository structure:
```
descomplica-workflows/
├── README.md (catalog of all components with descriptions)
├── triggers/
│   ├── whatsapp-webhook.json
│   ├── scheduled-cron.json
│   └── ...
├── ai-agents/
│   ├── basic-agent-with-memory.json
│   ├── agent-with-tools.json
│   └── ...
├── integrations/
│   ├── gmail-tools.json
│   ├── google-calendar-tools.json
│   ├── google-sheets-tools.json
│   └── ...
├── error-handling/
│   └── error-catch-notify.json
├── utilities/
│   ├── data-transform.json
│   ├── filter-and-route.json
│   └── ...
└── full-workflows/
    ├── whatsapp-chatbot-template.json
    ├── scheduled-report-template.json
    └── ...
```

### Phase 4: GitHub
1. Create the repo: `gh repo create xxffoottxx/descomplica-workflows --public --description "Reusable n8n workflow components for rapid client deployment"`
2. Initialize with README
3. Commit all organized workflow files
4. Push to GitHub

## Validation
- Every JSON file must be valid JSON (parse with `node -e`)
- Every workflow must have zero personal data (grep for known patterns like phone numbers, specific domains, emails)
- Connections must reference existing node names within the same file
- README must list all components with clear descriptions

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
