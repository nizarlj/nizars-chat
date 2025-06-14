"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { CodeBlock } from "@/components/Chat/messages";
import { cn } from "@/lib/utils";

interface TextFilePreviewProps {
  url: string;
  fullPreview?: boolean;
  language?: string;
  showCodeHeader?: boolean;
  filename?: string;
}

const MAX_PREVIEW_LENGTH = 500;
const MAX_FULL_PREVIEW_LENGTH = 20000;

export default function TextFilePreview({ url, fullPreview = false, language = "plaintext", showCodeHeader, filename }: TextFilePreviewProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        setContent(text.slice(0, fullPreview ? MAX_FULL_PREVIEW_LENGTH : MAX_PREVIEW_LENGTH));
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [url, fullPreview]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-destructive">
        <AlertTriangle className="w-6 h-6 mr-2" />
        <p>Error loading preview</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full flex flex-col",
      fullPreview ? "h-fit" : "h-full overflow-hidden",
    )}>
      <div className={cn(
        "flex-1 min-h-0", 
        !showCodeHeader && "rounded-b-md",
        !fullPreview && "p-3"
      )}> 
        <CodeBlock 
          language={language || "plaintext"}
          showHeader={fullPreview}
          filename={filename}
          url={url}
        >
          {content}
        </CodeBlock>
      </div>
    </div>
  );
} 