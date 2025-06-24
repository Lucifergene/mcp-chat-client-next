# MCP Chat Client Next

A modern, extensible chat interface built with **Next.js** and **Model Context Protocol (MCP)** for seamless AI tool integration.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![MCP](https://img.shields.io/badge/MCP-1.11.0-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Table of Contents

- [About](#about)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## About

MCP Chat Client Next is a demonstration application showcasing how to integrate the Model Context Protocol (MCP) with modern web technologies. It provides a unified interface for multiple LLM providers while enabling powerful tool-calling capabilities through MCP servers.

## Video Demonstration

Watch the video demonstration of MCP Chat Client Next in action:

https://github.com/user-attachments/assets/84390f7b-710e-432e-9738-ae831e489c4b

### What is MCP?

**Model Context Protocol (MCP)** connects AI models to external tools and real-time data sources, enabling capabilities like:

- 📧 Email management
- 🗂️ GitHub integration
- 🗓️ Calendar scheduling
- 💬 Slack messaging
- � Custom tool development

Learn more at [modelcontextprotocol.io](https://modelcontextprotocol.io/introduction)

> **⚠️ Important:** This is a demonstration application and is not intended for production use without additional security and error handling implementations.

## Features

### Core Capabilities

- 🧠 **Multi-Provider Support**: OpenAI, Claude, Gemini, Ollama, and custom providers
- 🏗️ **Provider Adapter Architecture**: Extensible design pattern for easy provider addition
- 🔄 **Automatic API Conversion**: Seamless handling of different provider API formats
- 🏠 **Local AI Support**: Complete offline functionality with Ollama
- 🔗 **MCP Integration**: Support for STDIO, SSE, and Streamable HTTP connections
- 🛠️ **Tool Calling**: Cross-provider tool execution capabilities

### Technical Features

- ⚡ **Next.js 15**: Latest App Router with TypeScript support
- 💅 **Modern UI**: Tailwind CSS with shadcn/ui components
- 🎯 **Zero-Config Switching**: Environment variable-based provider selection
- 🔒 **Type Safety**: Full TypeScript implementation
- 📱 **Responsive Design**: Mobile-friendly interface

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- **Git** for version control

### Optional Prerequisites

- **Ollama** (for local AI model support)
- **MCP Server** implementations (for tool calling)

## Installation

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/Lucifergene/mcp-chat-client-next.git
   cd mcp-chat-client-next
   ```

2. **Install dependencies**

   ```bash
   # Using yarn (recommended)
   yarn install
   
   # Or using npm
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration (see [Configuration](#configuration))

4. **Start the development server**

   ```bash
   yarn dev
   # or
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3001](http://localhost:3001)

## Configuration

### Environment Variables

Create a `.env.local` file in the project root with your preferred configuration:

#### Provider Selection

```env
# Choose your LLM provider
LLM_PROVIDER=openai  # Options: openai, claude, gemini, ollama, custom
```

#### OpenAI Configuration

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

#### Claude Configuration

```env
LLM_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

#### Google Gemini Configuration

```env
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your-google-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp
```

#### Ollama Configuration (Local)

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3.1:8b
```

#### Custom Provider Configuration

```env
LLM_PROVIDER=custom
CUSTOM_BASE_URL=https://your-custom-endpoint.com/v1
CUSTOM_API_KEY=your-custom-api-key
CUSTOM_MODEL=your-model-name
```

### MCP Server Configuration

Configure MCP servers by copying and editing the configuration file:

```bash
cp mcp-servers.example.json mcp-servers.json
```

Example `mcp-servers.json`:

```json
{
  "servers": [
    {
      "name": "local-stdio-server",
      "scriptPath": "/path/to/your/mcp-server/index.js",
      "args": ["/path/to/workspace"],
      "env": {
        "API_KEY": "your-server-api-key"
      }
    },
    {
      "name": "remote-sse-server",
      "type": "sse",
      "url": "http://localhost:8000/sse",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    },
    {
      "name": "http-streamable-server",
      "url": "http://localhost:8000/mcp",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  ]
}
```

### Ollama Setup (Optional)

For local AI models, install and configure Ollama:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.1:8b

# Start Ollama server
ollama serve
```

## Usage

### Basic Chat

1. Start the application and navigate to [http://localhost:3001](http://localhost:3001)
2. Select your configured LLM provider from the interface
3. Begin chatting with the AI assistant

### Tool Calling with MCP

1. Ensure MCP servers are configured in `mcp-servers.json`
2. MCP tools will be automatically available in chat
3. Use natural language to invoke tools (e.g., "Create a GitHub issue for this bug")

### Provider Switching

Switch between providers by updating the `LLM_PROVIDER` environment variable and restarting the application.

## Architecture

### Provider Adapter Pattern

The application uses a clean adapter pattern for provider management:

```text
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Chat UI   │────│  API Routes  │────│ Provider Factory │
└─────────────┘    └──────────────┘    └─────────────────┘
                           │                      │
                   ┌───────────────┐              │
                   │  MCP Client   │              │
                   └───────────────┘              │
                                                  │
        ┌─────────────────────────────────────────┼─────────────────────┐
        │                     │                   │                     │
┌───────▼───────┐    ┌────────▼────────┐   ┌─────▼──────┐    ┌────────▼────────┐
│ OpenAI        │    │ Claude          │   │ Gemini     │    │ Ollama          │
│ Provider      │    │ Provider        │   │ Provider   │    │ Provider        │
└───────────────┘    └─────────────────┘   └────────────┘    └─────────────────┘
```

### Key Components

- **Provider Factory**: Manages provider instantiation and switching
- **Base Provider**: Abstract interface for all LLM providers
- **MCP Client**: Handles Model Context Protocol communications
- **API Routes**: Next.js API routes for backend functionality
- **Chat UI**: React components for user interface

## API Reference

### Internal API Endpoints

#### `POST /api/chat`

Handles chat completion requests.

**Request Body:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ]
}
```

#### `GET /api/provider-status`

Returns current provider configuration and status.

#### `GET /api/servers`

Returns configured MCP servers and their status.

### Provider Interface

All providers implement the `BaseProvider` interface:

```typescript
interface BaseProvider {
  generateChatCompletion(messages: Message[]): Promise<ChatCompletion>;
  streamChatCompletion(messages: Message[]): AsyncGenerator<string>;
  validateConfig(): boolean;
}
```

## Development

### Project Structure

```text
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── chat/          # Chat completion endpoint
│   │   ├── provider-status/ # Provider status endpoint
│   │   └── servers/       # MCP servers endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── chat.tsx          # Main chat component
│   └── provider-status.tsx # Provider status component
├── lib/                   # Utility libraries
│   ├── mcp-client/       # MCP client implementation
│   ├── providers/        # LLM provider implementations
│   ├── server-utils.ts   # Server utilities
│   └── utils.ts          # General utilities
├── mcp-servers.json      # MCP server configuration
└── package.json          # Project dependencies
```

### Available Scripts

```bash
# Development server
yarn dev

# Production build
yarn build

# Start production server
yarn start

# Lint code
yarn lint
```

### Adding New Providers

1. Create a new provider class extending `BaseProvider`
2. Implement required methods (`generateChatCompletion`, etc.)
3. Add provider to `ProviderFactory`
4. Update environment variable handling

Example:

```typescript
// lib/providers/my-provider.ts
export class MyProvider extends BaseProvider {
  async generateChatCompletion(messages: Message[]): Promise<ChatCompletion> {
    // Implementation
  }
}
```

## Troubleshooting

### Common Issues

#### Provider Not Working

- Verify API keys are correctly set in `.env.local`
- Check provider-specific model names and endpoints
- Ensure the provider service is accessible

#### MCP Servers Not Connecting

- Verify `mcp-servers.json` configuration
- Check server paths and permissions for STDIO servers
- Confirm network connectivity for remote servers

#### Ollama Connection Issues

- Ensure Ollama is running: `ollama serve`
- Verify model is installed: `ollama list`
- Check Ollama base URL in configuration

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
DEBUG=mcp:*
```

### Performance Issues

- Use smaller models for faster responses
- Configure appropriate timeout values
- Monitor network connectivity for remote providers

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Use Prettier for code formatting
- Add JSDoc comments for public APIs
- Ensure all tests pass

### Areas for Contribution

- Additional LLM provider implementations
- MCP server examples and documentation
- UI/UX improvements
- Performance optimizations
- Test coverage expansion

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the community

[Report Bug](https://github.com/Lucifergene/mcp-chat-client-next/issues) · [Request Feature](https://github.com/Lucifergene/mcp-chat-client-next/issues) · [Contributing Guide](#contributing)
