"use client";

import { memo, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { remark } from "remark";
import remarkStringify from "remark-stringify";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";
import type { Root } from "mdast";
import { CodeBlock } from ".";

interface MarkdownMessageProps {
  content: string;
  className?: string;
  messageId?: string;
  isStreaming?: boolean;
}

// Cache for processed AST to avoid re-parsing identical content
const astCache = new Map<string, Root>();
const chunksCache = new Map<string, string[]>();
const componentsCache = new Map<string, Components>();

function createSemanticChunks(content: string): string[] {
  const cacheKey = content;
  
  if (chunksCache.has(cacheKey)) {
    return chunksCache.get(cacheKey)!;
  }

  try {
    const processor = remark().use(remarkGfm).use(remarkStringify);
    
    // Check AST cache first
    let ast: Root;
    if (astCache.has(content)) {
      ast = astCache.get(content)!;
    } else {
      ast = processor.parse(content) as Root;
      astCache.set(content, ast);
      
      if (astCache.size > 100) {
        const firstKey = astCache.keys().next().value;
        if (firstKey) astCache.delete(firstKey);
      }
    }

    const chunks: string[] = [];
    for (const node of ast.children) {
      const chunkAst: Root = { type: 'root', children: [node] };
      const chunkContent = processor.stringify(chunkAst).trim();
      if (chunkContent) {
        chunks.push(chunkContent);
      }
    }

    const result = chunks.length > 0 ? chunks : [content];
    
    // Cache the result
    chunksCache.set(cacheKey, result);
    
    // Limit cache size
    if (chunksCache.size > 50) {
      const firstKey = chunksCache.keys().next().value;
      if (firstKey) chunksCache.delete(firstKey);
    }
    
    return result;
  } catch (error) {
    console.warn('Failed to create semantic chunks, falling back to original content:', error);
    return [content];
  }
}

function getComponents(messageId?: string): Components {
  const cacheKey = messageId || 'default';
  
  if (componentsCache.has(cacheKey)) {
    return componentsCache.get(cacheKey)!;
  }

  const components: Components = {
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      
      if (match && className?.startsWith("language-")) {
        return (
          <CodeBlock language={match[1]}>
            {String(children).replace(/\n$/, "")}
          </CodeBlock>
        );
      }
      
      return (
        <code className={cn("px-1.5 py-0.5 rounded bg-muted/50 text-sm font-mono", className)} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children }) => {
      return <div className="my-4">{children}</div>;
    },
    a: ({ children, href, ...props }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary hover:underline"
        {...props}
      >
        {children}
      </a>
    ),
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-border" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th className="border border-border px-4 py-2 bg-muted/50 font-semibold text-left" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="border border-border px-4 py-2" {...props}>
        {children}
      </td>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4" {...props}>
        {children}
      </blockquote>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-inside space-y-1 my-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
        {children}
      </ol>
    ),
    p: ({ children, ...props }) => (
      <p className="my-2" {...props}>
        {children}
      </p>
    ),
  };

  componentsCache.set(cacheKey, components);
  
  if (componentsCache.size > 20) {
    const firstKey = componentsCache.keys().next().value;
    if (firstKey) componentsCache.delete(firstKey);
  }

  return components;
}

const MarkdownChunk = memo(function MarkdownChunk({ 
  content, 
  components,
}: { 
  content: string; 
  components: Components;
}) {
  const renderCount = useRef(0);
  renderCount.current++;
  
  const plugins = useMemo(() => [remarkGfm], []);

  return (
    <ReactMarkdown
      remarkPlugins={plugins}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}, (prevProps, nextProps) => {
  const isEqual = prevProps.content === nextProps.content && 
         prevProps.components === nextProps.components;
  
  return isEqual;
});

const MarkdownMessage = memo(function MarkdownMessage({ content, className, messageId, isStreaming }: MarkdownMessageProps) {
  const components = useMemo(() => getComponents(messageId), [messageId]);

  const chunks = useMemo(() => {
    if (!isStreaming || content.length < 200) {
      return [content];
    }

    return createSemanticChunks(content);
  }, [content, isStreaming]);

  const chunkData = useMemo(() => {
    return chunks.map((chunk, index) => ({
      content: chunk,
      index,
      key: `${messageId}-${index}-${chunk.slice(0, 50).replace(/\s/g, '')}`
    }));
  }, [chunks, messageId]);

  return (
    <div className={cn("prose prose-base max-w-none dark:prose-invert break-words", className)}>
      {chunkData.map((chunk) => (
        <MarkdownChunk
          key={chunk.key}
          content={chunk.content}
          components={components}
        />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.className === nextProps.className &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.isStreaming === nextProps.isStreaming
  );
});

export default MarkdownMessage; 