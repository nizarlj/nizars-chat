"use client";

import { useState } from "react";
import { Brain } from "lucide-react";
import { useChatContext } from "./ChatLayout";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ReasoningEffortSelector() {
  const { modelParams, updateParam } = useChatContext();
  const [open, setOpen] = useState(false);

  const currentEffort = modelParams.reasoningEffort ?? 'medium';

  const efforts = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ] as const;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Brain className="h-4 w-4" />
          {efforts.find(e => e.value === currentEffort)?.label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-32 p-1" align="start">
          <div className="flex flex-col gap-2">
            {efforts.map((effort) => (
              <Button 
                key={effort.value}
                variant="secondary"
                className="justify-start"
                onClick={() => {
                  updateParam('reasoningEffort', effort.value);
                  setOpen(false);
                }}
              >
                {effort.label}
              </Button>
            ))}
          </div>
      </PopoverContent>
    </Popover>
  );
} 