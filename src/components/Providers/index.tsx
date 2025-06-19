import { SidebarProvider } from "@/components/ui/sidebar";
import ConvexProvider from "./ConvexProvider";
import { ThemeProvider } from "./ThemeProvider";
import { UserPreferencesProvider } from "./UserPreferencesProvider";
import { Toaster } from "../ui/sonner";
import { TooltipProvider } from "../ui/tooltip";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          <TooltipProvider>
            <SidebarProvider>
              <UserPreferencesProvider>
                  {children}
              </UserPreferencesProvider>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
    </ConvexProvider>
  );
}