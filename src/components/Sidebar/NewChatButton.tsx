import { SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import CustomLink from "@/components/ui/CustomLink";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// damn
export function NewChatButton() {
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="p-0 hover:bg-transparent">
            <CustomLink href="/" className="w-full h-fit">
              <Button 
                className="w-full flex items-center gap-2 hover:cursor-pointer"
                variant="outline"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </CustomLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
