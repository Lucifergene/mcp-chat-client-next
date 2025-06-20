import { LLMProvider, ProviderConfig } from "./base-provider";
import { OpenAIProvider } from "./openai-provider";
import { ClaudeProvider } from "./claude-provider";
import { GeminiProvider } from "./gemini-provider";
import { OllamaProvider } from "./ollama-provider";

export class ProviderFactory {
  static createProvider(config: ProviderConfig): LLMProvider {
    switch (config.type) {
      case "openai":
        return new OpenAIProvider(config);

      case "claude":
        return new ClaudeProvider(config);

      case "gemini":
        return new GeminiProvider(config);

      case "ollama":
        return new OllamaProvider(config);

      case "custom":
        // Custom uses OpenAI-compatible format
        return new OpenAIProvider(config);

      default:
        throw new Error(`Unsupported provider: ${config.type}`);
    }
  }
}

export function getProviderConfig(): ProviderConfig {
  const provider = process.env.LLM_PROVIDER || "openai";

  const configs: Record<string, Partial<ProviderConfig>> = {
    openai: {
      type: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: "https://api.openai.com/v1",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },

    claude: {
      type: "claude",
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: "https://api.anthropic.com/v1",
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    },

    gemini: {
      type: "gemini",
      apiKey: process.env.GOOGLE_API_KEY,
      baseUrl: "https://generativelanguage.googleapis.com",
      model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
    },

    ollama: {
      type: "ollama",
      // No API key needed for Ollama
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434", // Ollama library expects base URL without /v1
      model: process.env.OLLAMA_MODEL || "llama3.1:8b", // Updated to match your example
    },

    custom: {
      type: "custom",
      apiKey: process.env.CUSTOM_API_KEY,
      baseUrl: process.env.CUSTOM_BASE_URL,
      model: process.env.CUSTOM_MODEL,
    },
  };

  const config = configs[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  // Validate required fields
  if (provider !== "ollama" && !config.apiKey) {
    throw new Error(`API key is required for provider: ${provider}`);
  }
  if (!config.baseUrl) {
    throw new Error(`Base URL is required for provider: ${provider}`);
  }
  if (!config.model) {
    throw new Error(`Model is required for provider: ${provider}`);
  }

  return config as ProviderConfig;
}

// Export provider info for status display
export function getProviderInfo() {
  const config = getProviderConfig();
  return {
    provider: config.type,
    model: config.model,
    baseURL: config.baseUrl,
  };
}
