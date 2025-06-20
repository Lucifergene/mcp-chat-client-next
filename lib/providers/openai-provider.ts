import { LLMProvider, ChatMessage, Tool, ChatResponse } from "./base-provider";

export class OpenAIProvider extends LLMProvider {
  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[]
  ): Promise<ChatResponse> {
    const requestBody = this.formatRequest(messages, tools);
    const response = await this.makeRequest("/chat/completions", requestBody);
    return this.parseResponse(response);
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): any {
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
    return response; // OpenAI format is our standard
  }
}
