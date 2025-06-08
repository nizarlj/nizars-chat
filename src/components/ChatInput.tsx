"use client"

import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { SendIcon } from "lucide-react"
import ModelSelector from "./ModelSelector"

export default function ChatInput() {
  return (
    <div className="w-full flex flex-col items-center gap-4 bg-card p-4 rounded-t-md">
      <Textarea placeholder="Ask me anything..." variant="chat" />

      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center justify-start gap-2 flex-1">
          <ModelSelector />
        </div>

        <Button className="hover:cursor-pointer">
          <SendIcon />
        </Button>
      </div>
    </div>
  )
}
