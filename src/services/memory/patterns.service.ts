import type { ElementType } from '../../types/analysis';

export const MEMORY_PATTERNS: Record<ElementType, RegExp> = {
  people: /\b(?:mother|father|dad|sister|brother|aunt|uncle|grandmother|grandfather|friend|teacher)\b/gi,
  locations: /\b(?:hospital|kitchen|school|home|house|room|store|park)\b/gi,
  events: /\b(?:tripped|hit|born|stitches|fell|broke|celebrated|visited|played|learned)\b/gi,
  timeframes: /\b(?:yesterday|last week|when I was|years ago|in \d{4}|[12][0-9]{3})\b/gi,
  objects: /\b(?:briefcase|mirror|eye|book|table|chair|car)\b/gi
};