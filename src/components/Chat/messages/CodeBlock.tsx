"use client";

import { useState, useCallback, memo, useRef, useMemo } from "react";
import { Copy, Check, WrapText, AlignLeft } from "lucide-react";
import { cn, scrollbarStyle } from "@/lib/utils";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";	

import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/Chat/shared";

interface CodeBlockProps {
  language?: string;
  children: string;
  className?: string;
  showHeader?: boolean;
  filename?: string;
  url?: string;
}

const registeredLanguages = hljs.listLanguages();

function getFileExtension(language?: string): string {
  if (!language) return "txt";
  const normalizedLang = language.toLowerCase().trim();
  
  // Comprehensive mapping for common languages (only when language != extension)
  const commonExtensions: Record<string, string> = {
    // Web languages
    javascript: "js",
    typescript: "ts",
    
    // Popular programming languages
    python: "py",
    "c++": "cpp",
    "c#": "cs",
    csharp: "cs",
    ruby: "rb",
    rust: "rs",
    
    // Functional languages
    haskell: "hs",
    clojure: "clj",
    erlang: "erl",
    elixir: "ex",
    fsharp: "fs",
    "f#": "fs",
    
    // Data formats
    yaml: "yml",
    
    // Shell/scripting
    bash: "sh",
    shell: "sh",
    powershell: "ps1",
    batch: "bat",
    
    // SQL
    mysql: "sql",
    postgresql: "sql",
    sqlite: "sql",
    
    // Markup/documentation
    markdown: "md",
    latex: "tex",
    
    // Specialized
    dockerfile: "dockerfile",
    makefile: "makefile",
    cmake: "cmake",
    matlab: "m",
    perl: "pl",
    assembly: "asm",
    "visual-basic": "vb",
    
    // Modern languages
    crystal: "cr",
    julia: "jl",
    ocaml: "ml",
    reason: "re",
    purescript: "purs",
  };
  
  if (commonExtensions[normalizedLang]) return commonExtensions[normalizedLang];
  const cleanLang = normalizedLang.replace(/[^a-z0-9]/g, "");
  return cleanLang || "txt";
}

const CodeBlock = memo(function CodeBlock({ language, children, className, showHeader = true, filename: customFilename, url }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isWrapped, setIsWrapped] = useState(false);
  const codeRef = useRef<HTMLElement>(null);
  
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  const toggleWrap = useCallback(() => {
    setIsWrapped(prev => !prev);
  }, []);

  const highlightedCode = useMemo(() => {
    try {
      let result;
      if (language && registeredLanguages.includes(language)) {
        // Try to highlight with specified language first
        result = hljs.highlight(children, { language, ignoreIllegals: true });
      } else {
        // Auto-detect language
        result = hljs.highlightAuto(children);
      }
      return result.value;
    } catch {
      // Fallback to plain text if highlighting fails
      return children;
    }
  }, [children, language]);

  const downloadUrl = useMemo(() => {
    const blob = new Blob([children], { type: "text/plain" });
    return URL.createObjectURL(blob);
  }, [children]);

  const defaultFilename = useMemo(() => {
    const fileExtension = getFileExtension(language);
    return `code.${fileExtension}`;
  }, [language]);

  const finalFilename = customFilename || defaultFilename;

  return (
    <TooltipProvider>
      <div className="relative">
        {showHeader && (
          <div className="flex items-center justify-between bg-muted/50 px-4 py-1 text-muted-foreground rounded-t-md">
            <span className="font-medium">{language || "auto"}</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleWrap}
                variant="ghost"
                size="icon"
                tooltip={isWrapped ? "Disable text wrapping" : "Enable text wrapping"}
              >
                {isWrapped ? <WrapText className="h-4 w-4" /> : <AlignLeft className="h-4 w-4" /> }
              </Button>
              
              <DownloadButton url={url || downloadUrl} filename={finalFilename} />
              
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="icon"
                tooltip={copied ? "Copied!" : "Copy"}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
        <pre 
          className={cn(
            "p-4 bg-muted/20 overflow-x-auto !rounded-t-none !m-0",
            isWrapped && "whitespace-pre-wrap break-words overflow-x-visible",
            scrollbarStyle,
            className
          )}
        >
          <code 
            ref={codeRef}
            className="block"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
      </div>
    </TooltipProvider>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.language === nextProps.language &&
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
  );
});

export default CodeBlock; 