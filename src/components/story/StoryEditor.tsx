import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { aiService } from '../../services/ai.service'; // Import AI service
import type { ContentHistoryItem, StoryData } from '../../types';

const DEFAULT_YEAR = new Date().getFullYear();

export function StoryEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { birthYear } = usePreferencesStore();
  
  // Story state
  const [storyState, setStoryState] = useState({
    title: '',
    content: '',
    selectedYear: DEFAULT_YEAR,
    tags: [] as string[],
    connections: [] as string[],
    storyId: id || null,
    contentHistory: [] as ContentHistoryItem[],
    lastSavedContent: '',
    lastSavedTitle: ''
  });
  
  // UI state
  const [uiState, setUiState] = useState({
    isSaving: false,
    isDeleting: false,
    showDeleteModal: false,
    showAddConnectionModal: false,
    hasUnsavedChanges: false,
    error: null as string | null
  });

  // Connection state
  const [connectionState, setConnectionState] = useState({
    suggestedConnections: [] as string[],
    ignoredConnections: [] as string[]
  });

  const analyzeMemory = useMemoryAnalysis(storyState.storyId);
  useUnsavedChanges(uiState.hasUnsavedChanges);

  const wordCount = React.useMemo(() => {
    if (!storyState.content) return 0;
    return storyState.content.trim().split(/\s+/).filter(Boolean).length;
  }, [storyState.content]);

  // Core save functionality
  const saveStory = useCallback(async (storyData: typeof storyState) => {
    if (!currentUser?.uid) {
      throw new Error('User must be logged in to save');
    }
    
    const trimmedTitle = storyData.title?.trim();
    if (!trimmedTitle) {
      throw new Error('Title is required');
    }

    const storyToSave: Partial<StoryData> = {
      title: trimmedTitle,
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
  }, [currentUser]);

  // Handle saving
  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!currentUser?.uid) {
      console.error('No user logged in');
      setUiState(prev => ({ 
        ...prev, 
        error: 'You must be logged in to save',
        isSaving: false 
      }));
      return null;
    }

    if (!storyState.title.trim()) {
      console.error('Title is required');
      setUiState(prev => ({
        ...prev,
        error: 'Please enter a title before saving',
        isSaving: false
      }));
      return null;
    }

    setUiState(prev => ({ ...prev, isSaving: true }));
    console.log('Starting save process...');

    try {
      const result = await saveStory(storyState);
      
      if (result.needsRedirect) {
        navigate(`/story/${result.storyId}`);
      }

      console.log('Save successful:', result.storyId);

      setStoryState(prev => ({
        ...prev,
        storyId: result.storyId,
        lastSavedContent: prev.content,
        lastSavedTitle: prev.title
      }));

      if (!isAutoSave) {
        console.log('Adding to content history');
        setStoryState(prev => ({
          ...prev,
          contentHistory: [...prev.contentHistory, { content: prev.content, timestamp: new Date() }]
        }));
      }

      setUiState(prev => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false,
        error: null
      }));

      return result.storyId;
    } catch (error: any) {
      console.error('Failed to save story:', error);
      setUiState(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || 'Failed to save story. Please try again.'
      }));
      return null;
    }
  }, [currentUser, navigate, storyState, saveStory]);

  // Handle adding connections
  const handleAddConnection = useCallback(async ({ name, relationship }: { name: string; relationship: string }) => {
    if (!currentUser?.uid) {
      setUiState(prev => ({ ...prev, error: 'You must be logged in to add connections' }));
      return;
    }

    let currentStoryId = storyState.storyId;
    if (!currentStoryId) {
      currentStoryId = await handleSave();
      if (!currentStoryId) {
        setUiState(prev => ({ ...prev, error: 'Please save the story before adding connections' }));
        return;
      }
    }

    try {
      if (!name?.trim() || !relationship?.trim()) {
        throw new Error('Name and relationship are required');
      }

      await connectionsService.addConnectionToStory(
        currentUser.uid,
        currentStoryId,
        {
          name: name.trim(),
          relationship: relationship.trim(),
          year: storyState.selectedYear,
          phaseId: 'default', // You may want to calculate this based on the year
          storyTitle: storyState.title
        }
      );

      setStoryState(prev => ({
        ...prev,
        connections: [...prev.connections, name.trim()]
      }));
      
      // Force refresh connections panel
      setStoryState(prev => ({ ...prev, storyId: currentStoryId }));

      setConnectionState(prev => ({
        ...prev,
        suggestedConnections: prev.suggestedConnections.filter(n => n !== name)
      }));

      setUiState(prev => ({
        ...prev,
        showAddConnectionModal: false,
        error: null
      }));
    } catch (error: any) {
      console.error('Failed to add connection:', error);
      setUiState(prev => ({ ...prev, error: error.message || 'Failed to add connection' }));
    }
  }, [currentUser, storyState.storyId, handleSave]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    setStoryState(prev => ({ ...prev, content: newContent }));
    setUiState(prev => ({ ...prev, hasUnsavedChanges: true }));
    analyzeMemory(newContent, storyState.title);
  }, [analyzeMemory, storyState.title]);

  // Handle transcription
