"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsTab, ModelsTab, ApiKeysTab, AttachmentsTab } from "@/components/Settings";
import { ModelManagerProvider } from "@/components/Providers/ModelManagerProvider";
import { AttachmentsManagerProvider } from "@/components/Providers/AttachmentsManagerProvider";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("stats");

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <StatsTab />
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <ModelManagerProvider>
            <ModelsTab />
          </ModelManagerProvider>
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="attachments" className="mt-6">
          <AttachmentsManagerProvider>
            <AttachmentsTab />
          </AttachmentsManagerProvider>
        </TabsContent>
      </Tabs>
    </div>
  );
} 