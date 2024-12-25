// Common regex patterns used for text processing
export const PATTERNS = {
  multipleSpaces: /\s+/g,
  sentenceBoundary: /([.!?])\s+(\w)/g,
  falseStarts: /\b(um|uh|like|so)\s+/gi,
  stuttering: /\b(\w+)(?:\s+\1\b)+/gi,
  numbers: /\b(zero|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
  dates: /\b(\d{1,2}(?:st|nd|rd|th)?)\s+(of\s+)?(January|February|March|April|May|June|July|August|September|October|November|December)\b/gi
} as const;

export const NUMBER_WORDS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4,
  five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10
} as const;