import Link, { LinkProps } from "next/link";
import { ReactNode } from "react";

interface CustomLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
}

export default function CustomLink({ 
  children, 
  className, 
  ...props 
}: CustomLinkProps) {
  return (
    <Link {...props} className={className}>
      {children}
    </Link>
  );
} 