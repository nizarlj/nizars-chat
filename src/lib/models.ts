import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { LanguageModelV1, type Message } from "ai";
import { 
  Eye, 
  FileUp, 
  Brain, 
  type LucideIcon,
  Search,
  FlaskConical,
  Key,
  Sparkles,
  Crown,
  Image,
  Settings2,
  Zap
} from "lucide-react";
import { Doc } from "@convex/_generated/dataModel";
import { ModelParams } from "@convex/schema";

// ------- CHAT MESSAGE TYPE -------
export type ChatMessage = Message & { 
  clientId?: string;
  streamId?: string;
  metadata?: Doc<"messages">["metadata"];
  providerMetadata?: Record<string, unknown>;
  model?: string;
  status?: "streaming" | "completed" | "error";
  error?: string;
};


// ------- CAPABILITIES -------
export interface BaseModelPropertyDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  textColor: string;
  backgroundColor: string;
}

export const CAPABILITY_DEFINITIONS = [
  {
    id: "fast",
    name: "Fast",
    description: "Very fast model",
    icon: Zap,
    textColor: "text-yellow-300",
    backgroundColor: "bg-yellow-300/10"
  },
  {
    id: "pdfUpload",
    name: "PDFs",
    description: "Supports PDF uploads and analysis",
    icon: FileUp,
    textColor: "text-orange-300",
    backgroundColor: "bg-orange-300/10"
  },
  {
    id: "vision",
    name: "Vision",
    description: "Supports image uploads and analysis",
    icon: Eye,
    textColor: "text-blue-300",
    backgroundColor: "bg-blue-300/10",
  },
  {
    id: "search",
    name: "Search",
    description: "Can search the web for information",
    icon: Search,
    textColor: "text-green-300",
    backgroundColor: "bg-green-300/10"
  },
  {
    id: "reasoning",
    name: "Reasoning",
    description: "Has reasoning capabilities",
    icon: Brain,
    textColor: "text-purple-300",
    backgroundColor: "bg-purple-300/10"
  },
  {
    id: "effortControl",
    name: "Effort Control",
    description: "Customize the model's reasoning effort",
    icon: Settings2,
    textColor: "text-pink-300",
    backgroundColor: "bg-pink-300/10"
  },
  {
    id: "imageGeneration",
    name: "Image Generation",
    description: "Can generate images",
    icon: Image,
    textColor: "text-red-300",
    backgroundColor: "bg-red-300/10",
  }
] as const satisfies BaseModelPropertyDefinition[];

export type CapabilityKey = typeof CAPABILITY_DEFINITIONS[number]["id"];
export interface CapabilityDefinition extends BaseModelPropertyDefinition {
  id: CapabilityKey;
}

export const CAPABILITY_LOOKUP = CAPABILITY_DEFINITIONS.reduce((acc, capability) => {
  acc[capability.id] = capability;
  return acc;
}, {} as Record<CapabilityKey, CapabilityDefinition>);


export type ModelCapabilities = Record<CapabilityKey, boolean> & {
  maxTokens?: number;
  contextWindow?: number;
};
type PartialModelCapabilities = Partial<ModelCapabilities>;

// Helper function to ensure all capabilities are defined with defaults
function normalizeCapabilities(capabilities: PartialModelCapabilities): ModelCapabilities {
  const defaultCapabilities: Record<CapabilityKey, boolean> = {
    vision: false,
    pdfUpload: false,
    effortControl: false,
    reasoning: false,
    search: false,
    fast: false,
    imageGeneration: false,
  };

  return {
    ...defaultCapabilities,
    ...capabilities,
    maxTokens: capabilities.maxTokens,
    contextWindow: capabilities.contextWindow,
  };
}


// ------- MODEL FLAGS -------


export const MODEL_FLAG_DEFINITIONS = [
  {
    id: "isNew",
    name: "New",
    description: "Recently released model",
    icon: Sparkles,
    textColor: "text-yellow-300",
    backgroundColor: "bg-yellow-300/10",
  },
  {
    id: "isPremium",
    name: "Premium",
    description: "Premium model with advanced features",
    icon: Crown,
    textColor: "text-green-300",
    backgroundColor: "bg-green-300/10",
  },
  {
    id: "isExperimental",
    name: "Experimental",
    description: "Experimental - may have unstable behavior",
    icon: FlaskConical,
    textColor: "text-purple-300",
    backgroundColor: "bg-purple-300/10",
  },
  {
    id: "isBringYourOwnKey",
    name: "Bring Your Own Key",
    description: "Requires your own API key",
    icon: Key,
    textColor: "text-blue-300",
    backgroundColor: "bg-blue-300/10",
  },
] as const satisfies BaseModelPropertyDefinition[];

