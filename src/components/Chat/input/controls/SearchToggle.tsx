"use client";

import { Search } from "lucide-react";
import { useChatConfig } from "@/components/Chat/context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

export default function SearchToggle() {
  const { modelParams, updateParam } = useChatConfig();
  const isMobile = useIsMobile();

  const isSearchEnabled = modelParams.includeSearch ?? false;

  return (
    <Button
      variant={isSearchEnabled ? "default" : "outline"}
      onClick={() => updateParam('includeSearch', !isSearchEnabled)}
      size={isMobile ? "sm" : "default"}
      className="border-1"
      tooltip={isSearchEnabled ? "Disable web search" : "Enable web search"}
    >
      <Search className="h-4 w-4" />
      {!isMobile && "Search"}
    </Button>
  );
} 