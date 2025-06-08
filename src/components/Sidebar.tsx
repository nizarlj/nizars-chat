"use client"

import {
  Sidebar,
  SidebarHeader,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar className="transition-all duration-100 ease-in-out">
      <SidebarHeader>
        <div className="flex justify-center items-center h-10">
          <h1 className="text-xl font-bold">
            Nizars T3 Chat
          </h1> 
        </div>
      </SidebarHeader>
    </Sidebar>
  )
}