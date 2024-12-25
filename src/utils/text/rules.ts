import { TextStyle } from '../types';
import type { TextProcessingRules } from './types';

export const englishRules: TextProcessingRules = {
  fillerWords: /\b(um|uh|like|you know|i mean|basically|actually|literally)\b\s*/gi,
  commonReplacements: {
    'gonna': 'going to',
    'wanna': 'want to',
    'gotta': 'got to',
    'dunno': "don't know",
    'lemme': 'let me',
    'gimme': 'give me'
  },
  punctuationRules: [
    [/([.!?,;:])(?=\w)/g, '$1 '],
    [/\s+([.!?,;:])/g, '$1'],
    [/,(?=\w)/g, ', '],
    [/"\s*(\w)/g, '" $1'],
    [/(\w)\s*"/g, '$1 "']
  ],
  grammarRules: [
    [/\bi\b(?![A-Z'])/g, 'I'],
    [/([Aa])n(?= [^aeiou])/g, '$1'],
    [/([Aa])(?= [aeiou])/g, '$1n']
  ],
  styleGuides: {
    [TextStyle.Formal]: [
      [/\bdont\b/g, "don't"],
      [/\bcant\b/g, "can't"],
      [/\bwont\b/g, "won't"]
    ],
    [TextStyle.Technical]: [
      [/\b(\d+)k\b/g, '$1,000'],
      [/\b(\d+)([mb])\b/gi, '$1 $2']
    ],
    [TextStyle.Casual]: [
      [/\b(hello|hi there)\b/gi, 'hey'],
      [/\bgreetings\b/gi, 'hi']
    ]
  },
  confidenceMetrics: {
    baseScore: 0.95,
    penaltyPerError: 0.05
  }
};