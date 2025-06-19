"use client";

import { SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouterPathname } from "@/hooks/useRouterNavigation";
import { cn } from "@/lib/utils";

// damn
export function NewChatButton() {
  const pathname = useRouterPathname();
  const shouldAppearSelected = pathname === "/";

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="p-0 hover:bg-transparent">
            <Link to="/" className="w-full h-fit">
              <Button 
                className={cn(
                  "w-full flex items-center gap-2 transition-all duration-300 glow-on-hover",
                  shouldAppearSelected 
                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                    : "gradient-bg hover:bg-primary/5 border-primary/20"
                )}
                variant={shouldAppearSelected ? "default" : "outline"}
                tooltip="Start a new conversation"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
