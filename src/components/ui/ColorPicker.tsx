"use client"

import { Check } from "lucide-react"

export const FOLDER_COLORS = [
  "#f44336", // red
  "#e91e63", // pink
  "#9c27b0", // purple
  "#673ab7", // deep purple
  "#3f51b5", // indigo
  "#2196f3", // blue
  "#03a9f4", // light blue
  "#00bcd4", // cyan
  "#009688", // teal
  "#4caf50", // green
  "#8bc34a", // light green
  "#cddc39", // lime
  "#ffeb3b", // yellow
  "#ffc107", // amber
  "#ff9800", // orange
  "#ff5722", // deep orange
  "#795548", // brown
  "#9e9e9e", // grey
]

interface ColorPickerProps {
  selectedColor: string | undefined
  onSelectColor: (color: string) => void
}

export function ColorPicker({ selectedColor, onSelectColor }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {FOLDER_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="w-8 h-8 rounded-full border flex items-center justify-center"
          style={{ backgroundColor: color }}
          onClick={() => onSelectColor(color)}
        >
          {selectedColor === color && <Check className="w-5 h-5 text-white" />}
        </button>
      ))}
    </div>
  )
} 