export type ModelFlagKey = typeof MODEL_FLAG_DEFINITIONS[number]["id"];
export interface ModelFlagDefinition extends BaseModelPropertyDefinition {
  id: ModelFlagKey;
}

export const MODEL_FLAG_LOOKUP = MODEL_FLAG_DEFINITIONS.reduce((acc, flag) => {
  acc[flag.id] = flag;
  return acc;
}, {} as Record<ModelFlagKey, ModelFlagDefinition>);


export type ModelFlags = Partial<Record<ModelFlagKey, boolean>>;


// ------- PROVIDERS -------
interface BaseProviderDefinition {
  id: string;
  name: string;
  website: string;
}


export const PROVIDER_DEFINITIONS = [
  {
    id: "google",
    name: "Google",
    website: "https://ai.google.dev/",
  },
  {
    id: "openai",
    name: "OpenAI",
    website: "https://openai.com/",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    website: "https://anthropic.com/",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    website: "https://deepseek.com/",
  },
  {
    id: "meta",
    name: "Meta",
    website: "https://ai.meta.com/",
  },
  {
    id: "grok",
    name: "Grok",
    website: "https://x.ai/",
  },
  {
    id: "qwen",
    name: "Qwen",
    website: "https://qwenlm.github.io/",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    website: "https://openrouter.ai/",
  },
] as const satisfies BaseProviderDefinition[];
export type ProviderKey = typeof PROVIDER_DEFINITIONS[number]["id"];

export interface ProviderDefinition extends BaseProviderDefinition {
  id: ProviderKey;
}

export const PROVIDER_LOOKUP = PROVIDER_DEFINITIONS.reduce((acc, provider) => {
  acc[provider.id] = provider;
  return acc;
}, {} as Record<ProviderKey, ProviderDefinition>);


// ------- MODELS -------
type ModelType = "chat" | "imageGeneration";

// Internal model definition with optional capabilities
interface InternalBaseModel {
  id: string;
  name: string;
  subtitle?: string;
  provider: ProviderKey;
  type: ModelType;
  description: string;
  capabilities: PartialModelCapabilities; // Allow partial capabilities
  flags?: ModelFlags;
  isDefault?: boolean;
}

// Final model definition with normalized capabilities
interface BaseModel {
  id: string;
  name: string;
  subtitle?: string;
  provider: ProviderKey;
  type: ModelType;
  description: string;
  capabilities: ModelCapabilities; // All capabilities defined
  flags?: ModelFlags;
  isDefault?: boolean;
}

