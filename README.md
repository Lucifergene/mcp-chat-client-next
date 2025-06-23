# 💬 React ChatBot with MCP Support



![image](https://github.com/user-attachments/assets/e4e802ce-693e-4e0e-a35c-61b634137388)



## Overview

A modern, fully working chat interface built with **Next.js** and **Model Context Protocol (MCP)**. Connect to both remote and local MCP servers, use tool-calling (like Cursor/Windsurf), and switch between LLM providers with zero config changes.

> **Note:** This is a demo app to show how to connect to MCP servers in Next.js. Not production-ready.

---

## 🧠 What is MCP?

**Model Context Protocol (MCP)** connects AI models to tools and real-time data sources.

**Example Use Cases:**

- 📧 Send emails
- 🗂️ Create GitHub issues
- 🗓️ Schedule meetings
- 💬 Post to Slack

Read more: [modelcontextprotocol.io](https://modelcontextprotocol.io/introduction)

---

## 🚀 Features

- 🧠 **5 LLM Providers**: OpenAI, Claude, Gemini, Ollama, Custom
- 🏗️ **Provider Adapter Architecture**: No if-statement hell, easy to extend
- 🔄 **Auto API Conversion**: Each provider's API format handled automatically
- 🏠 **Local AI Models**: Run completely offline with Ollama
- 🔗 **MCP Integration**: Support for both local and hosted MCP servers
- 🛠️ **Tool Calling**: Gmail, Linear, Slack, etc. across all providers
- 💅 **Modern UI**: Tailwind CSS + Shadcn UI
- ⚡ **Next.js 15**: App Router, TypeScript
- 🎯 **Zero Config Switch**: Change providers via environment variables

---

## 📦 Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Provider Adapter Pattern**
- **Tailwind CSS** + **shadcn/ui**
- **Model Context Protocol (MCP) SDK**

---

## 🛠️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Lucifergene/mcp-chat-client-next.git
cd mcp-chat-client-next
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Configure your LLM provider

The app supports **6 LLM providers** with automatic API format conversion:

| Provider | Icon | Setup | Cost | Performance |
|----------|------|-------|------|-------------|
| OpenAI   | 🤖   | Easy  | $$$  | ⭐⭐⭐⭐⭐      |
| Claude   | 🧠   | Easy  | $$   | ⭐⭐⭐⭐⭐      |
| Gemini   | 💎   | Easy  | $    | ⭐⭐⭐⭐       |
| Ollama   | 🦙   | Medium| Free | ⭐⭐⭐        |
| Custom   | ⚙️   | Hard  | Varies| Varies    |

#### Quick Setup (Recommended)

```bash
yarn run setup-provider
```

This interactive script will guide you through configuring your preferred LLM provider.

#### Manual Setup

Create a `.env` file in the root and configure your LLM provider:

<details>
<summary>OpenAI (Default)</summary>

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-<your_openai_api_key>
OPENAI_MODEL=gpt-4o-mini
```

</details>

<details>
<summary>Claude (Anthropic)</summary>

```env
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-api03-<your_anthropic_api_key>
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

</details>

<details>
<summary>Google Gemini</summary>

```env
LLM_PROVIDER=gemini
GOOGLE_API_KEY=<your_google_api_key>
GEMINI_MODEL=gemini-2.5-flash
```

</details>

<details>
<summary>Ollama (Local)</summary>

First, make sure Ollama is running locally:

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.1:8b
ollama serve
```

Then configure your `.env`:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.1:8b
```

</details>

<details>
<summary>Custom OpenAI-Compatible Server</summary>

```env
LLM_PROVIDER=custom
CUSTOM_BASE_URL=http://your-server:port/v1
CUSTOM_API_KEY=your-api-key
CUSTOM_MODEL=your-model-name
```

</details>

### 4. Configure MCP Servers (Optional)

The application supports both **STDIO** and **SSE** MCP server connections through a JSON configuration file.

#### Setup MCP Server Configuration

1. **Copy the example configuration:**

   ```bash
   cp mcp-servers.example.json mcp-servers.json
   ```

2. **Edit `mcp-servers.json` with your server details:**

   ```json
   {
     "servers": [
       {
         "name": "local-server-build",
         "scriptPath": "/path/to/your/workspace/local-server/build/index.js",
         "args": ["/path/to/your/workspace"],
         "env": {
           "LOCAL_SERVER_API_KEY": "your-actual-api-key"
         }
       },
       {
         "name": "remote-sse-server",
         "type": "sse",
         "url": "http://localhost:8000/sse"
       },
       {
         "name": "kubernetes-server",
         "npxCommand": "kubernetes-mcp-server@latest"
       }
     ]
   }
   ```

#### Connection Types

**STDIO Connections (Default)**

- Launch MCP servers as child processes
- Communicate via standard input/output streams
- Best for local MCP servers

**SSE Connections**

- Connect to MCP servers running as HTTP services  
- Use Server-Sent Events for real-time communication
- Perfect for remote MCP servers

**NPX Commands**

- Launch servers using npx for easy package management
- Automatically handles dependencies

> **Note:** The `mcp-servers.json` file is gitignored to protect your API keys. Only the example file is tracked in version control.

---

**Expected Output:**

```
🧪 Testing LLM Provider Configurations...
Current provider: CLAUDE
📋 Configuration:
  Provider: claude
  Model: claude-3-5-sonnet-20241022
  Base URL: https://api.anthropic.com/v1
  API Key: ✅ Set
🔗 Testing connection...
✅ Connection successful!
📨 Test response: "Connection test successful"
🎉 All tests passed! Your setup is ready to use.
```

---

### 6. Run the application

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to start chatting!

---

## 🏗️ Architecture

This project uses a **Provider Adapter Pattern** to support multiple LLM providers:

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Chat UI   │──▶│  MCP Client  │──▶│  Provider    │
└─────────────┘    └──────────────┘    │  Factory    │
                                       └─────────────┘
                                               │
                        ┌──────────────────────┼──────────────────────┐
                        ▼                      ▼                      ▼
                ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
                │   OpenAI    │        │   Claude    │        │   Gemini    │
                │  Provider   │        │  Provider   │        │  Provider   │
                └─────────────┘        └─────────────┘        └─────────────┘
```

**Benefits:**

- ✅ Easy to extend: Add new providers by creating one class
- ✅ Consistent interface: All providers implement the same methods
- ✅ Auto API conversion: Each provider handles its own API format

---

## 🛡️ License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
