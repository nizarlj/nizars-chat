"use client";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuthActions } from "@convex-dev/auth/react";

export default function AuthPage() {
  const { signIn } = useAuthActions();
  
  return (
    <div className="flex-1 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">
            Click the button below to sign in anonymously
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="submit" className="w-full hover:cursor-pointer" onClick={() => signIn("anonymous")}>
            Sign in anonymously
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
