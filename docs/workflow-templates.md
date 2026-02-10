# n8n Workflow Templates for AI Agents

Ready-to-use workflow templates for common AI agent patterns with Gemini integration.

## Table of Contents

1. [Simple Chat Bot](#1-simple-chat-bot)
2. [Customer Support Agent](#2-customer-support-agent)
3. [Content Moderator](#3-content-moderator)
4. [Email Classifier](#4-email-classifier)
5. [Data Extractor](#5-data-extractor)
6. [Sentiment Analyzer](#6-sentiment-analyzer)
7. [Code Review Assistant](#7-code-review-assistant)
8. [Multi-language Translator](#8-multi-language-translator)

---

## 1. Simple Chat Bot

**Use case:** Basic question-answering bot

**Workflow:**
```
[Webhook: POST /chat]
  → [Call Gemini]
  → [Format Response]
  → [Webhook Response]
```

### Node Configurations

**Webhook Node:**
```json
{
  "httpMethod": "POST",
  "path": "chat",
  "responseMode": "responseNode"
}
```

**Call Gemini (HTTP Request):**
```json
{
  "method": "POST",
  "url": "https://generativelanguage.googleapis.com/v1/models/{{$env.GEMINI_MODEL}}:generateContent",
  "authentication": "none",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "x-goog-api-key",
        "value": "={{$env.GOOGLE_API_KEY}}"
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "contents",
        "value": "=[{\"parts\":[{\"text\":\"{{$json.body.message}}\"}]}]"
      }
    ]
  }
}
```

**Format Response (Code Node):**
```javascript
const response = items[0].json.candidates[0].content.parts[0].text;

return [{
  json: {
    reply: response,
    timestamp: new Date().toISOString()
  }
}];
```

**Test Request:**
```bash
curl -X POST http://YOUR_IP:5678/webhook/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "What is artificial intelligence?"}'
```

---

## 2. Customer Support Agent

**Use case:** AI-powered customer support with conversation memory

**Workflow:**
```
[Webhook: POST /support]
  → [Get Conversation History]
  → [Build Context]
  → [Call Gemini]
  → [Parse Response]
  → [Save Conversation]
  → [Return Response]
```

### Node Configurations

**Get Conversation History (PostgreSQL):**
```sql
SELECT role, message, created_at
FROM conversations
WHERE session_id = '{{$json.body.sessionId}}'
ORDER BY created_at DESC
LIMIT 10;
```

**Build Context (Code Node):**
```javascript
const sessionId = items[0].json.body.sessionId;
const userMessage = items[0].json.body.message;
const history = items[1].json || []; // From PostgreSQL query

// System prompt
const systemPrompt = {
  role: "user",
  parts: [{
    text: "You are a customer support agent for TechCorp. Be helpful, professional, and concise. If you don't know something, say so and offer to escalate to a human agent."
  }]
};

const systemAck = {
  role: "model",
  parts: [{
    text: "I understand. I'll provide helpful and professional customer support."
  }]
};

// Build conversation history
const contents = [systemPrompt, systemAck];

// Add history (reverse order to get chronological)
for (let i = history.length - 1; i >= 0; i--) {
  const msg = history[i];
  contents.push({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.message }]
  });
}

// Add new user message
contents.push({
  role: "user",
  parts: [{ text: userMessage }]
});

return [{
  json: {
    sessionId,
    userMessage,
    contents,
    requestBody: {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    }
  }
}];
```

**Call Gemini (HTTP Request):**
```json
{
  "method": "POST",
  "url": "https://generativelanguage.googleapis.com/v1/models/{{$env.GEMINI_MODEL}}:generateContent",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "x-goog-api-key",
        "value": "={{$env.GOOGLE_API_KEY}}"
      }
    ]
  },
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={{$json.requestBody}}"
}
```

**Parse Response (Code Node):**
```javascript
const aiResponse = items[0].json.candidates[0].content.parts[0].text;
const sessionId = items[0].json.sessionId;
const userMessage = items[0].json.userMessage;
const tokenCount = items[0].json.usageMetadata.totalTokenCount;

return [{
  json: {
    sessionId,
    userMessage,
    aiResponse,
    tokenCount,
    timestamp: new Date().toISOString()
  }
}];
```

**Save Conversation (PostgreSQL - 2 queries):**

*Query 1 - Save user message:*
```sql
INSERT INTO conversations (session_id, role, message, created_at)
VALUES ('{{$json.sessionId}}', 'user', '{{$json.userMessage}}', NOW());
```

*Query 2 - Save AI response:*
```sql
INSERT INTO conversations (session_id, role, message, created_at)
VALUES ('{{$json.sessionId}}', 'assistant', '{{$json.aiResponse}}', NOW());
```

---

## 3. Content Moderator

**Use case:** Automatically moderate user-generated content

**Workflow:**
```
[Webhook: POST /moderate]
  → [Call Gemini for Analysis]
  → [Parse JSON Response]
  → [IF: Is Safe?]
    ├─ YES → [Approve Content]
    └─ NO → [Flag for Review]
  → [Return Result]
```

### Call Gemini for Analysis (HTTP Request)

**Prompt (in body):**
```javascript
{
  "contents": [{
    "parts": [{
      "text": `Analyze this content for moderation. Return ONLY valid JSON with these fields:
- is_safe (boolean): true if content is acceptable
- risk_level (string): "low", "medium", or "high"
- categories (array): any concerning categories like ["spam", "harassment", "adult_content"]
- explanation (string): brief reason for decision

Content to analyze:
"""
{{$json.body.content}}
"""

Return ONLY the JSON, no other text.`
    }]
  }],
  "generationConfig": {
    "temperature": 0.1,
    "maxOutputTokens": 200
  }
}
```

### Parse JSON Response (Code Node)

```javascript
const responseText = items[0].json.candidates[0].content.parts[0].text;

// Clean up response (remove markdown if present)
const cleanJson = responseText
  .replace(/```json\n?/g, '')
  .replace(/```\n?/g, '')
  .trim();

let analysis;
try {
  analysis = JSON.parse(cleanJson);
} catch (error) {
  // Fallback: flag for manual review
  analysis = {
    is_safe: false,
    risk_level: "high",
    categories: ["parse_error"],
    explanation: "Could not parse AI response"
  };
}

return [{
  json: {
    originalContent: items[0].json.body.content,
    moderation: analysis,
    timestamp: new Date().toISOString()
  }
}];
```

### IF Node Configuration

**Condition:**
```
{{$json.moderation.is_safe}} === true
```

---

## 4. Email Classifier

**Use case:** Classify incoming emails by type and urgency

**Workflow:**
```
[Email Trigger / Webhook]
  → [Extract Email Data]
  → [Call Gemini]
  → [Parse Classification]
  → [Route by Type]
    ├─ Support → [Create Support Ticket]
    ├─ Sales → [Add to CRM]
    └─ General → [Send to Inbox]
```

### Call Gemini (HTTP Request Body)

```javascript
{
  "contents": [{
    "parts": [{
      "text": `Classify this email. Return ONLY valid JSON:
{
  "type": "support|sales|billing|general|spam",
  "urgency": "low|medium|high|critical",
  "sentiment": "positive|neutral|negative",
  "key_topics": ["topic1", "topic2"],
  "requires_human": boolean,
  "suggested_response_time": "immediate|same_day|within_week"
}

Email:
From: {{$json.from}}
Subject: {{$json.subject}}
Body:
{{$json.body}}

Return ONLY the JSON.`
    }]
  }],
  "generationConfig": {
    "temperature": 0.2,
    "maxOutputTokens": 300
  }
}
```

### Switch Node (Route by Type)

**Mode:** "Rules"

**Rules:**
1. `{{$json.classification.type}} === "support"` → Route 0
2. `{{$json.classification.type}} === "sales"` → Route 1
3. `{{$json.classification.type}} === "billing"` → Route 2
4. Default → Route 3

---

## 5. Data Extractor

**Use case:** Extract structured data from unstructured text

**Workflow:**
```
[Webhook: POST /extract]
  → [Call Gemini]
  → [Parse Structured Data]
  → [Validate]
  → [Save to Database]
  → [Return Extracted Data]
```

### Example: Invoice Data Extraction

**Gemini Prompt:**
```javascript
{
  "contents": [{
    "parts": [{
      "text": `Extract invoice information from this text. Return ONLY valid JSON:
{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "vendor_name": "string or null",
  "total_amount": number or null,
  "currency": "string or null",
  "line_items": [
    {
      "description": "string",
      "quantity": number,
      "unit_price": number,
      "total": number
    }
  ]
}

Text:
"""
{{$json.body.invoiceText}}
"""

Return ONLY the JSON.`
    }]
  }],
  "generationConfig": {
    "temperature": 0.1,
    "maxOutputTokens": 1000
  }
}
```

### Validate Data (Code Node)

```javascript
const responseText = items[0].json.candidates[0].content.parts[0].text;
const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

let extracted;
try {
  extracted = JSON.parse(cleanJson);
} catch (error) {
  return [{
    json: {
      success: false,
      error: "Failed to parse extracted data",
      rawResponse: responseText
    }
  }];
}

// Validation
const required = ['invoice_number', 'total_amount'];
const missing = required.filter(field => !extracted[field]);

if (missing.length > 0) {
  return [{
    json: {
      success: false,
      error: `Missing required fields: ${missing.join(', ')}`,
      extracted,
      needsReview: true
    }
  }];
}

return [{
  json: {
    success: true,
    extracted,
    validatedAt: new Date().toISOString()
  }
}];
```

---

## 6. Sentiment Analyzer

**Use case:** Analyze sentiment of customer feedback

**Workflow:**
```
[Trigger: New Feedback]
  → [Call Gemini]
  → [Parse Sentiment]
  → [Update Dashboard]
  → [IF Negative]
    └─ [Alert Team]
```

### Gemini Prompt

```javascript
{
  "contents": [{
    "parts": [{
      "text": `Analyze the sentiment and key points of this customer feedback. Return ONLY valid JSON:
{
  "overall_sentiment": "very_positive|positive|neutral|negative|very_negative",
  "sentiment_score": number between -1 and 1,
  "key_points": {
    "positive": ["point1", "point2"],
    "negative": ["point1", "point2"],
    "neutral": ["point1", "point2"]
  },
  "topics": ["topic1", "topic2"],
  "action_items": ["action1", "action2"],
  "priority": "low|medium|high"
}

Feedback:
"""
{{$json.feedback}}
"""

Return ONLY the JSON.`
    }]
  }],
  "generationConfig": {
    "temperature": 0.3
  }
}
```

---

## 7. Code Review Assistant

**Use case:** Automated code review suggestions

**Workflow:**
```
[Webhook: POST /review-code]
  → [Call Gemini]
  → [Parse Review]
  → [Format for GitHub/GitLab]
  → [Post Comment]
```

### Gemini Prompt

```javascript
{
  "contents": [{
    "parts": [{
      "text": `Review this code change. Return ONLY valid JSON:
{
  "overall_quality": "excellent|good|fair|poor",
  "issues": [
    {
      "severity": "critical|major|minor|suggestion",
      "line": number or null,
      "issue": "description",
      "suggestion": "how to fix"
    }
  ],
  "strengths": ["strength1", "strength2"],
  "security_concerns": ["concern1"] or [],
  "performance_concerns": ["concern1"] or [],
  "approve": boolean
}

Language: {{$json.language}}
File: {{$json.filename}}

Code:
\`\`\`
{{$json.code}}
\`\`\`

Return ONLY the JSON.`
    }]
  }],
  "generationConfig": {
    "temperature": 0.2,
    "maxOutputTokens": 1500
  }
}
```

---

## 8. Multi-language Translator

**Use case:** Translate content with context awareness

**Workflow:**
```
[Webhook: POST /translate]
  → [Detect Language]
  → [Call Gemini for Translation]
  → [Quality Check]
  → [Return Translation]
```

### Gemini Prompt

```javascript
{
  "contents": [{
    "parts": [{
      "text": `Translate this text from {{$json.sourceLanguage || 'auto-detect'}} to {{$json.targetLanguage}}.
Maintain tone, style, and context. For technical terms, provide the translation with the original term in parentheses if needed.

Return ONLY valid JSON:
{
  "detected_language": "language code",
  "translated_text": "translation here",
  "confidence": number between 0 and 1,
  "notes": "any important translation notes"
}

Text to translate:
"""
{{$json.text}}
"""

Return ONLY the JSON.`
    }]
  }],
  "generationConfig": {
    "temperature": 0.3
  }
}
```

---

## Workflow Template: Error Handling Pattern

**Add to any workflow for robust error handling:**

### Error Trigger Node

Connect to any node that might fail:

**Settings:**
- Trigger on: Error

**Error Handler (Code Node):**
```javascript
const error = $input.item.json;

// Log error
console.error('Workflow error:', error);

// Determine error type
let errorType = 'unknown';
let userMessage = 'An unexpected error occurred';

if (error.message?.includes('429')) {
  errorType = 'rate_limit';
  userMessage = 'Too many requests. Please try again in a moment.';
} else if (error.message?.includes('401') || error.message?.includes('403')) {
  errorType = 'authentication';
  userMessage = 'Authentication error. Please contact support.';
} else if (error.message?.includes('timeout')) {
  errorType = 'timeout';
  userMessage = 'Request timed out. Please try again.';
}

// Return to user or retry
return [{
  json: {
    success: false,
    error: errorType,
    message: userMessage,
    timestamp: new Date().toISOString(),
    // Include original request for retry
    originalRequest: error.context?.originalRequest
  }
}];
```

---

## Workflow Template: Rate Limiting

**Prevent hitting API limits:**

### Check Rate Limit (Code Node)

```javascript
// Using in-memory counter (or connect to Redis for persistence)
const rateLimitKey = `gemini:rate:${new Date().getMinutes()}`;
global.rateLimits = global.rateLimits || {};

const currentMinute = new Date().getMinutes();
if (!global.rateLimits[currentMinute]) {
  global.rateLimits[currentMinute] = 0;
  // Clean up old minutes
  Object.keys(global.rateLimits).forEach(key => {
    if (key != currentMinute) delete global.rateLimits[key];
  });
}

global.rateLimits[currentMinute]++;

if (global.rateLimits[currentMinute] > 14) {
  throw new Error('Rate limit: Maximum 15 requests per minute. Please wait.');
}

return items;
```

---

## Best Practices for All Workflows

### 1. Always Include

- Error handling
- Rate limiting checks
- Input validation
- Response validation
- Logging/monitoring

### 2. Security

- Never expose API keys in responses
- Validate all user inputs
- Sanitize data before processing
- Use environment variables

### 3. Performance

- Cache frequent requests
- Limit token usage
- Use appropriate temperature settings
- Batch requests when possible

### 4. Monitoring

- Log token usage
- Track response times
- Monitor error rates
- Set up alerts for failures

### 5. Testing

- Test with various inputs
- Test error scenarios
- Test rate limits
- Test with production-like data

---

## Quick Start

To use these templates:

1. **Copy the workflow structure** into n8n
2. **Configure environment variables** in `.env`
3. **Update prompts** for your specific use case
4. **Test with sample data**
5. **Add error handling**
6. **Monitor and iterate**

---

## Additional Resources

- [Gemini Integration Guide](./gemini-integration-guide.md)
- [n8n Documentation](https://docs.n8n.io/)
- [Prompt Engineering Best Practices](https://ai.google.dev/docs/prompt_best_practices)

---

## Contributing

Found a useful pattern? Add it to this document!

Template format:
1. Use case
2. Workflow diagram
3. Node configurations
4. Code snippets
5. Test examples
