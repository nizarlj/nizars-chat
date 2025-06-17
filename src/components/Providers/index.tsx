import { SidebarProvider } from "@/components/ui/sidebar";
import ConvexProvider from "./ConvexProvider";
import { ThemeProvider } from "./ThemeProvider";
import { UserPreferencesProvider } from "./UserPreferencesProvider";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache";
import { Toaster } from "../ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider>
      <ConvexQueryCacheProvider>
        <UserPreferencesProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          <SidebarProvider>
              {children}
            </SidebarProvider>
          </ThemeProvider>
        </UserPreferencesProvider>
      </ConvexQueryCacheProvider>
    </ConvexProvider>
  );
}