# Gemini API Integration Guide

Complete guide for integrating Google Gemini API with your n8n AI agents.

## Table of Contents

1. [Gemini API Basics](#gemini-api-basics)
2. [API Authentication](#api-authentication)
3. [Available Models](#available-models)
4. [Request & Response Format](#request--response-format)
5. [n8n Integration Patterns](#n8n-integration-patterns)
6. [Advanced Features](#advanced-features)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Cost Management](#cost-management)

## Gemini API Basics

### What is Gemini?

Gemini is Google's family of multimodal AI models capable of:
- Text generation
- Code generation
- Reasoning and analysis
- Image understanding (Pro models)
- Long context windows (up to 1M tokens)

### API Endpoint

```
https://generativelanguage.googleapis.com/v1/models/{model}:generateContent
```

### Free Tier (2024)

- **Rate limits**: 15 requests per minute (RPM)
- **Input tokens**: 1 million per minute (TPM)
- **Output tokens**: 32,000 per minute (TPM)
- **Cost**: Free for development and small-scale production

## API Authentication

### Method 1: API Key (Recommended for n8n)

**Format:**
```
x-goog-api-key: YOUR_API_KEY
```

**Example curl:**
```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Explain quantum computing in simple terms"
      }]
    }]
  }'
```

### Method 2: OAuth 2.0 (For Production)

For production applications with user authentication:

1. Create OAuth 2.0 credentials in GCP Console
2. Implement OAuth flow
3. Use access token in header: `Authorization: Bearer ACCESS_TOKEN`

**For n8n workflows, API key method is simpler and sufficient.**

## Available Models

### gemini-1.5-flash (Recommended for most use cases)

```bash
Model ID: gemini-1.5-flash
```

**Specs:**
- **Speed**: Very fast
- **Cost**: Free tier available
- **Context**: 1 million tokens
- **Best for**: Chat, Q&A, summarization, simple reasoning

**Use cases:**
- Customer support agents
- Content generation
- Data extraction
- Quick answers

### gemini-1.5-pro

```bash
Model ID: gemini-1.5-pro
```

**Specs:**
- **Speed**: Moderate
- **Cost**: Higher than Flash
- **Context**: 1 million tokens
- **Best for**: Complex reasoning, analysis, coding

**Use cases:**
- Code generation
- Complex analysis
- Multi-step reasoning
- Research tasks

### gemini-2.0-flash-exp (Experimental)

```bash
Model ID: gemini-2.0-flash-exp
```

**Specs:**
- **Speed**: Very fast
- **Cost**: Free during preview
- **Features**: Latest experimental features

**Use cases:**
- Testing new capabilities
- Early access features

### Model Selection Guide

| Task Type | Recommended Model | Reason |
|-----------|------------------|---------|
| Simple Q&A | gemini-1.5-flash | Fast, cost-effective |
| Customer Support | gemini-1.5-flash | Good balance |
| Code Generation | gemini-1.5-pro | Better accuracy |
| Complex Reasoning | gemini-1.5-pro | Advanced capabilities |
| High Volume | gemini-1.5-flash | Rate limits |
| Experimentation | gemini-2.0-flash-exp | New features |

## Request & Response Format

### Basic Request Structure

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Your prompt here"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "topK": 40,
    "topP": 0.95,
    "maxOutputTokens": 1024,
    "stopSequences": []
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}
```

### Response Structure

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Generated response here"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0,
      "safetyRatings": [...]
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 50,
    "totalTokenCount": 60
  }
}
```

### Extracting the Response Text

The actual response text is nested:
```
response.candidates[0].content.parts[0].text
```

## n8n Integration Patterns

### Pattern 1: Basic Text Generation

**HTTP Request Node Configuration:**

```json
{
  "method": "POST",
  "url": "https://generativelanguage.googleapis.com/v1/models/{{$env.GEMINI_MODEL}}:generateContent",
  "authentication": "none",
  "options": {
    "headers": {
      "x-goog-api-key": "={{$env.GOOGLE_API_KEY}}"
    }
  },
  "bodyParametersJson": {
    "contents": [
      {
        "parts": [
          {
            "text": "={{$json.userPrompt}}"
          }
        ]
      }
    ]
  }
}
```

**Extract Response (Code Node):**

```javascript
// items is provided by n8n
for (const item of items) {
  const response = item.json;

  // Extract generated text
  const generatedText = response.candidates[0].content.parts[0].text;

  // Add to output
  item.json.aiResponse = generatedText;
  item.json.tokenCount = response.usageMetadata.totalTokenCount;
}

return items;
```

### Pattern 2: Conversation / Chat

**System Prompt + User Message:**

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "You are a helpful customer support agent. Be friendly and concise."
        }
      ]
    },
    {
      "role": "model",
      "parts": [
        {
          "text": "Understood. I'll be a helpful and concise customer support agent."
        }
      ]
    },
    {
      "role": "user",
      "parts": [
        {
          "text": "={{$json.customerMessage}}"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 500
  }
}
```

### Pattern 3: JSON Output

**Request with JSON formatting:**

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Extract the following information from this text and return ONLY valid JSON with keys: customerName, orderNumber, issueType, urgency.\n\nText: {{$json.supportTicket}}"
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.1,
    "maxOutputTokens": 200
  }
}
```

**Parse JSON Response:**

```javascript
for (const item of items) {
  const responseText = item.json.candidates[0].content.parts[0].text;

  // Remove markdown code blocks if present
  const cleanJson = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    item.json.extractedData = JSON.parse(cleanJson);
  } catch (error) {
    item.json.extractedData = null;
    item.json.parseError = error.message;
  }
}

return items;
```

### Pattern 4: Multi-turn Conversation with Memory

**n8n Workflow:**

1. **Trigger**: Webhook
2. **Get Conversation History**: Query database/Redis for past messages
3. **Build Context**: Format previous messages
4. **Call Gemini**: Include full conversation
5. **Save Response**: Store to database/Redis
6. **Return**: Send to user

**Build Context (Code Node):**

```javascript
// Get conversation history from previous node
const history = items[0].json.conversationHistory || [];
const userMessage = items[0].json.newMessage;
const sessionId = items[0].json.sessionId;

// Build contents array
const contents = [];

// Add system prompt
contents.push({
  role: "user",
  parts: [{ text: "You are a helpful assistant. Keep responses concise." }]
});
contents.push({
  role: "model",
  parts: [{ text: "I understand. I'll be helpful and concise." }]
});

// Add conversation history
for (const msg of history) {
  contents.push({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  });
}

// Add new user message
contents.push({
  role: "user",
  parts: [{ text: userMessage }]
});

// Limit to last 10 exchanges (20 messages) to stay within context
const maxMessages = 20;
if (contents.length > maxMessages + 2) { // +2 for system prompt
  contents.splice(2, contents.length - maxMessages - 2);
}

return [{
  json: {
    sessionId,
    contents,
    newMessage: userMessage
  }
}];
```

### Pattern 5: Streaming Responses

Gemini supports streaming for real-time responses:

```bash
# Endpoint for streaming
https://generativelanguage.googleapis.com/v1/models/{model}:streamGenerateContent?key=YOUR_API_KEY
```

**Note**: n8n HTTP Request node doesn't natively support streaming. For streaming:
1. Use a custom webhook endpoint
2. Use Code node with `axios` to handle streaming
3. Or use Function node with streaming logic

## Advanced Features

### 1. Temperature Control

Controls randomness:
- `0.0`: Deterministic, same output
- `0.3-0.5`: Focused, factual
- `0.7-0.9`: Creative, varied
- `1.0+`: Very random

**Example:**
```json
{
  "generationConfig": {
    "temperature": 0.3  // For factual accuracy
  }
}
```

### 2. Token Limits

Control output length:

```json
{
  "generationConfig": {
    "maxOutputTokens": 500  // Limit response length
  }
}
```

**Rough estimates:**
- 1 token ≈ 4 characters
- 1 token ≈ 0.75 words
- 100 tokens ≈ 75 words

### 3. Safety Settings

Control content filtering:

```json
{
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ]
}
```

**Thresholds:**
- `BLOCK_NONE`: No blocking
- `BLOCK_LOW_AND_ABOVE`: Block low-risk and above
- `BLOCK_MEDIUM_AND_ABOVE`: Block medium-risk and above (default)
- `BLOCK_HIGH`: Only block high-risk

### 4. Stop Sequences

Stop generation at specific tokens:

```json
{
  "generationConfig": {
    "stopSequences": ["\n\n", "END", "---"]
  }
}
```

## Error Handling

### Common Errors

**1. Rate Limit Exceeded (429)**

```json
{
  "error": {
    "code": 429,
    "message": "Resource has been exhausted (e.g. check quota)."
  }
}
```

**Solution in n8n:**
- Add "Wait" node before retrying
- Implement exponential backoff
- Check quota in GCP Console

**2. Invalid API Key (401)**

```json
{
  "error": {
    "code": 401,
    "message": "API key not valid."
  }
}
```

**Solution:**
- Verify `GOOGLE_API_KEY` in `.env`
- Check API is enabled in GCP
- Regenerate key if needed

**3. Content Filtered (400)**

```json
{
  "error": {
    "code": 400,
    "message": "The response was blocked due to safety reasons."
  }
}
```

**Solution:**
- Adjust safety settings
- Rephrase prompt
- Add content moderation before Gemini

### n8n Error Handling Pattern

**Add Error Trigger:**

1. Add "Error Trigger" node
2. Connect to workflow that might fail
3. Handle errors gracefully

**Code Node Error Handler:**

```javascript
for (const item of items) {
  try {
    const response = item.json;

    // Check for API error
    if (response.error) {
      item.json.success = false;
      item.json.errorCode = response.error.code;
      item.json.errorMessage = response.error.message;
      item.json.aiResponse = "I'm having trouble processing that right now. Please try again.";
      continue;
    }

    // Check for safety blocking
    const candidate = response.candidates[0];
    if (candidate.finishReason === 'SAFETY') {
      item.json.success = false;
      item.json.errorMessage = "Content was filtered for safety";
      item.json.aiResponse = "I cannot respond to that request.";
      continue;
    }

    // Success
    item.json.success = true;
    item.json.aiResponse = candidate.content.parts[0].text;

  } catch (error) {
    item.json.success = false;
    item.json.errorMessage = error.message;
    item.json.aiResponse = "An unexpected error occurred.";
  }
}

return items;
```

## Best Practices

### 1. Prompt Engineering

**Be Specific:**
```
❌ "Write about dogs"
✅ "Write a 3-paragraph blog post about Golden Retriever care for new owners"
```

**Provide Context:**
```json
{
  "text": "You are a customer support agent for TechCorp, a software company. Be professional and helpful.\n\nCustomer question: {{$json.question}}"
}
```

**Use Examples (Few-shot):**
```
Convert customer feedback to JSON.

Example 1:
Input: "Great product but shipping was slow"
Output: {"sentiment": "mixed", "product": "positive", "shipping": "negative"}

Example 2:
Input: "Love it! Fast delivery too"
Output: {"sentiment": "positive", "product": "positive", "shipping": "positive"}

Now convert this:
Input: "{{$json.feedback}}"
Output:
```

### 2. Caching Responses

Cache frequent queries to save quota:

**n8n Pattern:**
1. Check Redis/Database for cached response
2. If found, return cached
3. If not, call Gemini
4. Cache the response

```javascript
// Check cache (Code Node)
const cacheKey = `gemini:${$json.prompt}`;
const cached = await $redis.get(cacheKey);

if (cached) {
  return [{
    json: {
      response: cached,
      fromCache: true
    }
  }];
}

// If not cached, proceed to Gemini call
// After Gemini call, cache it (Code Node after HTTP Request)
const response = $json.candidates[0].content.parts[0].text;
await $redis.set(cacheKey, response, 'EX', 3600); // Cache for 1 hour
```

### 3. Monitoring Usage

Track token usage:

```javascript
// After Gemini call
const usage = item.json.usageMetadata;

// Log to database for tracking
item.json.logEntry = {
  timestamp: new Date(),
  model: process.env.GEMINI_MODEL,
  promptTokens: usage.promptTokenCount,
  responseTokens: usage.candidatesTokenCount,
  totalTokens: usage.totalTokenCount,
  cost: calculateCost(usage.totalTokenCount) // If paid tier
};
```

### 4. Fallback Handling

Have a fallback for API failures:

```javascript
if (!item.json.success) {
  // Fallback to:
  // 1. Cached response
  // 2. Default response
  // 3. Ollama (local)
  // 4. Error message

  item.json.aiResponse = "I'm unable to process your request right now. Please try again later or contact support.";
}
```

### 5. Rate Limiting

Implement your own rate limiting:

**Pattern:**
1. Track requests in Redis
2. Check before calling API
3. Queue if limit reached

```javascript
// Check rate limit (Code Node)
const rateLimitKey = 'gemini:rate:minute';
const requestCount = await $redis.incr(rateLimitKey);

if (requestCount === 1) {
  await $redis.expire(rateLimitKey, 60); // 60 seconds
}

if (requestCount > 14) { // Keep under 15 RPM
  // Queue for later or return error
  throw new Error('Rate limit: Please wait a moment');
}

// Proceed to API call
```

## Cost Management

### Free Tier Strategy

**Stay within limits:**
- Max 15 requests per minute
- Monitor daily usage
- Use caching aggressively
- Implement request deduplication

### When to Upgrade

Consider paid tier when:
- Consistently hitting rate limits
- Need higher throughput
- Production application scales
- Need SLA guarantees

### Cost Optimization Tips

1. **Use Flash over Pro** for simple tasks (faster, cheaper)
2. **Limit max tokens** to only what's needed
3. **Cache responses** for repeated queries
4. **Batch requests** when possible
5. **Use Ollama** for development/testing
6. **Monitor quota** in GCP Console regularly

### Cost Tracking

Enable billing export:
1. GCP Console > Billing > Billing export
2. Export to BigQuery
3. Create dashboard for Gemini API usage
4. Set budget alerts

## Example n8n Workflows

### Customer Support Agent

```
[Webhook]
  → [Get History from DB]
  → [Build Context (Code)]
  → [Call Gemini (HTTP Request)]
  → [Parse Response (Code)]
  → [Save to DB]
  → [Return to User (Webhook Response)]
```

### Content Moderation

```
[Webhook with User Content]
  → [Call Gemini for Analysis]
  → [Parse JSON Response]
  → [IF Node: is_safe?]
    → YES: [Approve Content]
    → NO: [Flag for Review]
```

### Data Extraction

```
[Receive Document]
  → [Extract Text]
  → [Call Gemini with Extraction Prompt]
  → [Parse JSON Response]
  → [Validate Data]
  → [Save to Database]
```

## Additional Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [API Pricing](https://ai.google.dev/pricing)
- [Prompt Engineering Guide](https://ai.google.dev/docs/prompt_best_practices)
- [n8n Documentation](https://docs.n8n.io/)
- [Google Cloud Console](https://console.cloud.google.com)

## Support & Troubleshooting

For Gemini-specific issues:
1. Check [API Status](https://status.cloud.google.com/)
2. Review [Quota Limits](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
3. Check [GCP Support](https://cloud.google.com/support)
4. See [Troubleshooting Guide](./troubleshooting.md)