const handleTranscription = useCallback(async (text: string) => {
  if (!text?.trim()) return;

  setUiState(prev => ({ ...prev, error: null }));

  try {
    // Step 1: Send transcription to OpenAI for cleaning
    const cleanedResponse = await aiService.cleanTranscription(text);
    if (!cleanedResponse.success) {
      throw new Error(cleanedResponse.error || "Failed to clean transcription");
    }

    const cleanedText = cleanedResponse.text;

    // Step 2: Send cleaned transcription to AI configuration for analysis/suggestions
    const analyzedResponse = await aiService.analyzeMemory(cleanedText, {
      promptTemplate: PROMPT_TEMPLATES.ANALYSIS, // Use appropriate analysis prompt
      temperature: 0.7,
    });

    if (!analyzedResponse.success) {
      throw new Error(analyzedResponse.error || "Failed to analyze transcription");
    }

    const enhancedText = analyzedResponse.text;

    // Step 3: Append enhanced text to the story content
    setStoryState(prev => ({
      ...prev,
      content: prev.content + (prev.content ? " " : "") + enhancedText,
    }));
  } catch (error) {
    console.error("Error processing transcription:", error);
    setUiState(prev => ({
      ...prev,
      error: error instanceof Error ? error.message : "Failed to process transcription",
    }));
    // Fallback: Append the raw transcription to content
    setStoryState(prev => ({
      ...prev,
      content: prev.content + (prev.content ? " " : "") + text.trim(),
    }));
  }
}, []);


  // Fetch story data when ID is available
  useEffect(() => {
    if (!id || !currentUser) return;
    console.log('Initializing story fetch for ID:', id);
    
    const fetchStory = async () => {
      try {
        console.log('Fetching story data...');
        const story = await firebaseService.getStory(id);
        console.log('Fetched story:', story);

        if (story) {
          console.log('Setting story state with:', {
            title: story.title,
            contentLength: story.content?.length,
            year: story.timelineMetadata?.primaryYear,
            tags: story.timelineMetadata?.tags,
            connections: story.connections
          });

          setStoryState(prev => ({
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
        setUiState(prev => ({ ...prev, error: 'Failed to load story' }));
      }
    };

    fetchStory();
  }, [id, currentUser]);

  // Auto-save effect
  useEffect(() => {
    if (!currentUser || !storyState.title || !storyState.content) return;
    console.log('Checking auto-save conditions:', {
      contentChanged: storyState.content !== storyState.lastSavedContent,
      titleChanged: storyState.title !== storyState.lastSavedTitle
    });

    if (storyState.content === storyState.lastSavedContent && 
        storyState.title === storyState.lastSavedTitle) return;

    const saveTimeout = setTimeout(() => {
      console.log('Auto-saving story...');
      handleSave(true);
    }, 3000);

    return () => clearTimeout(saveTimeout);
  }, [currentUser, storyState.content, storyState.title, storyState.lastSavedContent, storyState.lastSavedTitle, handleSave]);

  const handleDelete = useCallback(async () => {
    if (!currentUser || !storyState.storyId) return;
    
    setUiState(prev => ({ ...prev, isDeleting: true }));
    
    try {
      await firebaseService.deleteStory(storyState.storyId);
      setUiState(prev => ({ ...prev, showDeleteModal: false }));
      navigate('/');
    } catch (error: any) {
      console.error('Failed to delete story:', error);
      setUiState(prev => ({
        ...prev,
        isDeleting: false,
        error: error.message || 'Failed to delete story'
      }));
    }
  }, [currentUser, storyState.storyId, navigate]);

  return (
    <Layout className="min-h-screen bg-gradient-page">
      <DeleteConfirmModal
        isOpen={uiState.showDeleteModal}
        onClose={() => setUiState(prev => ({ ...prev, showDeleteModal: false }))}
        onConfirm={handleDelete}
        isDeleting={uiState.isDeleting}
        title="Delete Story"
        message="Are you sure you want to delete this story? This action cannot be undone."
      />
      {uiState.error && (
        <div className="fixed top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
          {uiState.error}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        <Card 
          variant="elevated" 
          className="relative z-30 flex-1 lg:flex-[0.6] min-h-[50vh] lg:min-h-0 lg:min-w-[600px] lg:max-w-[900px] 
                   m-3 lg:m-6 bg-background-secondary/60 backdrop-blur-md shadow-xl"
        >
          <EditorContent
            content={storyState.content}
            title={storyState.title}
            setTitle={(title) => setStoryState(prev => ({ ...prev, title }))}
            selectedYear={storyState.selectedYear}
            setSelectedYear={(year) => setStoryState(prev => ({ ...prev, selectedYear: year }))}
            birthYear={birthYear}
            tags={storyState.tags}
            setTags={(tags) => setStoryState(prev => ({ ...prev, tags }))}
            setContent={handleContentChange}
            onTranscription={handleTranscription} // Updated callback
            suggestedConnections={connectionState.suggestedConnections}
            onAddConnection={handleAddConnection}
            onIgnoreConnection={(name) => {
              setConnectionState(prev => ({
                suggestedConnections: prev.suggestedConnections.filter(n => n !== name),
                ignoredConnections: [...prev.ignoredConnections, name]
              }));
            }}
            onRequestAISuggestion={() => {}}
            onShowAddConnection={() => setUiState(prev => ({ ...prev, showAddConnectionModal: true }))}
            onSave={() => handleSave(false)}
            isSaving={uiState.isSaving}
            hasUnsavedChanges={uiState.hasUnsavedChanges}
            onDelete={() => setUiState(prev => ({ ...prev, showDeleteModal: true }))}
            wordCount={wordCount}
          />
        </Card>

        <div className="relative z-20 w-full lg:w-[400px] lg:min-w-[320px] lg:max-w-[480px] flex flex-col gap-4 flex-shrink-0">
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
                if (storyState.contentHistory.length > 0) {
                  const lastItem = storyState.contentHistory[storyState.contentHistory.length - 1];
                  setStoryState(prev => ({
                    ...prev,
                    content: lastItem.content,
                    contentHistory: prev.contentHistory.slice(0, -1)
                  }));
                }
              }}
              lastSession={undefined}
            />
          </Card>

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

      {uiState.showAddConnectionModal && (
        <AddConnectionModal
          isOpen={uiState.showAddConnectionModal}
          onClose={() => setUiState(prev => ({ ...prev, showAddConnectionModal: false }))}
          onAdd={handleAddConnection}
        />
      )}
      
      <DeleteConfirmModal
        isOpen={uiState.showDeleteModal}
        onClose={() => setUiState(prev => ({ ...prev, showDeleteModal: false }))}
        onConfirm={handleDelete}
        isDeleting={uiState.isDeleting}
        title="Delete Story"
        message="Are you sure you want to delete this story? This action cannot be undone."
      />
    </Layout>
  );
}
