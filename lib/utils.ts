import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDurationFlexibly(seconds: number): string {
  if (seconds <= 0) return "0d"
  
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}j ${mins}m`
  } else if (mins > 0) {
    if (secs > 0) {
      return `${mins}m ${secs}d`
    }
    return `${mins}m`
  } else {
    return `${secs}d`
  }
}
