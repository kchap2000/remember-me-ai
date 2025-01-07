import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UndoManager } from '../../utils/text/UndoManager';
import type { TextChange } from '../../utils/types';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { useMemoryAnalysis } from '../../hooks/memory';
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges';
import { Layout } from '../layout/Layout';
import { Card } from '../layout/Card';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { EditorContent } from './EditorContent';
import { AddConnectionModal } from './AddConnectionModal';
import { ChatInterface } from '../chat/ChatInterface';
import { ConnectionsPanel } from '../connections/ConnectionsPanel';
import { firebaseService } from '../../services/firebase.service';
import { connectionsService } from '../../services/connections.service';
import type { ContentHistoryItem, StoryData } from '../../types';

const DEFAULT_YEAR = new Date().getFullYear();

// Create UndoManager instance outside component to persist between renders
const undoManager = new UndoManager();

// Helper to generate a fallback title
function generateFallbackTitle() {
  return `Untitled Story - ${new Date().toLocaleDateString()}`;
}

export function StoryEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { birthYear } = usePreferencesStore();

  // -----------------------
  // Story State
  // -----------------------
  const [storyState, setStoryState] = useState({
    title: '',
    content: '',
    selectedYear: DEFAULT_YEAR,
    tags: [] as string[],
    connections: [] as string[],
    storyId: id || null,
    lastSavedContent: '',
    lastSavedTitle: ''
  });

  // -----------------------
  // UI State
  // -----------------------
  const [uiState, setUiState] = useState({
    isSaving: false,
    isDeleting: false,
    showDeleteModal: false,
    showAddConnectionModal: false,
    hasUnsavedChanges: false,
    error: null as string | null
  });

  // -----------------------
  // Connection State
  // -----------------------
  const [connectionState, setConnectionState] = useState({
    suggestedConnections: [] as string[],
    ignoredConnections: [] as string[]
  });

  // Hooks
  const analyzeMemory = useMemoryAnalysis(storyState.storyId);
  useUnsavedChanges(uiState.hasUnsavedChanges);

  // Word Count
  const wordCount = React.useMemo(() => {
    if (!storyState.content) return 0;
    return storyState.content.trim().split(/\s+/).filter(Boolean).length;
  }, [storyState.content]);

  // -----------------------
  // Save Story Logic
  // -----------------------
  const saveStory = useCallback(
    async (storyData: typeof storyState) => {
      if (!currentUser?.uid) {
        throw new Error('User must be logged in to save');
      }

      // Fallback title if user has not provided one
      const finalTitle = storyData.title.trim() || generateFallbackTitle();

      const storyToSave: Partial<StoryData> = {
        title: finalTitle,
        content: storyData.content || '',
        timelineMetadata: {
          primaryYear: storyData.selectedYear,
          tags: storyData.tags || [],
          relatedYears: []
        },
        connections: storyData.connections || []
      };

      console.log('Saving story:', { userId: currentUser.uid, data: storyToSave });

      if (!storyData.storyId) {
        // Create new story
        const newStoryId = await firebaseService.createStory(currentUser.uid, storyToSave);
        console.log('Created new story:', newStoryId);
        return { storyId: newStoryId, needsRedirect: true };
      }

      // Update existing story
      await firebaseService.updateStory(storyData.storyId, storyToSave);
      console.log('Updated existing story:', storyData.storyId);
      return { storyId: storyData.storyId, needsRedirect: false };
    },
    [currentUser]
  );

  // -----------------------
  // Handle Manual or Auto Save
  // -----------------------
  const handleSave = useCallback(
    async (isAutoSave = false) => {
      // If not logged in, block save
      if (!currentUser?.uid) {
        console.error('No user logged in');
        setUiState((prev) => ({
          ...prev,
          error: 'You must be logged in to save',
          isSaving: false
        }));
        return null;
      }

      // Begin saving
      setUiState((prev) => ({ ...prev, isSaving: true }));
      console.log('Starting save process...');

      try {
        const result = await saveStory(storyState);

        if (result.needsRedirect) {
          navigate(`/story/${result.storyId}`);
        }

        console.log('Save successful:', result.storyId);

        // Update story state with new ID or finalize existing
        setStoryState((prev) => ({
          ...prev,
          storyId: result.storyId,
          lastSavedContent: prev.content,
          lastSavedTitle: prev.title.trim() || generateFallbackTitle()
        }));

        // Reset UI state for saving
        setUiState((prev) => ({
          ...prev,
          isSaving: false,
          hasUnsavedChanges: false,
          error: null
        }));

        return result.storyId;
      } catch (error: any) {
        console.error('Failed to save story:', error);
        setUiState((prev) => ({
          ...prev,
          isSaving: false,
          error: error.message || 'Failed to save story. Please try again.'
        }));
        return null;
      }
    },
    [currentUser, navigate, storyState, saveStory]
  );

  // -----------------------
  // Handle Adding Connections
  // -----------------------
  const handleAddConnection = useCallback(
    async ({ name, relationship }: { name: string; relationship: string }) => {
      if (!currentUser?.uid) {
        setUiState((prev) => ({
          ...prev,
          error: 'You must be logged in to add connections'
        }));
        return;
      }

      let currentStoryId = storyState.storyId;
      // If story not saved yet, save first
      if (!currentStoryId) {
        currentStoryId = await handleSave();
        if (!currentStoryId) {
          setUiState((prev) => ({
            ...prev,
            error: 'Please save the story before adding connections'
          }));
          return;
        }
      }

      try {
        if (!name?.trim() || !relationship?.trim()) {
          throw new Error('Name and relationship are required');
        }

        await connectionsService.addConnectionToStory(currentUser.uid, currentStoryId, {
          name: name.trim(),
          relationship: relationship.trim(),
          year: storyState.selectedYear,
          phaseId: 'default', // Adjust as needed
          storyTitle: storyState.title
        });

        setStoryState((prev) => ({
          ...prev,
          connections: [...prev.connections, name.trim()]
        }));

        // Refresh story ID to force an update in the UI
        setStoryState((prev) => ({ ...prev, storyId: currentStoryId }));

        setConnectionState((prev) => ({
          ...prev,
          suggestedConnections: prev.suggestedConnections.filter((n) => n !== name)
        }));

        setUiState((prev) => ({
          ...prev,
          showAddConnectionModal: false,
          error: null
        }));
      } catch (error: any) {
        console.error('Failed to add connection:', error);
        setUiState((prev) => ({
          ...prev,
          error: error.message || 'Failed to add connection'
        }));
      }
    },
    [currentUser, storyState.storyId, handleSave]
  );

  // -----------------------
  // Handle Content Change
  // -----------------------
  const handleContentChange = useCallback(
    (newContent: string, reason = 'Content change') => {
      // Save current content state before updating
      const change: TextChange = {
        original: storyState.content,
        modified: newContent,
        position: 0,
        reason,
        confidence: 1
      };
      // Push change to UndoManager
      undoManager.push(change);

      setStoryState((prev) => ({ 
        ...prev,
        content: newContent
      }));
      setUiState((prev) => ({ ...prev, hasUnsavedChanges: true }));
      analyzeMemory(newContent, storyState.title);
    },
    [analyzeMemory, storyState.title]
  );

  const handleUndo = useCallback(() => {
    const { text, hasUndo } = undoManager.undo(storyState.content);
    if (hasUndo) {
      setStoryState(prev => ({
        ...prev,
        content: text
      }));
      setUiState(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
  }, [storyState.content]);

  const handleRedo = useCallback(() => {
    const { text, hasRedo } = undoManager.redo(storyState.content);
    if (hasRedo) {
      setStoryState(prev => ({
        ...prev,
        content: text
      }));
      setUiState(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
  }, [storyState.content]);

  // -----------------------
  // Handle Transcription
  // -----------------------
  const handleTranscription = useCallback(async (text: string) => {
    if (!text?.trim()) return;

    setUiState((prev) => ({ ...prev, error: null }));

    try {
      // Fallback: append raw text
      setStoryState((prev) => ({
        ...prev,
        content: prev.content + (prev.content ? ' ' : '') + text.trim()
      }));
    } catch (error) {
      console.error('Error processing transcription:', error);
      setUiState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process transcription'
      }));
    }
  }, []);

  // -----------------------
  // Fetch Existing Story
  // -----------------------
  useEffect(() => {
    if (!id || !currentUser) return;
    console.log('Initializing story fetch for ID:', id);

    const fetchStory = async () => {
      try {
        console.log('Fetching story data...');
        const story = await firebaseService.getStory(id);
        console.log('Fetched story:', story);

        if (story) {
          setStoryState((prev) => ({
            ...prev,
            title: story.title || '',
            content: story.content || '',
            selectedYear: story.timelineMetadata?.primaryYear || DEFAULT_YEAR,
            tags: story.timelineMetadata?.tags || [],
            connections: story.connections || [],
            lastSavedContent: story.content || '',
            lastSavedTitle: story.title || ''
          }));
        }
      } catch (error) {
        console.error('Failed to fetch story:', error);
        setUiState((prev) => ({ ...prev, error: 'Failed to load story' }));
      }
    };

    fetchStory();
  }, [id, currentUser]);

  // -----------------------
  // Auto-Save Effect
  // -----------------------
  useEffect(() => {
    if (!currentUser) return;
    // Only auto-save if content or title is different from last saved
    const contentChanged = storyState.content !== storyState.lastSavedContent;
    const titleChanged = storyState.title !== storyState.lastSavedTitle;

    console.log('Checking auto-save conditions:', { contentChanged, titleChanged });

    if (!contentChanged && !titleChanged) return;

    const saveTimeout = setTimeout(() => {
      console.log('Auto-saving story...');
      handleSave(true);
    }, 3000);

    return () => clearTimeout(saveTimeout);
  }, [
    currentUser,
    storyState.content,
    storyState.title,
    storyState.lastSavedContent,
    storyState.lastSavedTitle,
    handleSave
  ]);

  // -----------------------
  // Handle Delete
  // -----------------------
  const handleDelete = useCallback(async () => {
    if (!currentUser || !storyState.storyId) return;

    setUiState((prev) => ({ ...prev, isDeleting: true }));

    try {
      await firebaseService.deleteStory(storyState.storyId);
      setUiState((prev) => ({ ...prev, showDeleteModal: false }));
      navigate('/');
    } catch (error: any) {
      console.error('Failed to delete story:', error);
      setUiState((prev) => ({
        ...prev,
        isDeleting: false,
        error: error.message || 'Failed to delete story'
      }));
    }
  }, [currentUser, storyState.storyId, navigate]);

  // -----------------------
  // Handle Exiting the Editor
  // -----------------------
  const handleExit = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleShowAddConnection = () => {
    if (!storyState.content.trim()) {
      alert('Please add some content before adding connections.');
      return;
    }
    setUiState((prev) => ({ ...prev, showAddConnectionModal: true }));
  };

return (
    <Layout className="min-h-screen bg-gradient-page">
      {/* Error Banner */}
      {uiState.error && (
        <div className="fixed top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
          {uiState.error}
        </div>
      )}

      {/* ==============================
          Main Layout
      ============================== */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* ------------------------------
            Editor Content
        ------------------------------ */}
        <Card
          variant="elevated"
          className="relative z-30 flex-1 lg:flex-[0.6] min-h-[50vh] lg:min-h-0 lg:min-w-[600px] lg:max-w-[900px] 
                   m-3 lg:m-6 bg-background-secondary/60 backdrop-blur-md shadow-xl"
        >
          <EditorContent
            content={storyState.content}
            title={storyState.title}
            setTitle={(title) => setStoryState((prev) => ({ ...prev, title }))}
            selectedYear={storyState.selectedYear}
            setSelectedYear={(year) =>
              setStoryState((prev) => ({ ...prev, selectedYear: year }))
            }
            birthYear={birthYear}
            tags={storyState.tags}
            setTags={(tags) => setStoryState((prev) => ({ ...prev, tags }))}
            onContentChange={handleContentChange}
            onTranscription={handleTranscription}
            suggestedConnections={connectionState.suggestedConnections}
            onAddConnection={handleAddConnection}
            onExit={handleExit}
            onIgnoreConnection={(name) => {
              setConnectionState((prev) => ({
                suggestedConnections: prev.suggestedConnections.filter((n) => n !== name),
                ignoredConnections: [...prev.ignoredConnections, name]
              }));
            }}
            onRequestAISuggestion={() => {}}
            onShowAddConnection={handleShowAddConnection}
            onSave={() => handleSave(false)}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoManager.canUndo()}
            canRedo={undoManager.canRedo()}
            isSaving={uiState.isSaving}
            hasUnsavedChanges={uiState.hasUnsavedChanges}
            onDelete={() => setUiState((prev) => ({ ...prev, showDeleteModal: true }))}
            wordCount={wordCount}
          />
        </Card>

        {/* ------------------------------
            Side Panel with Chat & Connections
        ------------------------------ */}
        <div className="relative z-20 w-full lg:w-[400px] lg:min-w-[320px] lg:max-w-[480px] flex flex-col gap-4 flex-shrink-0">
          {/* Chat Panel */}
          <Card
            variant="elevated"
            className="flex-[0.6] min-h-[300px] lg:min-h-[400px] m-3 lg:m-6 lg:mb-3 
                     bg-background-secondary/60 backdrop-blur-md shadow-lg"
          >
            <ChatInterface
              key={storyState.storyId || 'new'}
              storyContent={storyState.content}
              storyMetadata={{
                id: storyState.storyId || undefined,
                title: storyState.title,
                year: storyState.selectedYear,
                tags: storyState.tags,
                connections: storyState.connections
              }}
              onSuggestion={() => {}}
              onUndo={() => {
                if (undoManager.canUndo()) {
                  const { text } = undoManager.undo(storyState.content);
                  setStoryState((prev) => ({
                    ...prev,
                    content: text
                  }));
                }
              }}
              lastSession={undefined}
            />
          </Card>

          {/* Connections Panel */}
          <Card
            variant="elevated"
            className="flex-[0.4] min-h-[300px] m-6 mt-3 bg-background-secondary/60 backdrop-blur-md"
          >
            <ConnectionsPanel
              storyId={storyState.storyId}
              onAddConnection={handleAddConnection}
            />
          </Card>
        </div>
      </div>

      {/* ------------------------------
          Add Connection Modal
      ------------------------------ */}
      {uiState.showAddConnectionModal && (
        <AddConnectionModal
          isOpen={uiState.showAddConnectionModal}
          onClose={() => setUiState(prev => ({ ...prev, showAddConnectionModal: false }))}
          onAdd={handleAddConnection}
          userId={currentUser?.uid}
          content={storyState.content}
          storyId={storyState.storyId || ''}
          storyTitle={storyState.title}
          selectedYear={storyState.selectedYear}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={uiState.showDeleteModal}
        onClose={() => setUiState((prev) => ({ ...prev, showDeleteModal: false }))}
        onConfirm={handleDelete}
        isDeleting={uiState.isDeleting}
        title="Delete Story"
        message="Are you sure you want to delete this story? This action cannot be undone."
      />
    </Layout>
  );
}