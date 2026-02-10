# LLM Setup Guide

This guide explains how to set up and switch between Ollama (local testing) and Google Gemini Flash (production demos) for your AI agents.

## Overview

This project supports two LLM providers:
- **Ollama**: Free, local, runs on your machine - ideal for testing and development
- **Google Gemini Flash**: Free tier available, cloud-based - ideal for demos and production

## Setup Options

### Option 1: Ollama (Local Testing)

Ollama runs locally on your machine, requires no API keys, and is completely free. Perfect for development and testing.

#### Installation

**macOS/Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download installer from [ollama.ai](https://ollama.ai/download)

**Docker (Alternative):**
Uncomment the ollama service in `docker-compose.yml` (see instructions in file)

#### Starting Ollama

```bash
# Start Ollama server
ollama serve

# In another terminal, pull a model
ollama pull llama3.2      # Fast, good for testing (2GB)
# or
ollama pull mistral       # Alternative (4GB)
# or
ollama pull codellama     # Best for code tasks (7GB)
```

#### Configuration

In your `.env` file:
```bash
LLM_PROVIDER=ollama
OLLAMA_HOST=http://host.docker.internal:11434  # For Docker
OLLAMA_MODEL=llama3.2
```

**Note:** If running n8n outside Docker, use:
```bash
OLLAMA_HOST=http://localhost:11434
```

#### Testing Ollama Connection

```bash
# Test directly
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello, world!"
}'
```

### Option 2: Google Gemini Flash (Demos)

Gemini Flash offers a generous free tier with good performance. Perfect for demos and production use.

#### Getting API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy the key

#### Configuration

In your `.env` file:
```bash
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

#### Free Tier Limits

Gemini Flash free tier (as of 2024):
- **Rate limits**: 15 requests per minute
- **Daily limit**: Generous (varies by region)
- **Input tokens**: Up to 1 million per minute
- **Output tokens**: Up to 32K per minute

More than enough for demos and moderate production use.

#### Available Models

```bash
# Fast and efficient (recommended for demos)
GEMINI_MODEL=gemini-1.5-flash

# More capable, slower
GEMINI_MODEL=gemini-1.5-pro

# Latest experimental
GEMINI_MODEL=gemini-2.0-flash-exp
```

## Switching Between Providers

### Quick Switch

Simply change the `LLM_PROVIDER` in your `.env` file:

```bash
# For local testing
LLM_PROVIDER=ollama

# For demos
LLM_PROVIDER=gemini
```

Then restart n8n:
```bash
docker-compose restart n8n
```

### Using Both Simultaneously

You can configure different workflows to use different providers:

1. Keep both configurations in `.env`:
```bash
# Ollama
OLLAMA_HOST=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2

# Gemini
GOOGLE_API_KEY=your_key_here
GEMINI_MODEL=gemini-1.5-flash

# Default (can be overridden per workflow)
LLM_PROVIDER=ollama
```

2. In n8n workflows, use environment variables to select provider:
   - Use `{{$env.OLLAMA_HOST}}` for Ollama workflows
   - Use `{{$env.GOOGLE_API_KEY}}` for Gemini workflows

## n8n Integration

### Ollama in n8n

1. Add an HTTP Request node
2. Configure:
   - **Method**: POST
   - **URL**: `{{$env.OLLAMA_HOST}}/api/generate`
   - **Body**:
   ```json
   {
     "model": "{{$env.OLLAMA_MODEL}}",
     "prompt": "Your prompt here",
     "stream": false
   }
   ```

### Gemini in n8n

1. Install "Google Gemini" node from n8n community nodes
   - Or use HTTP Request node with Gemini API

2. For HTTP Request approach:
   - **Method**: POST
   - **URL**: `https://generativelanguage.googleapis.com/v1/models/{{$env.GEMINI_MODEL}}:generateContent`
   - **Authentication**: Add header `x-goog-api-key: {{$env.GOOGLE_API_KEY}}`
   - **Body**:
   ```json
   {
     "contents": [{
       "parts": [{
         "text": "Your prompt here"
       }]
     }]
   }
   ```

## Performance Comparison

| Feature | Ollama (llama3.2) | Gemini Flash |
|---------|------------------|--------------|
| **Speed** | Fast (local) | Very Fast (cloud) |
| **Cost** | Free | Free tier (generous) |
| **Privacy** | 100% private | Cloud-based |
| **Setup** | Requires installation | API key only |
| **Models** | Many options | Google models only |
| **Best for** | Testing, dev | Demos, production |
| **Offline** | ✅ Works offline | ❌ Requires internet |

## Troubleshooting

### Ollama Issues

**Connection refused:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
pkill ollama && ollama serve
```

**Model not found:**
```bash
# List available models
ollama list

# Pull the model
ollama pull llama3.2
```

**Docker can't connect to host Ollama:**
- Ensure you're using `host.docker.internal` in `OLLAMA_HOST`
- Check firewall settings
- Try running Ollama in Docker instead (uncomment service in docker-compose.yml)

### Gemini Issues

**API key invalid:**
- Verify key in Google AI Studio
- Check for extra spaces in `.env` file
- Ensure key has proper permissions

**Rate limit exceeded:**
- Wait 1 minute and retry
- Consider implementing rate limiting in your workflows
- Upgrade to paid tier if needed

**Model not available:**
- Check current model names at [Google AI Studio](https://ai.google.dev/)
- Try `gemini-1.5-flash` (most stable)

## Best Practices

### Development Workflow

1. **Local Development**: Use Ollama
   - Fast iteration
   - No API costs
   - Privacy for sensitive data

2. **Pre-Demo Testing**: Switch to Gemini
   - Test with actual production model
   - Verify rate limits
   - Check response quality

3. **Production**: Use Gemini
   - Reliable uptime
   - Better performance under load
   - No local resource requirements

### Cost Optimization

- Use Ollama for development and testing
- Switch to Gemini only for demos and production
- Monitor Gemini usage in Google Cloud Console
- Implement caching for repeated queries

### Security

- Never commit `.env` file with real API keys
- Use environment-specific `.env` files (`.env.local`, `.env.production`)
- Rotate API keys regularly
- Monitor API usage for unauthorized access

## Additional Resources

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Ollama Models Library](https://ollama.ai/library)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Nodes](https://www.npmjs.com/search?q=n8n-nodes)
