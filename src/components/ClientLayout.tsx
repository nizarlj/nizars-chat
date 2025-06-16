import Providers from "@/components/Providers";
import RouteCorrecter from "@/components/RouteCorrecter";
import AppSidebar from "@/components/Sidebar";
import QuickOptions from "@/components/QuickOptions";
import { cn, scrollbarStyle } from "@/lib/utils";
import ChatLayout from "./Chat/ChatLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <RouteCorrecter />
      <div className="relative flex-1 flex">
        <AppSidebar />
        <QuickOptions />

        <main className={cn("flex-1 flex overflow-y-auto", scrollbarStyle)}>
          <div className="flex-1 flex flex-col max-w-3xl mx-auto">
            <ChatLayout>
              {children}
            </ChatLayout>
          </div>
        </main>
      </div>
    </Providers>
  );
}
