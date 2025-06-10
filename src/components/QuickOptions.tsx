import React from 'react'
import { SidebarTrigger } from './ui/sidebar'

export default function QuickOptions() {
  return (
    <div className="absolute top-0 left-0 p-2 z-50">
      <div className="flex justify-center items-center h-10 pt-1">
        <SidebarTrigger />
      </div>
    </div>
  )
}
