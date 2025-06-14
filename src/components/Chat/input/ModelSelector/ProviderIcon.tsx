import { ProviderKey } from "@/lib/models";
import { cn } from "@/lib/utils";

interface ProviderIconProps {
  provider: ProviderKey;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
}

import GoogleSVG from "@public/providers/google.svg";
import OpenAISVG from "@public/providers/openai.svg";
import AnthropicSVG from "@public/providers/anthropic.svg";
import DeepSeekSVG from "@public/providers/deepseek.svg";
import MetaSVG from "@public/providers/meta.svg";
import GrokSVG from "@public/providers/grok.svg";
import QwenSVG from "@public/providers/qwen.svg";

const iconsMap: Record<ProviderKey, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  google: GoogleSVG,
  openai: OpenAISVG,
  anthropic: AnthropicSVG,
  deepseek: DeepSeekSVG,
  meta: MetaSVG,
  grok: GrokSVG,
  qwen: QwenSVG,
}

export default function ProviderIcon({ provider, size = "md", className }: ProviderIconProps) {
  const Icon = iconsMap[provider as keyof typeof iconsMap];

  return (
    <Icon width={sizeMap[size]} height={sizeMap[size]} className={cn("text-accent-foreground", className)} />
  )
}
