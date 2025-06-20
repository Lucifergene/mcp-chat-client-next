# LLM Provider Quick Switch Guide

This guide shows you how to quickly switch between different LLM providers using the new provider adapter architecture.

## 🚀 Quick Commands

```bash
# Build and run
yarn build
yarn dev
```

## 📝 Environment Variables Reference

### 🤖 OpenAI

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o, gpt-3.5-turbo, etc.
```

### 🧠 Claude (Anthropic)

```bash
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### 💎 Google Gemini

```bash
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your-google-api-key-here
GEMINI_MODEL=gemini-1.5-pro  # or gemini-1.5-flash
```

### 🦙 Ollama (Local)

```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.2  # or mistral, codellama, etc.
```

### ⚙️ Custom Server

```bash
LLM_PROVIDER=custom
CUSTOM_BASE_URL=http://your-server:port/v1
CUSTOM_API_KEY=your-api-key
CUSTOM_MODEL=your-model-name
```

## 🎯 Popular Models by Provider

### OpenAI Models

- [TESTED] `gpt-4o-mini` - Faster, cheaper GPT-4 (recommended)
- `gpt-4o` - Latest GPT-4 Omni (most capable)

### Gemini Models

- [TESTED] `gemini-2.5-flash` - Faster and cheaper
- `gemini-1.5-pro` - Most capable (recommended)
- `gemini-1.0-pro` - Previous generation

### Claude Models

- `claude-3-5-sonnet-20241022` - Best balance (recommended)
- `claude-3-5-haiku-20241022` - Fastest and cheapest
- `claude-3-opus-20240229` - Most capable for complex tasks

### Ollama Models

- `llama3.2` - Meta's latest Llama (recommended)
- `mistral` - Mistral 7B
- `codellama` - Code-specialized
- `phi3` - Microsoft's compact model
- `gemma2` - Google's Gemma

To install an Ollama model:

```bash
ollama pull <model-name>
```

### Custom Servers

- Any OpenAI-compatible API server
- Local servers like vLLM, Text Generation WebUI
- Cloud providers with OpenAI-compatible endpoints

## 🛠️ Quick Setup Examples

### Manual Provider Switch

Just change the `LLM_PROVIDER` variable and restart:

```bash
# Switch to Claude
echo "LLM_PROVIDER=claude" > .env.local
echo "ANTHROPIC_API_KEY=your-key" >> .env.local

# Test the connection
yarn run test-provider

# Start the app
yarn run dev
```

## 🔧 Troubleshooting

### 🤖 OpenAI Issues

- Verify API key is valid and active
- Check account has sufficient credits
- Ensure model name is correct (case-sensitive)

### 🧠 Claude Issues

- Check API key format: `sk-ant-api03-...`
- Verify model name matches exactly
- Check rate limits on your account

### 💎 Gemini Issues

- Ensure Google API key is valid
- Check if Generative AI API is enabled
- Verify model availability in your region

### 🦙 Ollama Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/version

# Start Ollama service
ollama serve

# List installed models
ollama list

# Pull a specific model
ollama pull llama3.2

# Check model is loaded
ollama show llama3.2
```

### ⚙️ Custom Server Issues

- Check server is accessible
- Verify endpoint URL format includes `/v1`
- Test with curl or similar tool
- Ensure API key format matches server expectations

## 🎨 Runtime Provider Detection

The application automatically detects your current provider and displays it in the chat interface:

- 🤖 **OpenAI** - Blue indicator
- 🧠 **Claude** - Purple indicator  
- 💎 **Gemini** - Green indicator
- 🦙 **Ollama** - Yellow indicator
- ⚙️ **Custom** - Gray indicator

## ⚡ Performance Comparison

| Provider | Speed | Cost | Privacy | Offline | Tool Support |
|----------|-------|------|---------|---------|--------------|
| OpenAI | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ |
| Claude | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ❌ | ⭐⭐⭐⭐⭐ |
| Gemini | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ❌ | ⭐⭐⭐⭐ |
| Ollama | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐ |
| Custom | ⭐⭐⭐ | Varies | Varies | Varies | ⭐⭐⭐ |

## 🔄 Adding New Providers

The new architecture makes adding providers trivial:

1. **Create Provider Class** (`lib/providers/newprovider-provider.ts`)
2. **Add to Factory** (`lib/providers/provider-factory.ts`)
3. **Add Environment Variables** (`.env.example`)

No need to modify any existing code! 🎉
