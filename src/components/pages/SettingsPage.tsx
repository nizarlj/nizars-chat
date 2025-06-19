"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  StatsTab,
  ModelsTab,
  ApiKeysTab,
  AttachmentsTab,
  AppearanceTab,
} from "@/components/Settings";
import { ModelManagerProvider } from "@/components/Providers/ModelManagerProvider";
import { AttachmentsManagerProvider } from "@/components/Providers/AttachmentsManagerProvider";

const validTabs = ["stats", "models", "api-keys", "attachments", "appearance"];

export default function SettingsPage() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  
  const initialTab = tab && validTabs.includes(tab) ? tab : "stats";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else if (tab && !validTabs.includes(tab)) {
      navigate("/settings/stats", { replace: true });
    } else if (!tab) {
      navigate("/settings/stats", { replace: true });
    }
  }, [tab, navigate]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    navigate(`/settings/${newTab}`, { replace: true });
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
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

        <TabsContent value="appearance" className="mt-6">
          <AppearanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
} 