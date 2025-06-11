"use client";

import { Search } from "lucide-react";
import { useChatConfig } from "./ChatLayout";
import { Button } from "@/components/ui/button";

export default function SearchToggle() {
  const { modelParams, updateParam } = useChatConfig();

  const isSearchEnabled = modelParams.includeSearch ?? false;

  return (
    <Button
      variant={isSearchEnabled ? "default" : "outline"}
      onClick={() => updateParam('includeSearch', !isSearchEnabled)}
      className="border-1"
    >
      <Search className="h-4 w-4" />
      Search
    </Button>
  );
} 