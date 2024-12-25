import type { Language, TextStyle, PolishOptions, PolishResult, TextChange } from './text/types';
import { PATTERNS } from './patterns';
import { englishRules } from './text/rules';
import { convertWrittenNumbers } from './numbers';

// Single source of truth for text polishing
export async function polishText(
  text: string,
  options: PolishOptions = {}
): Promise<PolishResult> {
  try {
    if (!text?.trim()) {
      return createEmptyResult();
    }

    const {
      fixPunctuation = true,
      capitalizeFirst = true,
      removeFillers = true,
      convertNumbers = true,
      improveGrammar = false,
      language = Language.English,
      aiAssist = false,
      textStyle = TextStyle.Formal,
      customStyleGuides
    } = options;

    const rules = englishRules;
    const changes: TextChange[] = [];
    let confidence = rules.confidenceMetrics.baseScore;
    let errorCount = 0;
    let result = text;

    // Process text in chunks for better handling of large texts
    const chunks = splitIntoSentences(result);
    result = chunks.map(chunk => {
      let processed = chunk;

      // Remove multiple spaces
      processed = processed.replace(PATTERNS.multipleSpaces, ' ');
      
      // Fix sentence boundaries and capitalization
      if (capitalizeFirst) {
        processed = processed.replace(PATTERNS.sentenceBoundary, (_, punctuation, letter) => 
          `${punctuation} ${letter.toUpperCase()}`
        );
        processed = processed.charAt(0).toUpperCase() + processed.slice(1);
      }

      // Remove filler words
      if (removeFillers) {
        const originalText = processed;
        processed = processed.replace(rules.fillerWords, '');
        if (originalText !== processed) {
          recordChange(changes, originalText, processed, 'Removed filler words', 0.9);
          errorCount++;
        }
      }

      // Fix punctuation
      if (fixPunctuation) {
        const originalText = processed;
        rules.punctuationRules.forEach(([pattern, replacement]) => {
          processed = processed.replace(pattern, replacement);
        });
        if (originalText !== processed) {
          recordChange(changes, originalText, processed, 'Fixed punctuation', 0.95);
          errorCount++;
        }
      }

      // Convert numbers
      if (convertNumbers) {
        const originalText = processed;
        const { text: converted, changes: numberChanges } = convertWrittenNumbers(processed);
        processed = converted;
        if (numberChanges > 0) {
          recordChange(changes, originalText, processed, 'Converted numbers', 0.95);
          errorCount++;
        }
      }

      // Apply style guides
      if (textStyle && rules.styleGuides[textStyle]) {
        const originalText = processed;
        for (const [pattern, replacement] of rules.styleGuides[textStyle]) {
          processed = processed.replace(pattern, replacement);
        }
        if (originalText !== processed) {
          recordChange(changes, originalText, processed, `Applied ${textStyle} style`, 0.9);
          errorCount++;
        }
      }

      // Apply custom style guides if provided
      if (customStyleGuides?.length) {
        const originalText = processed;
        for (const [pattern, replacement] of customStyleGuides) {
          processed = processed.replace(pattern, replacement);
        }
        if (originalText !== processed) {
          recordChange(changes, originalText, processed, 'Applied custom style', 0.9);
          errorCount++;
        }
      }

      return processed;
    }).join(' ');

    // Calculate final confidence
    const finalConfidence = Math.max(
      0,
      confidence - (errorCount * rules.confidenceMetrics.penaltyPerError)
    );

    return {
      text: result.trim(),
      changes,
      aiAssisted: false,
      confidence: finalConfidence,
      language
    };
  } catch (error) {
    console.error('Error in polishText:', error);
    return createEmptyResult(text, language);
  }
}

// Export a simpler version for basic text cleanup
export function cleanText(text: string): Promise<string> {
  return polishText(text, {
    fixPunctuation: true,
    capitalizeFirst: true,
    removeFillers: true,
    convertNumbers: false,
    textStyle: TextStyle.Formal
  }).then(result => result.text);
}