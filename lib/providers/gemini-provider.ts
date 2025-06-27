import {
  LLMProvider,
  ChatMessage,
  Tool,
  ChatResponse,
  ToolCall,
  ProviderConfig,
} from "./base-provider";
import {
  GoogleGenerativeAI,
  GenerativeModel,
  Content,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentResult,
  Part,
} from "@google/generative-ai";

export class GeminiProvider extends LLMProvider {
  private genAI: GoogleGenerativeAI;
  private geminiModel: GenerativeModel;

  constructor(config: ProviderConfig) {
    super(config);
    if (!this.apiKey) {
      throw new Error("Gemini API key is required");
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);

    this.geminiModel = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  }

  async sendMessage(
    messages: ChatMessage[],
    tools?: Tool[]
  ): Promise<ChatResponse> {
    try {
      console.log(
        "Gemini: Sending message with",
        messages.length,
        "messages and",
        tools?.length || 0,
        "tools"
      );

      const systemMessage = messages.find((m) => m.role === "system");
      const conversationMessages = messages.filter((m) => m.role !== "system");

      const contents = this.convertToGeminiFormat(conversationMessages);
      console.log(
        "Gemini: Converted contents:",
        JSON.stringify(contents, null, 2)
      );

      let modelToUse = this.geminiModel;
      const modelConfig: any = {
        model: this.model,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
        safetySettings: this.geminiModel.safetySettings,
      };

      if (tools && tools.length > 0) {
        modelConfig.tools = [this.convertToGeminiTools(tools)];
      }

      if (systemMessage) {
        modelConfig.systemInstruction = systemMessage.content ?? undefined;
      }

      if ((tools && tools.length > 0) || systemMessage) {
        modelToUse = this.genAI.getGenerativeModel(modelConfig);
      }

      const result = await modelToUse.generateContent({ contents });

      console.log("Gemini: Got result:", JSON.stringify(result, null, 2));

      return this.parseResponse(result);
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  protected getHeaders(): Record<string, string> {
    return {};
  }

  protected formatRequest(messages: ChatMessage[], tools?: Tool[]): any {
    return {};
  }

  protected parseResponse(result: GenerateContentResult): ChatResponse {
    const { response } = result;
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const textPart = parts.find((part: Part) => part.text);
    const content = textPart?.text || "";

    const toolCalls: ToolCall[] = parts
      .filter((part: Part) => part.functionCall)
      .map((part: Part) => ({
        id: Math.random().toString(36).substring(2, 15),
        type: "function" as const,
        function: {
          name: part.functionCall!.name,
          arguments: JSON.stringify(part.functionCall!.args || {}),
        },
      }));

    console.log("Gemini: Parsed tool calls:", toolCalls);

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

  private convertToGeminiFormat(messages: ChatMessage[]): Content[] {
    const contents: Content[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      if (msg.role === "tool") {
        let functionName = "unknown_function";
        for (let j = i - 1; j >= 0; j--) {
          const prevMsg = messages[j];
          if (prevMsg.role === "assistant" && prevMsg.tool_calls) {
            const matchingCall = prevMsg.tool_calls.find(
              (tc) => tc.id === msg.tool_call_id
            );
            if (matchingCall) {
              functionName = matchingCall.function.name;
              break;
            }
          }
        }

        let responseData: any;
        try {
          responseData = JSON.parse(msg.content || "{}");
        } catch {
          responseData = { result: msg.content || "" };
        }

        contents.push({
          role: "function",
          parts: [
            {
              functionResponse: {
                name: functionName,
                response: responseData,
              },
            },
          ],
        });
        continue;
      }

      if (
        msg.role === "assistant" &&
        msg.tool_calls &&
        msg.tool_calls.length > 0
      ) {
        const parts: Part[] = [];

        if (msg.content) {
          parts.push({ text: msg.content });
        }

        msg.tool_calls.forEach((toolCall) => {
          parts.push({
            functionCall: {
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || "{}"),
            },
          });
        });

        contents.push({ role: "model", parts });
        continue;
      }

      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: msg.content || "" }] });
      } else if (msg.role === "assistant") {
        contents.push({ role: "model", parts: [{ text: msg.content || "" }] });
      }
    }

    return contents;
  }

  private convertToGeminiTools(tools: Tool[]) {
    return {
      functionDeclarations: tools.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        parameters: this.cleanJsonSchemaForGemini(tool.function.parameters),
      })),
    };
  }

  private cleanJsonSchemaForGemini(schema: any): any {
    if (!schema || typeof schema !== "object") {
      return schema;
    }

    const cleanSchema = { ...schema };

    delete cleanSchema.$schema;
    delete cleanSchema.additionalProperties;
    delete cleanSchema.$id;
    delete cleanSchema.$ref;
    delete cleanSchema.definitions;
    delete cleanSchema.$defs;

    if (cleanSchema.properties && typeof cleanSchema.properties === "object") {
      cleanSchema.properties = Object.fromEntries(
        Object.entries(cleanSchema.properties).map(([key, value]) => [
          key,
          this.cleanJsonSchemaForGemini(value),
        ])
      );
    }

    if (cleanSchema.items) {
      cleanSchema.items = this.cleanJsonSchemaForGemini(cleanSchema.items);
    }

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
