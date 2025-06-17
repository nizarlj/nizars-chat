"use client";

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Providers from "@/components/Providers";
import RouteCorrecter from "@/components/RouteCorrecter";
import AppSidebar from "@/components/Sidebar";
import QuickOptions from "@/components/QuickOptions";
import { cn, scrollbarStyle } from "@/lib/utils";
import ChatLayout from "./Chat/ChatLayout";

import ThreadPage from "@/components/pages/ThreadPage";
import AuthPage from "@/components/pages/AuthPage";
import SettingsPage from "@/components/pages/SettingsPage";

function AppContent() {
  const location = useLocation();

  return (
    <div className="relative flex-1 flex">
      <AppSidebar />
      <QuickOptions />

      <main className={cn("flex-1 flex overflow-y-auto", scrollbarStyle)}>
        <div className="flex-1 flex flex-col max-w-3xl mx-auto">
          <Routes>
            {/* Auth route */}
            <Route path="/auth" element={
              <div className="flex-1 flex flex-col">
                <AuthPage />
              </div>
            } />
            
            {/* Chat routes */}
            <Route path="/" element={
              <ChatLayout key={location.pathname}>
                <ThreadPage />
              </ChatLayout>
            } />
            <Route path="/thread/:threadId" element={
              <ChatLayout key={location.pathname}>
                <ThreadPage />
              </ChatLayout>
            } />
            
            {/* Settings route */}
            <Route path="/settings" element={
              <div className="flex-1 flex flex-col">
                <SettingsPage />
              </div>
            } />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <Providers>
        <RouteCorrecter />
        <AppContent />
      </Providers>
    </BrowserRouter>
  );
} 