import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Span } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(microseconds: number): string {
  if (microseconds < 1000) {
    return `${microseconds.toFixed(0)}μs`
  } else if (microseconds < 1000000) {
    return `${(microseconds / 1000).toFixed(2)}ms`
  } else {
    return `${(microseconds / 1000000).toFixed(2)}s`
  }
}

export function formatTimestamp(microseconds: number): string {
  const date = new Date(microseconds / 1000); // 将微秒转换为毫秒
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份从 0 开始，加 1 并补零
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  // 返回格式化的时间字符串
  return `${year}-${month}-${day}.${hours}:${minutes}:${seconds}:${milliseconds}`;
}

export function getSpanColor(span: Span): string {
  if (span.hasError) {
    return "#f87171" // red-400
  }

  // Generate a consistent hex color based on the service name
  return generateServiceColor(span.serviceName)
}

function generateServiceColor(serviceName: string): string {
  // Simple hash function to generate a consistent number from service name
  let hash = 0
  for (let i = 0; i < serviceName.length; i++) {
    const char = serviceName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Use the hash to generate HSL values for better color variety
  const hue = Math.abs(hash) % 360
  const saturation = 65 + (Math.abs(hash) % 20) // 65-85% saturation
  const lightness = 50 + (Math.abs(hash) % 15) // 50-65% lightness

  // Convert HSL to RGB then to hex
  return hslToHex(hue, saturation, lightness)
}

function hslToHex(h: number, s: number, l: number): string {
  // Convert HSL to RGB
  const sNorm = s / 100
  const lNorm = l / 100

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lNorm - c / 2

  let r = 0,
      g = 0,
      b = 0

  if (0 <= h && h < 60) {
    r = c
    g = x
    b = 0
  } else if (60 <= h && h < 120) {
    r = x
    g = c
    b = 0
  } else if (120 <= h && h < 180) {
    r = 0
    g = c
    b = x
  } else if (180 <= h && h < 240) {
    r = 0
    g = x
    b = c
  } else if (240 <= h && h < 300) {
    r = x
    g = 0
    b = c
  } else if (300 <= h && h < 360) {
    r = c
    g = 0
    b = x
  }

  // Convert to 0-255 range and then to hex
  const rHex = Math.round((r + m) * 255)
      .toString(16)
      .padStart(2, "0")
  const gHex = Math.round((g + m) * 255)
      .toString(16)
      .padStart(2, "0")
  const bHex = Math.round((b + m) * 255)
      .toString(16)
      .padStart(2, "0")

  return `#${rHex}${gHex}${bHex}`
}
