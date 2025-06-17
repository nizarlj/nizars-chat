"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type BaseModelPropertyDefinition } from "@/lib/models";
import { cn } from "@/lib/utils";

interface ModelPropertyProps {
  property: BaseModelPropertyDefinition;
  iconOnly?: boolean;
  enableBackground?: boolean;
  className?: string;
}

export default function ModelProperty({ property, iconOnly = false, enableBackground = true, className }: ModelPropertyProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex rounded-sm p-1 items-center gap-1 cursor-pointer", 
            !iconOnly && "px-2",
            enableBackground && property.backgroundColor,
            className,
          )}>
            <property.icon 
              className={cn("h-3 w-3", property.textColor)} 
            />

            {!iconOnly && (
              <span className={cn("text-xs font-medium", property.textColor)}>
                {property.name}
              </span>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs font-medium">{property.description}</p>
        </TooltipContent>
    </Tooltip>
  );
} 