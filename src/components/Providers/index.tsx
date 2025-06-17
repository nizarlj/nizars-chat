import { SidebarProvider } from "@/components/ui/sidebar";
import ConvexProvider from "./ConvexProvider";
import { ThemeProvider } from "./ThemeProvider";
import { UserPreferencesProvider } from "./UserPreferencesProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider>
      <UserPreferencesProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </UserPreferencesProvider>
    </ConvexProvider>
  );
}