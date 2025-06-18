import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DownloadButtonProps {
  url: string;
  filename: string;
  className?: string;
  tooltip?: string;
}

export default function DownloadButton({ url, filename, className, tooltip = "Download" }: DownloadButtonProps) {
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
    <Button variant="ghost" size="icon" onClick={handleDownload} className={className} tooltip={tooltip}>
      <Download className="w-4 h-4" />
    </Button>
  );
}