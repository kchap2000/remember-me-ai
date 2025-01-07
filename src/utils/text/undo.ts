import type { TextChange } from '../types';

export interface UndoResult {
  text: string;
  undoneChange: TextChange | null;
  remainingChanges: TextChange[];
}

export function undoLastChange(text: string, changes: TextChange[]): UndoResult {
  if (!changes.length) {
    return {
      text,
      undoneChange: null,
      remainingChanges: []
    };
  }

  // Get the last change
  const lastChange = changes[changes.length - 1];
  const remainingChanges = changes.slice(0, -1);

  // Replace the modified text with the original at the correct position
  const beforeChange = text.substring(0, lastChange.position);
  const afterChange = text.substring(lastChange.position + lastChange.modified.length);
  const restoredText = beforeChange + lastChange.original + afterChange;

  return {
    text: restoredText,
    undoneChange: lastChange,
    remainingChanges
  };
}

export function undoAllChanges(text: string, changes: TextChange[]): string {
  // Apply changes in reverse order to restore original text
  return changes.reverse().reduce((currentText, change) => {
    const beforeChange = currentText.substring(0, change.position);
    const afterChange = currentText.substring(change.position + change.modified.length);
    return beforeChange + change.original + afterChange;
  }, text);
}