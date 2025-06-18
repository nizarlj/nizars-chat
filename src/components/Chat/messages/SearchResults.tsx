import { GoogleGenerativeAIProviderMetadata } from '@ai-sdk/google';
import { Search, ExternalLink, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SearchResultsProps {
  metadata: any;
}

interface Source {
  title?: string | undefined;
  url: string;
}

export default function SearchResults({ metadata }: SearchResultsProps) {
  const googleMetadata = metadata?.google as GoogleGenerativeAIProviderMetadata | undefined;
  const groundingMetadata = googleMetadata?.groundingMetadata;
  const openRouterSources = metadata?.sources as any[] | undefined;

  let sources: Source[] = [];
  if (groundingMetadata?.groundingChunks) {
    sources = groundingMetadata.groundingChunks
      .filter(chunk => 'web' in chunk && chunk.web?.uri)
      .map(chunk => ({
        url: (chunk as any).web.uri!,
        title: (chunk as any).web.title,
      }));
  } else if (openRouterSources) {
    sources = openRouterSources.map(source => ({
      url: source.url,
      title: source.title,
    }));
  }

  if (sources.length === 0) return null;
  const webSearchQueries = groundingMetadata?.webSearchQueries;

  return (
    <Collapsible defaultOpen={false} className="border rounded-lg bg-muted/30">
      <CollapsibleTrigger className="cursor-pointer group w-full flex items-center justify-start gap-2 p-3 h-auto font-normal text-sm text-muted-foreground hover:text-foreground rounded-t-lg">
        <Search className="h-4 w-4" />
        <span>Search Results</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ml-auto group-data-[state=open]:rotate-180`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 border-t bg-muted/10">
        {webSearchQueries && webSearchQueries.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-2 mb-3">
            <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">Search Queries:</h4>
            {webSearchQueries.map((query, index) => (
              <div key={index} className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded">
                &quot;{query}&quot;
              </div>
            ))}
          </div>
        )}
        
        <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">Sources:</h4>
        <div className="flex flex-wrap gap-2">
          {sources.map((source, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-background/60 hover:bg-background/90 border border-border/70 rounded-full px-2.5 py-1 flex items-center gap-1.5 transition-colors"
                >
                  <span>{source.title ?? new URL(source.url).hostname}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              </TooltipTrigger>
              <TooltipContent className="max-w-[500px]">
                <p className="w-full truncate">{source.url}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
} 