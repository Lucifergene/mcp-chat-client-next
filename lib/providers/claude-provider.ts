import {
  LLMProvider,
  ChatMessage,
  Tool,
  ChatResponse,
  ToolCall,
} from "./base-provider";

export class ClaudeProvider extends LLMProvider {
  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[]
  ): Promise<ChatResponse> {
    const requestBody = this.formatRequest(messages, tools);
    const response = await this.makeRequest("/messages", requestBody);
    return this.parseResponse(response);
  }

  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.apiKey,
      "anthropic-version": "2023-06-01",
    };
  }

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): any {
    const claudeMessages = this.convertToAnthropicFormat(messages);

    const request: any = {
      model: this.model,
      max_tokens: 4096,
      messages: claudeMessages,
    };

    if (tools && tools.length > 0) {
      request.tools = this.convertToAnthropicTools(tools);
    }

    return request;
  }

  protected parseResponse(response: any): ChatResponse {
    const content = response.content || [];
    const textContent = content.find((c: any) => c.type === "text")?.text || "";

    const toolCalls: ToolCall[] = content
      .filter((c: any) => c.type === "tool_use")
      .map((c: any) => ({
        id: c.id,
        type: "function" as const,
        function: {
          name: c.name,
          arguments: JSON.stringify(c.input),
        },
      }));

    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: textContent,
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          },
        },
      ],
      usage: response.usage
        ? {
            prompt_tokens: response.usage.input_tokens || 0,
            completion_tokens: response.usage.output_tokens || 0,
            total_tokens:
              (response.usage.input_tokens || 0) +
              (response.usage.output_tokens || 0),
          }
        : undefined,
    };
  }

  private convertToAnthropicFormat(messages: ChatMessage[]) {
    return messages
      .filter((msg) => msg.role !== "system") // Claude handles system messages differently
      .map((msg) => {
        if (msg.role === "tool") {
          return {
            role: "user",
            content: `Tool result: ${msg.content}`,
          };
        }

        return {
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content || "",
        };
      });
  }

  private convertToAnthropicTools(tools: Tool[]) {
    return tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters,
    }));
  }
}
