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
                  "w-full flex items-center gap-2",
                  shouldAppearSelected ? "bg-accent text-accent-foreground" : ""
                )}
                variant={shouldAppearSelected ? "secondary" : "outline"}
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
