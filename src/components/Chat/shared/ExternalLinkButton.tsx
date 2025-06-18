import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ExternalLinkButtonProps {
  url: string;
  className?: string;
  tooltip?: string;
}

export default function ExternalLinkButton({ url, className, tooltip = "Open in new tab" }: ExternalLinkButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={className}
      tooltip={tooltip}
    >
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
        <ExternalLink className="w-4 h-4" />
      </a>
    </Button>
  );
}