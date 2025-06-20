// Base interfaces for LLM providers
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface Tool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatResponse {
  choices: [
    {
      message: {
        role: "assistant";
        content: string | null;
        tool_calls?: ToolCall[];
      };
    }
  ];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ProviderConfig {
  type: string;
  apiKey?: string; // Made optional for providers like Ollama
  baseUrl: string;
  model: string;
}

// Abstract base class for all LLM providers
export abstract class LLMProvider {
  protected apiKey?: string; // Made optional
  protected baseUrl: string;
  protected model: string;
  protected type: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.type = config.type;
  }

  abstract sendMessage(
    messages: ChatMessage[],
    tools?: Tool[]
  ): Promise<ChatResponse>;

  protected abstract getHeaders(): Record<string, string>;
  protected abstract formatRequest(
    messages: ChatMessage[],
    tools?: Tool[]
  ): any;
  protected abstract parseResponse(response: any): ChatResponse;

  protected async makeRequest(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `${this.type} API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }
}
