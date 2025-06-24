import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import * as path from "path";
import dotenv from "dotenv";
import { findNpxPath } from "../server-utils";
import {
  ProviderFactory,
  getProviderConfig as getConfig,
  getProviderInfo,
} from "../providers/provider-factory";
import { LLMProvider, ChatMessage, Tool } from "../providers/base-provider";

dotenv.config();

// Initialize the LLM provider
let llmProvider: LLMProvider;

try {
  const config = getConfig();
  llmProvider = ProviderFactory.createProvider(config);
  console.log(`Using LLM Provider: ${config.type}, Model: ${config.model}`);
} catch (error) {
  console.error("Failed to initialize LLM provider:", error);
  throw error;
}

// Store multiple MCP clients
const mcpClients: Map<string, Client> = new Map();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tools: any[] = [];

let connected = false;

export interface ServerConfig {
  name: string;
  // For STDIO connections
  scriptPath?: string;
  npxCommand?: string;
  args?: string[];
  env?: Record<string, string>;
  // For SSE and Streamable HTTP connections
  url?: string;
  headers?: Record<string, string>;
  // Connection type
  type?: "stdio" | "sse" | "streamable-http";
}

export async function initMCP(serverConfigs: ServerConfig[]) {
  if (connected) return;

  const allTools = [];

  for (const config of serverConfigs) {
    const client = new Client({
      name: `${config.name}-client`,
      version: "1.0.0",
    });

    let transport;

    // Determine connection type - default to stdio if no url, streamable-http if url without explicit type
    const connectionType = config.type || (config.url ? "streamable-http" : "stdio");

    if (connectionType === "streamable-http") {
      // Streamable HTTP connection
      if (!config.url) {
        throw new Error(
          `Server config for '${config.name}' with streamable-http type must have a url`
        );
      }

      const transportOptions: any = {};

      // Add headers if provided
      if (config.headers) {
        transportOptions.requestInit = {
          headers: config.headers,
        };
      }

      transport = new StreamableHTTPClientTransport(
        new URL(config.url),
        transportOptions
      );
      console.log(
        `Connecting to MCP server '${config.name}' via Streamable HTTP at ${
          config.url
        }${config.headers ? " with auth headers" : ""}`
      );
    } else if (connectionType === "sse") {
      // SSE connection
      if (!config.url) {
        throw new Error(
          `Server config for '${config.name}' with SSE type must have a url`
        );
      }

      const transportOptions: any = { url: new URL(config.url) };

      // Add headers if provided
      if (config.headers) {
        transportOptions.headers = config.headers;
      }

      transport = new SSEClientTransport(transportOptions);
      console.log(
        `Connecting to MCP server '${config.name}' via SSE at ${config.url}${
          config.headers ? " with auth headers" : ""
        }`
      );
    } else {
      // STDIO connection (default)
      let command: string;
      let args: string[];

      if (config.npxCommand) {
        // Use npm command - find npx executable
        try {
          command = await findNpxPath();
          args = ["-y", config.npxCommand, ...(config.args || [])];
        } catch (error) {
          throw new Error(
            `Failed to find npx for server '${config.name}': ${
              error instanceof Error ? error.message : error
            }. Please ensure Node.js is properly installed with npx available.`
          );
        }
      } else if (config.scriptPath) {
        // Use script path
        command = config.scriptPath.endsWith(".py")
          ? process.platform === "win32"
            ? "python"
            : "python3"
          : process.execPath;
        args = [config.scriptPath, ...(config.args || [])];
      } else {
        throw new Error(
          `Server config for '${config.name}' must have either scriptPath, npxCommand, or url`
        );
      }

      transport = new StdioClientTransport({
        command,
        args,
        env: {
          ...process.env, // Inherit current environment
          ...config.env, // Add config-specific env vars
          // Ensure node is in PATH when using npx
          ...(config.npxCommand && {
            PATH: `${path.dirname(process.execPath)}:${process.env.PATH || ""}`,
          }),
        },
      });

      console.log(`Connecting to MCP server '${config.name}' via STDIO`);
    }

    // Connect the client with the appropriate transport
    await client.connect(transport);

    const toolsResult = await client.listTools();

    const serverTools = toolsResult.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
      serverId: config.name, // Track which server this tool belongs to
    }));

    allTools.push(...serverTools);
    mcpClients.set(config.name, client);

    console.log(
      `MCP Server '${config.name}' connected with tools:`,
      serverTools.map((t) => t.function.name)
    );
  }

  tools = allTools;
  connected = true;
  console.log(
    "All MCP servers connected. Total tools:",
    tools.map((t) => t.function.name)
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeToolCall(toolCall: any) {
  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

  // Find which server this tool belongs to
  const tool = tools.find((t) => t.function.name === toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }

  const client = mcpClients.get(tool.serverId);
  if (!client) {
    throw new Error(`Client for server '${tool.serverId}' not found`);
  }

  const result = await client.callTool({
    name: toolName,
    arguments: toolArgs,
  });

  // Extract and format the result content properly
  let formattedResult: string;
  if (Array.isArray(result.content)) {
    // MCP results are arrays of content blocks
    formattedResult = result.content
      .map((block: any) => {
        if (block.type === "text") {
          return block.text;
        } else if (typeof block === "string") {
          return block;
        } else {
          return JSON.stringify(block, null, 2);
        }
      })
      .join("\n");
  } else if (typeof result.content === "string") {
    formattedResult = result.content;
  } else {
    formattedResult = JSON.stringify(result.content, null, 2);
  }

  return {
    id: toolCall.id,
    name: toolName,
    arguments: toolArgs,
    result: formattedResult,
    serverId: tool.serverId,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processQuery(
  messagesInput: any[],
  enabledTools: string[] = []
) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are a helpful assistant. When using tools, provide a clear, readable summary of the results rather than showing raw data. Focus on answering the user's question with the information gathered.",
    },
    ...messagesInput,
  ];

  // Filter tools based on enabled servers
  const filteredTools =
    enabledTools.length > 0
      ? tools.filter((tool) => enabledTools.includes(tool.serverId))
      : tools;

  // Remove serverId from tools when sending to LLM
  const llmTools: Tool[] = filteredTools.map(({ serverId, ...tool }) => tool);

  try {
    const response = await llmProvider.sendMessage(messages, llmTools);
    const replyMessage = response.choices[0].message;
    console.log("LLM reply message:", replyMessage);
    const toolCalls = replyMessage.tool_calls || [];

    if (toolCalls.length > 0) {
      const toolResponses = [];

      for (const toolCall of toolCalls) {
        const toolResponse = await executeToolCall(toolCall);
        toolResponses.push(toolResponse);

        messages.push({
          role: "assistant",
          content: null,
          tool_calls: [toolCall],
        });

        messages.push({
          role: "tool",
          content: toolResponse.result,
          tool_call_id: toolCall.id,
        });
      }

      const followUp = await llmProvider.sendMessage(messages);

      return {
        reply: followUp.choices[0].message.content || "",
        toolCalls,
        toolResponses,
      };
    }

    return {
      reply: replyMessage.content || "",
      toolCalls: [],
      toolResponses: [],
    };
  } catch (error) {
    throw error;
  }
}

// Export provider configuration for external use
export function getProviderConfig() {
  return getProviderInfo();
}

// Function to get provider status
export function getProviderStatus() {
  try {
    const info = getProviderInfo();
    return {
      ...info,
      connected: true,
    };
  } catch (error) {
    return {
      provider: "unknown",
      model: "unknown",
      baseURL: "unknown",
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Function to gracefully disconnect all clients
export async function disconnectMCP() {
  for (const [name, client] of mcpClients) {
    try {
      await client.close();
      console.log(`Disconnected MCP server: ${name}`);
    } catch (error) {
      console.error(`Error disconnecting MCP server ${name}:`, error);
    }
  }
  mcpClients.clear();
  tools = [];
  connected = false;
}
