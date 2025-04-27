import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TimeAgo } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This is a helper function for components that don't have access to the currency context
// Dynamic components should use formatPriceWithCurrency from currencyConverter.ts instead
export function formatPrice(price: number, currencyCode: string = "GBP"): string {
  const currencyLocales: Record<string, string> = {
    GBP: "en-GB",
    EUR: "de-DE",
    USD: "en-US",
    CNY: "zh-CN",
    INR: "hi-IN",
    BRL: "pt-BR",
  };
  
  const locale = currencyLocales[currencyCode] || "en-GB";
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(price);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

export function formatCurrency(price: number, currencyCode: string = "GBP"): string {
  const currencyLocales: Record<string, string> = {
    GBP: "en-GB",
    USD: "en-US",
    EUR: "de-DE",
    JPY: "ja-JP",
    CNY: "zh-CN",
    INR: "hi-IN",
    CAD: "en-CA",
    AUD: "en-AU",
    SGD: "en-SG",
  };
  
  const locale = currencyLocales[currencyCode] || "en-US";
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "symbol",
  }).format(price);
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  let interval = seconds / 31536000; // years
  
  if (interval > 1) {
    return Math.floor(interval) + "y ago";
  }
  interval = seconds / 2592000; // months
  if (interval > 1) {
    return Math.floor(interval) + "mo ago";
  }
  interval = seconds / 86400; // days
  if (interval > 1) {
    return Math.floor(interval) + "d ago";
  }
  interval = seconds / 3600; // hours
  if (interval > 1) {
    return Math.floor(interval) + "h ago";
  }
  interval = seconds / 60; // minutes
  if (interval > 1) {
    return Math.floor(interval) + "m ago";
  }
  return Math.floor(seconds) + "s ago";
}

export function getTimeAgo(date: Date): TimeAgo {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  let interval = seconds / 31536000; // years
  
  if (interval > 1) {
    return { value: Math.floor(interval), unit: "year" };
  }
  interval = seconds / 2592000; // months
  if (interval > 1) {
    return { value: Math.floor(interval), unit: "month" };
  }
  interval = seconds / 86400; // days
  if (interval > 1) {
    return { value: Math.floor(interval), unit: "day" };
  }
  interval = seconds / 3600; // hours
  if (interval > 1) {
    return { value: Math.floor(interval), unit: "hour" };
  }
  interval = seconds / 60; // minutes
  if (interval > 1) {
    return { value: Math.floor(interval), unit: "minute" };
  }
  return { value: Math.floor(seconds), unit: "second" };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function generateAvatarFallback(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

export function getRandomColor(seed: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to hex color
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
}

export function getStarRating(rating: number): string[] {
  const totalStars = 5;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const stars: string[] = [];
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push("ri-star-fill");
  }
  
  // Add half star if needed
  if (hasHalfStar && stars.length < totalStars) {
    stars.push("ri-star-half-line");
  }
  
  // Fill in empty stars
  const emptyStars = totalStars - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    stars.push("ri-star-line");
  }
  
  return stars;
}
