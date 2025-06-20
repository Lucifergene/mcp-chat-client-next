import {
  LLMProvider,
  ChatMessage,
  Tool,
  ChatResponse,
  ToolCall,
} from "./base-provider";

export class GeminiProvider extends LLMProvider {
  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[]
  ): Promise<ChatResponse> {
    const requestBody = this.formatRequest(messages, tools);
    const response = await this.makeRequest(
      `/v1beta/models/${this.model}:generateContent`,
      requestBody
    );
    return this.parseResponse(response);
  }

  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-goog-api-key": this.apiKey || "",
    };
  }

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): any {
    const contents = this.convertToGeminiFormat(messages);

    const request: any = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    };

    if (tools && tools.length > 0) {
      request.tools = this.convertToGeminiTools(tools);
    }

    return request;
  }

  protected parseResponse(response: any): ChatResponse {
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const textPart = parts.find((part: any) => part.text);
    const content = textPart?.text || "";

    const toolCalls: ToolCall[] = parts
      .filter((part: any) => part.functionCall)
      .map((part: any) => ({
        id: Math.random().toString(36).substring(2, 15),
        type: "function" as const,
        function: {
          name: part.functionCall.name,
          arguments: JSON.stringify(part.functionCall.args || {}),
        },
      }));

    return {
      choices: [
        {
          message: {
            role: "assistant",
            content,
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          },
        },
      ],
      usage: response.usageMetadata
        ? {
            prompt_tokens: response.usageMetadata.promptTokenCount || 0,
            completion_tokens: response.usageMetadata.candidatesTokenCount || 0,
            total_tokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  }

  private convertToGeminiFormat(messages: ChatMessage[]) {
    return messages
      .filter((msg) => msg.role !== "system") // Handle system messages separately if needed
      .map((msg) => {
        // Handle tool result messages by converting them to user messages
        if (msg.role === "tool") {
          return {
            role: "user",
            parts: [{ text: `Tool result: ${msg.content || ""}` }],
          };
        }

        // Handle assistant messages with tool calls
        if (
          msg.role === "assistant" &&
          msg.tool_calls &&
          msg.tool_calls.length > 0
        ) {
          const parts = [];

          // Add text content if present
          if (msg.content) {
            parts.push({ text: msg.content });
          }

          // Add function calls
          msg.tool_calls.forEach((toolCall) => {
            parts.push({
              functionCall: {
                name: toolCall.function.name,
                args: JSON.parse(toolCall.function.arguments || "{}"),
              },
            });
          });

          return {
            role: "model",
            parts,
          };
        }

        // Handle regular messages
        return {
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content || "" }],
        };
      });
  }

  private convertToGeminiTools(tools: Tool[]) {
    return [
      {
        functionDeclarations: tools.map((tool) => ({
          name: tool.function.name,
          description: tool.function.description,
          parameters: this.cleanJsonSchemaForGemini(tool.function.parameters),
        })),
      },
    ];
  }

  private cleanJsonSchemaForGemini(schema: any): any {
    if (!schema || typeof schema !== "object") {
      return schema;
    }

    // Create a clean copy of the schema
    const cleanSchema = { ...schema };

    // Remove JSON Schema metadata fields that Gemini doesn't accept
    delete cleanSchema.$schema;
    delete cleanSchema.additionalProperties;
    delete cleanSchema.$id;
    delete cleanSchema.$ref;
    delete cleanSchema.definitions;
    delete cleanSchema.$defs;

    // Recursively clean nested objects
    if (cleanSchema.properties && typeof cleanSchema.properties === "object") {
      cleanSchema.properties = Object.fromEntries(
        Object.entries(cleanSchema.properties).map(([key, value]) => [
          key,
          this.cleanJsonSchemaForGemini(value),
        ])
      );
    }

    // Clean array items
    if (cleanSchema.items) {
      cleanSchema.items = this.cleanJsonSchemaForGemini(cleanSchema.items);
    }

    // Clean anyOf, oneOf, allOf
    if (cleanSchema.anyOf && Array.isArray(cleanSchema.anyOf)) {
      cleanSchema.anyOf = cleanSchema.anyOf.map((item: any) =>
        this.cleanJsonSchemaForGemini(item)
      );
    }

    if (cleanSchema.oneOf && Array.isArray(cleanSchema.oneOf)) {
      cleanSchema.oneOf = cleanSchema.oneOf.map((item: any) =>
        this.cleanJsonSchemaForGemini(item)
      );
    }

    if (cleanSchema.allOf && Array.isArray(cleanSchema.allOf)) {
      cleanSchema.allOf = cleanSchema.allOf.map((item: any) =>
        this.cleanJsonSchemaForGemini(item)
      );
    }

    return cleanSchema;
  }
}
