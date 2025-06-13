import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DownloadButtonProps {
  url: string;
  filename: string;
  className?: string;
}

export default function DownloadButton({ url, filename, className }: DownloadButtonProps) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        // error toast
      } 
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a); 
      URL.revokeObjectURL(blobUrl);
    } catch {
      // error toast
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={handleDownload} className={className}>
          <Download className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Download
      </TooltipContent>
    </Tooltip>
  );
}