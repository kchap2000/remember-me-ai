import { NUMBER_WORDS } from './patterns';

interface NumberConversionResult {
  text: string;
  changes: number;
}

export function convertWrittenNumbers(text: string): NumberConversionResult {
  let result = text;
  let changes = 0;

  // Convert written numbers to digits
  Object.entries(NUMBER_WORDS).forEach(([word, digit]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = result.match(regex);
    if (matches) {
      result = result.replace(regex, digit.toString());
      changes += matches.length;
    }
  });

  return { text: result, changes };
}