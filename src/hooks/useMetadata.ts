"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouterNavigation } from "./useRouterNavigation";
import { getPathMetadata, getDynamicPathConfig, type PathDataContext } from "@/lib/paths";

export function useMetadata() {
  const { pathname, threadId, settingsTab } = useRouterNavigation();
  
  // Determine if we need to fetch thread data
  const dynamicMatch = getDynamicPathConfig(pathname);
  const isThreadPage = dynamicMatch?.config.path === "/thread/:threadId";
  const isSharePage = dynamicMatch?.config.path === "/share/:threadId";
  
  // Fetch private thread data if we're on a thread page
  const thread = useQuery(
    api.threads.getThread,
    isThreadPage && threadId ? { threadId } : "skip"
  );

  // Fetch public thread data if we're on a share page
  const publicThread = useQuery(
    api.threads.getPublicThread,
    isSharePage && threadId ? { threadId } : "skip"
  );

  useEffect(() => {
    const dataContext: PathDataContext = {
      ...(thread && {
        thread: {
          userTitle: thread.userTitle,
          title: thread.title,
          _id: thread._id
        }
      }),
      ...(publicThread && {
        publicThread: {
          thread: {
            userTitle: publicThread.thread.userTitle,
            title: publicThread.thread.title,
            _id: publicThread.thread._id
          }
        }
      }),
      ...(settingsTab && { tab: settingsTab })
    };

    const { title, description } = getPathMetadata(pathname, dataContext);
    document.title = title;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    const updateOrCreateMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) {
        meta.setAttribute("content", content);
      } else {
        meta = document.createElement("meta");
        meta.setAttribute("property", property);
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
      }
    };

    updateOrCreateMeta("og:title", title);
    updateOrCreateMeta("og:description", description);
    updateOrCreateMeta("og:type", "website");
    
    const updateOrCreateTwitterMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (meta) {
        meta.setAttribute("content", content);
      } else {
        meta = document.createElement("meta");
        meta.setAttribute("name", name);
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
      }
    };

    updateOrCreateTwitterMeta("twitter:card", "summary");
    updateOrCreateTwitterMeta("twitter:title", title);
    updateOrCreateTwitterMeta("twitter:description", description);

  }, [pathname, thread, publicThread, threadId, settingsTab]);

  return { pathname, threadId, settingsTab };
} 