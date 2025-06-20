import { LLMProvider, ChatMessage, Tool, ChatResponse } from "./base-provider";
import { Ollama } from "ollama";

export class OllamaProvider extends LLMProvider {
  private ollama: Ollama;

  constructor(config: any) {
    super(config);
    // Initialize Ollama client with the base URL
    this.ollama = new Ollama({
      host: this.baseUrl.replace("/v1", ""), // Remove /v1 suffix if present
    });
  }

  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[]
  ): Promise<ChatResponse> {
    // Convert our ChatMessage format to Ollama's Message format
    const ollamaMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content || "", // Ollama expects string, not null
      tool_calls: msg.tool_calls,
      tool_call_id: msg.tool_call_id,
    }));
    console.log("Ollama tools:", tools);
    const response = await this.ollama.chat({
      model: this.model,
      messages: ollamaMessages,
      tools: tools,
    });
    const parsedResponse = this.parseResponse(response);
    console.log("Ollama parsed response:", parsedResponse);
    return parsedResponse;
  }

  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      // No authorization header needed for Ollama
    };
  }

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): any {
    // This method is not used anymore since we're using the Ollama library directly
    const request: any = {
      model: this.model,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    };

    if (tools && tools.length > 0) {
      request.tools = tools;
    }

    return request;
  }

  protected parseResponse(response: any): ChatResponse {
    // The Ollama library returns a response that should be compatible with OpenAI format
    // But let's ensure it matches our expected ChatResponse format
    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: response.message?.content || null,
            tool_calls: response.message?.tool_calls,
          },
        },
      ],
      usage: response.usage || {
        prompt_tokens: response.prompt_eval_count || 0,
        completion_tokens: response.eval_count || 0,
        total_tokens:
          (response.prompt_eval_count || 0) + (response.eval_count || 0),
      },
    };
  }
}
