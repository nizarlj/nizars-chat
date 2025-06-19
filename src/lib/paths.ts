export interface PathConfig {
  path: string;
  title: string;
  description: string;
  generateTitle?: (data: PathDataContext) => string;
  generateDescription?: (data: PathDataContext) => string;
}

export interface DynamicPathConfig extends PathConfig {
  matcher: RegExp;
  extractParams: (pathname: string) => Record<string, string> | null;
}

// Type for data context passed to path metadata functions
export interface PathDataContext {
  thread?: {
    userTitle?: string;
    title: string;
    _id: string;
  };
  publicThread?: {
    thread: {
      userTitle?: string;
      title: string;
      _id: string;
    };
  };
  tab?: string;
}

// Static paths configuration
export const STATIC_PATHS: Record<string, PathConfig> = {
  home: {
    path: "/",
    title: "Nizar's Chat - New Conversation",
    description: "Start a new conversation with AI models"
  },
  auth: {
    path: "/auth",
    title: "Sign In - Nizar's Chat",
    description: "Sign in to your Nizar's Chat account"
  },
  gallery: {
    path: "/gallery",
    title: "Gallery - Nizar's Chat",
    description: "View generated images and media from your conversations"
  },
  settings: {
    path: "/settings",
    title: "Settings - Nizar's Chat",
    description: "Manage your settings and preferences"
  }
};

// Settings tab configurations
export const SETTINGS_TABS: Record<string, { title: string; description: string }> = {
  general: {
    title: "General",
    description: "General app settings and keyboard shortcuts"
  },
  stats: {
    title: "Statistics",
    description: "View your usage statistics and analytics"
  },
  models: {
    title: "Models",
    description: "Manage your AI models and preferences"
  },
  "api-keys": {
    title: "API Keys",
    description: "Manage your API keys and integrations"
  },
  attachments: {
    title: "Attachments",
    description: "Manage your file attachments and storage"
  },
  appearance: {
    title: "Appearance",
    description: "Customize the app's appearance and theme"
  }
};

// Dynamic paths configuration
export const DYNAMIC_PATHS: DynamicPathConfig[] = [
  {
    path: "/thread/:threadId",
    matcher: /^\/thread\/([^\/]+)$/,
    title: "Thread - Nizar's Chat",
    description: "View conversation thread",
    extractParams: (pathname: string) => {
      const match = pathname.match(/^\/thread\/([^\/]+)$/);
      return match ? { threadId: match[1] } : null;
    },
    generateTitle: (data: PathDataContext) => {
      if (data.thread) {
        const threadTitle = data.thread.userTitle || data.thread.title;
        return `${threadTitle} - Nizar's Chat`;
      }
      return "Thread - Nizar's Chat";
    },
    generateDescription: (data: PathDataContext) => {
      if (data.thread) {
        const threadTitle = data.thread.userTitle || data.thread.title;
        return `Conversation: ${threadTitle.substring(0, 100)}${threadTitle.length > 100 ? "..." : ""}`;
      }
      return "View conversation thread";
    }
  },
  {
    path: "/share/:threadId",
    matcher: /^\/share\/([^\/]+)$/,
    title: "Shared Conversation - Nizar's Chat",
    description: "View shared conversation thread",
    extractParams: (pathname: string) => {
      const match = pathname.match(/^\/share\/([^\/]+)$/);
      return match ? { threadId: match[1] } : null;
    },
    generateTitle: (data: PathDataContext) => {
      if (data.publicThread?.thread) {
        const threadTitle = data.publicThread.thread.userTitle || data.publicThread.thread.title;
        return `${threadTitle} - Shared Conversation`;
      }
      return "Shared Conversation - Nizar's Chat";
    },
    generateDescription: (data: PathDataContext) => {
      if (data.publicThread?.thread) {
        const threadTitle = data.publicThread.thread.userTitle || data.publicThread.thread.title;
        return `Shared conversation: ${threadTitle.substring(0, 100)}${threadTitle.length > 100 ? "..." : ""}`;
      }
      return "View shared conversation thread";
    }
  },
  {
    path: "/settings/:tab",
    matcher: /^\/settings\/([^\/]+)$/,
    title: "Settings - Nizar's Chat",
    description: "Manage your settings and preferences",
    extractParams: (pathname: string) => {
      const match = pathname.match(/^\/settings\/([^\/]+)$/);
      return match ? { tab: match[1] } : null;
    },
    generateTitle: (data: PathDataContext) => {
      const tabConfig = data.tab ? SETTINGS_TABS[data.tab] : null;
      const tabTitle = tabConfig?.title || "Settings";
      return `${tabTitle} - Nizar's Chat`;
    },
    generateDescription: (data: PathDataContext) => {
      const tabConfig = data.tab ? SETTINGS_TABS[data.tab] : null;
      return tabConfig?.description || "Manage your settings and preferences";
    }
  }
];

// Helper functions
export function getStaticPathConfig(pathname: string): PathConfig | null {
  const config = Object.values(STATIC_PATHS).find(p => p.path === pathname);
  return config || null;
}

export function getDynamicPathConfig(pathname: string): { config: DynamicPathConfig; params: Record<string, string> } | null {
  for (const config of DYNAMIC_PATHS) {
    const params = config.extractParams(pathname);
    if (params) {
      return { config, params };
    }
  }
  return null;
}

export function getPathMetadata(pathname: string, data?: PathDataContext): { title: string; description: string } {
  // Check static paths first
  const staticConfig = getStaticPathConfig(pathname);
  if (staticConfig) {
    return {
      title: staticConfig.title,
      description: staticConfig.description
    };
  }

  // Check dynamic paths
  const dynamicMatch = getDynamicPathConfig(pathname);
  if (dynamicMatch) {
    const { config, params } = dynamicMatch;
    const contextData = { ...params, ...data };
    
    return {
      title: config.generateTitle ? config.generateTitle(contextData) : config.title,
      description: config.generateDescription ? config.generateDescription(contextData) : config.description
    };
  }

  // Default fallback
  return {
    title: "Nizar's Chat",
    description: "AI-powered chat application with multiple model support"
  };
} 