const INTERNAL_MODELS = [
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    type: "chat",
    description: "Google's latest stable model",
    capabilities: {
      vision: true,
      pdfUpload: true,
      search: true,
      maxTokens: 8192,
      contextWindow: 1000000,
    },
    isDefault: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    subtitle: "Thinking",
    provider: "google", 
    type: "chat",
    description: "Google's latest fast model",
    capabilities: {
      vision: true,
      pdfUpload: true,
      search: true,
      maxTokens: 65535,
      contextWindow: 1048576,
    },
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    type: "chat",
    description: "Google's most capable model",
    capabilities: {
      vision: true,
      pdfUpload: true,
      reasoning: true,
      search: true,
      effortControl: true,
      maxTokens: 65536,
      contextWindow: 1048576,
    },
    flags: {
      isExperimental: true,
    },
  },
  {
    id: "gpt-imagegen",
    name: "GPT ImageGen",
    provider: "openai",
    type: "imageGeneration",
    description: "OpenAI's image generation model",
    capabilities: {
      vision: true,
      imageGeneration: true,
    }
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    type: "chat",
    description: "OpenAI's flagship model optimized for advanced instruction following and real-world software engineering",
    capabilities: {
      vision: true,
      contextWindow: 1047576,
      maxTokens: 32768
    }
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    type: "chat",
    description: "OpenAI's faster less precise 4.1 model",
    capabilities: {
      vision: true,
      contextWindow: 1047576,
      maxTokens: 32768
    }
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "openai",
    type: "chat",
    description: "OpenAI's fastest less precise 4.1 model that demand low latency",
    capabilities: {
      vision: true,
      contextWindow: 1047576,
      maxTokens: 32768
    }
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    type: "chat",
    description: "OpenAI's flagship non-reasoning model",
    capabilities: {
      vision: true,
      maxTokens: 16384,
      contextWindow: 128000,
    }
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    type: "chat",
    description: "OpenAI's faster less precise 4o model",
    capabilities: {
      vision: true,
      maxTokens: 16384,
      contextWindow: 128000
    }
  },
  {
    id: "o4-mini",
    name: "o4-mini",
    provider: "openai",
    type: "chat",
    description: "OpenAI's latest small reasoning model",
    capabilities: {
      vision: true,
      reasoning: true,
      effortControl: true,
      maxTokens: 100000,
      contextWindow: 200000,
    },
  },
  {
    id: "claude-4-sonnet",
    name: "Claude 4 Sonnet",
    provider: "anthropic",
    type: "chat",
    description: "Anthropic's flagship model",
    capabilities: {
      vision: true,
      pdfUpload: true,
      maxTokens: 64000,
      contextWindow: 200000,
    },
  },
  {
    id: "claude-4-sonnet-reasoning",
    name: "Claude 4 Sonnet",
    subtitle: "Reasoning",
    provider: "anthropic",
    type: "chat",
    description: "Anthropic's flagship model (reasoning)",
    capabilities: {
      vision: true,
      pdfUpload: true,
      reasoning: true,
      effortControl: true,
      maxTokens: 64000,
      contextWindow: 200000,
    },
  },
  {
    id: "deepseek-r1-0528",
    name: "DeepSeek R1",
    subtitle: "0528",
    provider: "deepseek",
    type: "chat",
    description: "DeepSeek's updated R1 model",
    capabilities: {
      reasoning: true,
      maxTokens: 16000,
      contextWindow: 128000,
    }
  },
  {
    id: "deepseek-r1-llama-distilled",
    name: "DeepSeek R1",
    subtitle: "Llama Distilled",
    provider: "deepseek",
    type: "chat",
    description: "DeepSeek R1 distilled in Llama 3.3 70b",
    capabilities: {
      reasoning: true,
      fast: true,
      maxTokens: 16000,
      contextWindow: 128000,
    },
  },
] as const satisfies readonly InternalBaseModel[];

export interface Model extends BaseModel {
  id: SupportedModelId;
}

// Transform internal models to normalized models with all capabilities defined
function createModels(): Model[] {
  return INTERNAL_MODELS.map(model => ({
    ...model,
    capabilities: normalizeCapabilities(model.capabilities),
  })) as Model[];
}

export const MODELS = createModels();
export type SupportedModelId = (typeof INTERNAL_MODELS)[number]["id"];


// ------- UTILITIES -------
export function getModelById(id: SupportedModelId): Model {
  return MODELS.find(model => model.id === id)!;
}

export function getModelsByProvider(provider: ProviderKey): Model[] {
  return MODELS.filter(model => model.provider === provider);
}

export function getModelsByCapability(capability: CapabilityKey): Model[] {
  return MODELS.filter(model => model.capabilities[capability]);
}

export function getModelsByType(type: ModelType): Model[] {
  return MODELS.filter(model => model.type === type);
}

export function isImageGenerationModel(model: Model): boolean {
  return model.type === "imageGeneration";
}

export function isChatModel(model: Model): boolean {
  return model.type === "chat";
}

export function getDefaultModel(): Model {
  return MODELS.find(model => model.isDefault) || MODELS[0];
}

export function getModelCapabilities(model: Model): CapabilityDefinition[] {
  return CAPABILITY_DEFINITIONS.filter(capability => model.capabilities[capability.id]);
}

export function getModelFlags(model: Model): ModelFlagDefinition[] {
  return MODEL_FLAG_DEFINITIONS.filter(flag => model.flags?.[flag.id]);
}

export function getProviderDefinition(provider: ProviderKey): ProviderDefinition {
  return { 
    ...PROVIDER_LOOKUP[provider], 
    id: provider 
  };
}


// ------- MODEL INSTANCES -------
const systemOpenRouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const systemGoogle = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const systemOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const reasoningBudgets = {
  "low": 1024,
  "medium": 4000,
  "high": 16000,
}

