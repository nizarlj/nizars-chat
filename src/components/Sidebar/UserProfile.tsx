"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, ChevronUp, LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Link } from "react-router-dom";
import { useCachedUser } from "@/hooks/useCachedUser";

export function UserProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useCachedUser();

  const handleSignOut = () => {
    authClient.signOut();
    setIsOpen(false);
  };

  // Show login button when not authenticated
  if (!user) {
    return (
      <Link to="/auth" className="w-full">
        <Button 
          variant="outline" 
          className="w-full justify-center h-auto p-3"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      </Link>
    );
  }

  // Show user profile when authenticated
  const initials = user?.name?.charAt(0) || "U";

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between h-auto p-3 hover:bg-muted/50"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs text-muted-foreground">Manage account</span>
            </div>
          </div>
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-56" 
        align="end" 
        side="top"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/settings" className="w-full cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 