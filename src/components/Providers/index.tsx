import { SidebarProvider } from "@/components/ui/sidebar";
import ConvexProvider from "./ConvexProvider";
import { ThemeProvider } from "./ThemeProvider";
import { UserPreferencesProvider } from "./UserPreferencesProvider";
import { Toaster } from "../ui/sonner";

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
          <SidebarProvider>
            <UserPreferencesProvider>
                {children}
            </UserPreferencesProvider>
          </SidebarProvider>
        </ThemeProvider>
    </ConvexProvider>
  );
}