export type ImageModelV1 = ReturnType<typeof openai.image>;
export function getModelByInternalId(
  internalId: SupportedModelId, 
  userApiKey?: string | null, 
  useOpenRouterForAll: boolean = false,
  modelParams?: ModelParams,
): LanguageModelV1 | ImageModelV1 | undefined {
  // Create custom clients if user has their own API key
  const openRouterInstance = userApiKey ? 
    createOpenRouter({ apiKey: userApiKey }) : systemOpenRouter;
  const googleInstance = userApiKey && internalId.startsWith('gemini') ? 
    createGoogleGenerativeAI({ apiKey: userApiKey }) : systemGoogle;
  const openAIInstance = userApiKey && (internalId.startsWith('gpt') || internalId.startsWith('o4')) ? 
    createOpenAI({ apiKey: userApiKey }) : systemOpenAI;

  const isSearchEnabled = !!modelParams?.includeSearch;

  // If user wants to use OpenRouter for all models and has OpenRouter key, route everything through OpenRouter
  const suffix = isSearchEnabled ? ':online' : '';
  const maxTokensThinking = modelParams?.reasoningEffort ? { reasoning: { max_tokens: reasoningBudgets[modelParams.reasoningEffort] } } : undefined
  const effortControlThinking = modelParams?.reasoningEffort ? { reasoning: { effort: modelParams.reasoningEffort } } : undefined
  if (useOpenRouterForAll && userApiKey) {
    switch (internalId) {
      case "gemini-2.0-flash":
        return openRouterInstance.languageModel(`google/gemini-2.0-flash-exp${suffix}`);
      case "gemini-2.5-flash":
        return openRouterInstance.languageModel(`google/gemini-2.5-flash-exp${suffix}`);
      case "gemini-2.5-pro":
        return openRouterInstance.languageModel(`google/gemini-2.5-pro-exp${suffix}`, maxTokensThinking);
      case "gpt-4.1":
        return openRouterInstance.languageModel(`openai/gpt-4.1${suffix}`);
      case "gpt-4.1-mini":
        return openRouterInstance.languageModel(`openai/gpt-4.1-mini${suffix}`);
      case "gpt-4.1-nano":
        return openRouterInstance.languageModel(`openai/gpt-4.1-nano${suffix}`);
      case "gpt-4o":
        return openRouterInstance.languageModel(`openai/gpt-4o${suffix}`);
      case "gpt-4o-mini":
        return openRouterInstance.languageModel(`openai/gpt-4o-mini${suffix}`);
      case "o4-mini":
        return openRouterInstance.languageModel(`openai/o4-mini${suffix}`, effortControlThinking);
      case "claude-4-sonnet":
      case "claude-4-sonnet-reasoning":
        return openRouterInstance.languageModel(`anthropic/claude-sonnet-4${suffix}`, maxTokensThinking);
      case "deepseek-r1-0528":
        return openRouterInstance.languageModel(`deepseek/deepseek-r1-0528:free${suffix}`);
      case "deepseek-r1-llama-distilled":
        return openRouterInstance.languageModel(`deepseek/deepseek-r1-distill-llama-70b${suffix}`);
      // Image generation models still use native providers since OpenRouter doesn't support them all
      case "gpt-imagegen":
        return openAIInstance.image("gpt-image-1");
      default:
        break; // Fall through to regular logic
    }
  }

  // Regular model routing logic
  switch (internalId) {
    case "gemini-2.0-flash":
      return googleInstance("gemini-2.0-flash", { useSearchGrounding: isSearchEnabled });
    case "gemini-2.5-flash":
      return googleInstance("gemini-2.5-flash-preview-04-17", { useSearchGrounding: isSearchEnabled });
    case "gemini-2.5-pro":
      return googleInstance("gemini-2.5-pro-exp-03-25", { useSearchGrounding: isSearchEnabled });
    case "gpt-imagegen":
      return openAIInstance.image("gpt-image-1");
    case "gpt-4.1":
      return openAIInstance("gpt-4.1");
    case "gpt-4.1-mini":
      return openAIInstance("gpt-4.1-mini");
    case "gpt-4.1-nano":
      return openAIInstance("gpt-4.1-nano");
    case "gpt-4o":
      return openAIInstance("gpt-4o");
    case "gpt-4o-mini":
      return openAIInstance("gpt-4o-mini");
    case "o4-mini":
      return openAIInstance("o4-mini");
    case "claude-4-sonnet":
    case "claude-4-sonnet-reasoning":
      return openRouterInstance.languageModel("anthropic/claude-sonnet-4", maxTokensThinking);
    case "deepseek-r1-0528":
      // TODO: REMOVE FREE
      return openRouterInstance.languageModel("deepseek/deepseek-r1-0528:free");
    case "deepseek-r1-llama-distilled":
      return openRouterInstance.languageModel("deepseek/deepseek-r1-distill-llama-70b:nitro");
    default:
      return undefined;
  }
}