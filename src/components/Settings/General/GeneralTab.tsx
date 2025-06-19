"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyboardShortcuts } from "@/components/Header";
import { Keyboard, Info } from "lucide-react";

export function GeneralTab() {
  return (
    <div className="space-y-6">
      {/* Keyboard Shortcuts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
          </div>
          <CardDescription>
            Use keyboard shortcuts to navigate and interact with the app more efficiently.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">View Shortcuts</p>
              <p className="text-sm text-muted-foreground">
                See all available keyboard shortcuts and their functions
              </p>
            </div>
            <KeyboardShortcuts />
          </div>
        </CardContent>
      </Card>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Application Information</CardTitle>
          </div>
          <CardDescription>
            General information about Nizar&apos;s Chat application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Multiple AI model support</li>
                  <li>• File attachments (PDF, images, text)</li>
                  <li>• Search across conversations</li>
                  <li>• Organized folders and threads</li>
                  <li>• Keyboard shortcuts</li>
                  <li>• Dark/light theme support</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Navigation Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use Ctrl+Shift+O to start a new chat</li>
                  <li>• Press Ctrl+K to focus the search</li>
                  <li>• Use Ctrl+M to open model selector</li>
                  <li>• Press Ctrl+B to toggle the sidebar</li>
                  <li>• Use Ctrl+, to open settings</li>
                  <li>• Use Ctrl+G to open gallery</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 