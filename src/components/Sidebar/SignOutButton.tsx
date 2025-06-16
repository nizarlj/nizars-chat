import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button onClick={() => authClient.signOut()} variant="outline" size="sm" className="w-full">
      Sign Out
    </Button>
  )
}
