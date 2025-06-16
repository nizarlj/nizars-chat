"use client";

import { SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import InstantLink from "@/components/ui/InstantLink";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useInstantPathname } from "@/hooks/useInstantNavigation";
import { cn } from "@/lib/utils";

// damn
export function NewChatButton() {
  const instantPathname = useInstantPathname();
  const shouldAppearSelected = instantPathname === "/";

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="p-0 hover:bg-transparent">
            <InstantLink href="/" className="w-full h-fit">
              <Button 
                className={cn(
                  "w-full flex items-center gap-2",
                  shouldAppearSelected ? "bg-accent text-accent-foreground" : ""
                )}
                variant={shouldAppearSelected ? "secondary" : "outline"}
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </InstantLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
