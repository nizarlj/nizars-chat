"use client";

import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";
import { useInstantNavigation } from "@/hooks/useInstantNavigation";
import { cn } from "@/lib/utils";

interface InstantLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  instant?: boolean;
}

export default function InstantLink({ 
  children, 
  className,
  instant = true,
  href,
  ...props 
}: InstantLinkProps) {
  const { navigateInstantly, isNavigating } = useInstantNavigation();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (instant && typeof href === 'string' && href.startsWith('/')) {
      e.preventDefault();
      navigateInstantly(href);
    }
  };

  return (
    <Link 
      {...props} 
      href={href}
      className={cn(
        className,
        isNavigating && "opacity-75 transition-opacity duration-200"
      )}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
} 