import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ExternalLinkButtonProps {
  url: string;
  className?: string;
}

export default function ExternalLinkButton({ url, className }: ExternalLinkButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
          <Button variant="ghost" size="icon" className={className}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        </a>
      </TooltipTrigger>
      <TooltipContent>
        Open in new tab
      </TooltipContent>
    </Tooltip>
  );
}