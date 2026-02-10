# Ralph — Jarvis WhatsApp Personal Assistant

## Context
You are Ralph, building a WhatsApp-based personal productivity assistant for Andre at Descomplica (descomplicador.pt). This will also serve as a template adaptable for clients. The assistant connects to Gmail, Google Calendar, Google Sheets, Google Contacts, and Google Tasks via direct n8n tool nodes (NO MCP architecture).

## FORBIDDEN
- NEVER run `git push`
- NEVER modify `.ralphrc`
- NEVER deploy or activate workflows on n8n — only generate JSON files

## Reference
There is an inspiration workflow at `reference/jarvis-inspiration.json` — study its structure for the AI agent pattern, WhatsApp message handling, and tool configurations. Adapt the architecture but replace:
- OpenAI → Gemini Flash 2.5 (`@n8n/n8n-nodes-langchain.lmChatGoogleGemini`)
- MCP architecture → Direct tool connections to the agent
- Personal data → Placeholders for easy client customization
- Timezone → Europe/Lisbon
- Language → European Portuguese (pt-PT) for all user-facing text

## WhatsApp Setup (Descomplica)
- Phone: `+351 923 124 800`
- Phone Number ID: `1005307842661678`
- WABA ID: `1455185509564906`
- Webhook base: `https://n8n.descomplicador.pt/webhook/`
- Filter: only allow messages from Andre's number (configure as placeholder `YOUR_PHONE_NUMBER`)

## Architecture

### Main Workflow: `jarvis-whatsapp-assistant.json`
```
WhatsApp Trigger (webhook)
  → Filter (only allowed sender)
  → Switch (text vs audio)
  → [Text path] → AI Agent (Gemini Flash 2.5)
  → [Audio path] → Speech-to-Text → AI Agent
  → Format Response → Send WhatsApp Reply
```

### AI Agent Configuration
- Model: Gemini Flash 2.5 (`models/gemini-2.5-flash`)
- Memory: Buffer Window Memory (session per user, key = sender phone)
- System prompt in pt-PT, professional but friendly personal assistant tone
- Name: "Jarvis"
- Timezone awareness: inject current datetime via expression `{{ $now }}`

### Direct Tool Nodes (connected to AI Agent)
**Gmail Tools:**
- Send Email (gmailTool, send)
- Reply to Email (gmailTool, reply)
- Get Emails (gmailTool, getAll)
- Draft Email (gmailTool, draft)
- Add Label (gmailTool, addLabels)
- Get Labels (gmailTool, label/getAll)

**Google Calendar Tools:**
- Check Availability (googleCalendarTool, default)
- Get Events (googleCalendarTool, getAll)
- Create Event (googleCalendarTool, create)
- Update Event (googleCalendarTool, update)
- Delete Event (googleCalendarTool, delete)
- Get Event (googleCalendarTool, get)

**Google Contacts Tools:**
- Get Contacts / Search (googleContactsTool, getAll)

**Google Sheets Tools:**
- Read Sheet (googleSheetsTool, read)
- Append Row (googleSheetsTool, append)
- Clear Rows (googleSheetsTool, clear)

**Google Tasks Tools:**
- Create Task (googleTasksTool, create)
- Get Tasks (googleTasksTool, getAll)
- Get Task (googleTasksTool, get)
- Complete Task (googleTasksTool, update)
- Delete Task (googleTasksTool, delete)

**Placeholder Tools (marked with TODO comments):**
- CRM/Sales Database → Leave as a placeholder tool node with description "Connect to your CRM system"
- Custom Task Manager → Leave as placeholder for clients using systems other than Google Tasks

### Voice Message Support
- Only include if n8n has a built-in or free speech-to-text option
- Check if `@n8n/n8n-nodes-langchain` has a Whisper or built-in STT node
- If no reliable free option exists, skip voice and document it as a future enhancement
- Do NOT use ElevenLabs or any paid service

## n8n Node Conventions
- Code v2 (`typeVersion: 2`): uses `$input.first()`/`$input.all()`, param `jsCode`
- IF v2: `{conditions: [{leftValue, rightValue, operator: {type, operation}}], combinator}`
- Every node needs: `id` (UUID), `name`, `type`, `typeVersion`, `position`, `parameters`
- Credentials: use placeholder format `{"id": "YOUR_CREDENTIAL_ID", "name": "YOUR_CREDENTIAL_NAME"}`
- Connections: `{ "NodeName": { "main": [[{ "node": "TargetNode", "type": "main", "index": 0 }]] } }`
- AI agent tool connections use `ai_tool` type, memory uses `ai_memory`, model uses `ai_languageModel`

## Client Customization Guide
Create a `docs/customization-guide.md` that explains:
- Which credential placeholders to replace
- How to change the phone number filter
- How to swap Google Tasks for another task system
- How to connect a CRM
- How to change the language/timezone
- How to adjust the system prompt personality

## Validation
- All JSON files must parse cleanly
- All node connections must reference existing nodes
- System prompt must be in pt-PT
- All tool `descriptionType` should be "manual" with clear AI-readable descriptions

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
