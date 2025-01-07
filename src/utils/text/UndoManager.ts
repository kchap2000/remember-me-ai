import { TextChange } from '../types';

const UNDO_LIMIT = 100; // Maximum number of undo operations
const GROUPING_TIMEOUT = 1000; // Time window for grouping changes (ms)

export interface UndoableChange {
  changes: TextChange[];
  timestamp: number;
  groupId?: string;
}

export class UndoManager {
  private undoStack: UndoableChange[] = [];
  private redoStack: UndoableChange[] = [];
  private lastGroupId?: string;
  private lastChangeTime: number = 0;

  push(change: TextChange) {
    // Clear redo stack when new changes occur
    this.redoStack = [];

    const now = Date.now();
    const shouldGroup = now - this.lastChangeTime < GROUPING_TIMEOUT;
    
    if (shouldGroup && this.undoStack.length > 0) {
      // Group with last change
      const lastChange = this.undoStack[this.undoStack.length - 1];
      lastChange.changes.push(change);
    } else {
      // Create new change group
      this.undoStack.push({
        changes: [change],
        timestamp: now,
        groupId: Math.random().toString(36)
      });
    }

    this.lastChangeTime = now;
    this.lastGroupId = this.undoStack[this.undoStack.length - 1].groupId;

    // Limit undo stack size
    if (this.undoStack.length > UNDO_LIMIT) {
      this.undoStack.shift();
    }
  }

  undo(currentText: string): { text: string; hasUndo: boolean } {
    if (this.undoStack.length === 0) {
      return { text: currentText, hasUndo: false };
    }

    const changeGroup = this.undoStack.pop()!;
    this.redoStack.push(changeGroup);

    // Apply changes in reverse order
    const restoredText = changeGroup.changes.reduceRight((text, change) => {
      const beforeChange = text.substring(0, change.position);
      const afterChange = text.substring(change.position + change.modified.length);
      return beforeChange + change.original + afterChange;
    }, currentText);

    return {
      text: restoredText,
      hasUndo: this.undoStack.length > 0
    };
  }

  redo(currentText: string): { text: string; hasRedo: boolean } {
    if (this.redoStack.length === 0) {
      return { text: currentText, hasRedo: false };
    }

    const changeGroup = this.redoStack.pop()!;
    this.undoStack.push(changeGroup);

    // Apply changes in forward order
    const newText = changeGroup.changes.reduce((text, change) => {
      const beforeChange = text.substring(0, change.position);
      const afterChange = text.substring(change.position + change.original.length);
      return beforeChange + change.modified + afterChange;
    }, currentText);

    return {
      text: newText,
      hasRedo: this.redoStack.length > 0
    };
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.lastGroupId = undefined;
    this.lastChangeTime = 0;
  }
}