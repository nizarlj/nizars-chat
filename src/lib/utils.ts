import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const scrollbarStyle = "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-accent scrollbar-thumb-rounded-md scrollbar-gutter-stable";