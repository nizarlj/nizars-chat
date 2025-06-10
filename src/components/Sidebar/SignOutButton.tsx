import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const { signOut } = useAuthActions();

  return (
    <Button onClick={() => signOut()} variant="outline" size="sm" className="w-full">
      Sign Out
    </Button>
  )
}
