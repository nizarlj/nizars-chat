"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client";

import dynamicImport from "next/dynamic";
const ClientLayout = dynamicImport(() => import("@/components/ClientLayout"), { ssr: false });

export const dynamic = "force-static";

export default function AuthPage() {
  const [showSignIn, setShowSignIn] = useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    if (showSignIn) {
      await authClient.signIn.email(
        {
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        },
        {
          onError: (ctx) => {
            window.alert(ctx.error.message);
          },
        }
      );
    } else {
      await authClient.signUp.email(
        {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        },
        {
          onError: (ctx) => {
            window.alert(ctx.error.message);
          },
        }
      );
    }
  };

  return (
    <ClientLayout paths={["/auth"]}>
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
          <CardTitle className="text-center">
            {showSignIn ? "Sign in to your account" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-center">
            {showSignIn 
              ? "Enter your email and password to sign in" 
              : "Enter your details to create an account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!showSignIn && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your name" required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="your@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Password" required />
            </div>
            <Button type="submit" className="w-full">
              {showSignIn ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              {showSignIn ? "Don't have an account? " : "Already have an account? "}
            </span>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm"
              onClick={() => setShowSignIn(!showSignIn)}
            >
              {showSignIn ? "Sign up" : "Sign in"}
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}
