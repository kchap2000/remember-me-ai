// src/utils/text.ts

import { Language, TextStyle, PolishOptions, PolishResult, TextChange, BaseResult } from './types';

const recordChange = (
  changes: TextChange[],
  original: string,
  modified: string,
  position: number,
  reason: string,
  confidence: number
): void => {
  changes.push({
    original,
    modified,
    position,
    reason,
    confidence
  });
};

export async function polishText(
  text: string,
  options: PolishOptions = {}
): Promise<PolishResult> {
  if (!text?.trim()) {
    return {
      text: '',
      changes: [],
      aiAssisted: false,
      confidence: 1,
      language: options.language || Language.English
    };
  }

  const defaultOptions: PolishOptions = {
    fixPunctuation: true,
    capitalizeFirst: true,
    removeFillers: false,
    convertNumbers: false,
    improveGrammar: false,
    language: Language.English,
    aiAssist: false,
    textStyle: TextStyle.Casual,
    maxRetries: 3
  };

  try {
    const mergedOptions = { ...defaultOptions, ...options };
    const changes: TextChange[] = [];
    let processedText = text;
    let currentPosition = 0;

    // Basic cleanup
    const originalText = processedText;
    processedText = processedText.trim().replace(/\s+/g, ' ');
    
    if (processedText !== originalText) {
      recordChange(
        changes,
        originalText,
        processedText,
        currentPosition,
        'Basic cleanup',
        1
      );
      currentPosition = 0; // Reset position after cleanup
    }

    // Capitalize first letter if enabled
    if (mergedOptions.capitalizeFirst && processedText.length > 0) {
      const originalFirst = processedText;
      processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
      
      if (processedText !== originalFirst) {
        recordChange(
          changes,
          originalFirst,
          processedText,
          0,
          'Capitalized first letter',
          1
        );
      }
    }

    // Fix punctuation if enabled
    if (mergedOptions.fixPunctuation) {
      const originalPunct = processedText;
      
      // Add period if missing at the end
      if (!/[.!?]$/.test(processedText)) {
        processedText += '.';
      }
      
      // Fix common punctuation issues
      processedText = processedText
        .replace(/\s+([.,!?])/g, '$1')
        .replace(/([.,!?])(?=[A-Za-z])/g, '$1 ');
      
      if (processedText !== originalPunct) {
        recordChange(
          changes,
          originalPunct,
          processedText,
          originalPunct.length - 1,
          'Fixed punctuation',
          0.95
        );
      }
    }

    // Calculate final confidence score
    const confidence = changes.reduce((acc, change) => Math.min(acc, change.confidence), 1);

    return {
      text: processedText,
      changes,
      aiAssisted: Boolean(mergedOptions.aiAssist && changes.length > 0),
      confidence,
      language: mergedOptions.language
    };
  } catch (error) {
    console.error('Error in polishText:', error);
    return {
      text: text.trim(),
      changes: [],
      aiAssisted: false,
      confidence: 1,
      language: options.language || Language.English
    };
  }
}

// Helper function for basic text cleanup
export async function cleanText(
  text: string,
  language: Language = Language.English
): Promise<BaseResult & { text: string }> {
  try {
    const result = await polishText(text, {
      fixPunctuation: true,
      capitalizeFirst: true,
      language,
      textStyle: TextStyle.Casual
    });
    
    return {
      success: true,
      text: result.text
    };
  } catch (error) {
    return {
      success: false,
      text: text.trim(),
      error: 'Failed to clean text'
    };
  }
}