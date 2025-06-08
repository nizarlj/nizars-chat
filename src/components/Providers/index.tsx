import { SidebarProvider } from "@/components/ui/sidebar";
import ConvexProvider from "./ConvexProvider";
import { ThemeProvider } from "./ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider>
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
    </ConvexProvider>
  );
}