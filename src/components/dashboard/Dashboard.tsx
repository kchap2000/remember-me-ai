import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { firebaseService } from '../../services/firebase.service';
import { Timeline } from '../timeline/Timeline';
import { ConnectionsPanel } from '../connections/ConnectionsPanel';
import { StoryCard } from './StoryCard';
import { Layout, LayoutContent, LayoutSection } from '../layout/Layout';
import { Card } from '../layout/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { cn } from '../../utils/cn';
import { components } from '../../styles/components';
import type { Story } from '../../types';

interface TimelineYear {
  year: number;
  completed: boolean;
  stories: Story[];
  phase: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    timelineCollapsed,
    setTimelineCollapsed,
    collapsedPhases,
    togglePhaseCollapsed 
  } = usePreferencesStore();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [yearsByPhase, setYearsByPhase] = useState<Record<string, TimelineYear[]>>({});
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch stories and organize by phase
  useEffect(() => {
    async function fetchStories() {
      if (!currentUser) {
        setStories([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const userStories = await firebaseService.getUserStories(currentUser.uid);
        console.log('Fetched stories:', userStories);
        setStories(userStories);
        
        // Organize stories by phase
        const storyPhases: Record<string, TimelineYear[]> = {};
        userStories.forEach(story => {
          if (story.timelineMetadata?.phaseId) {
            const { phaseId } = story.timelineMetadata;
            if (!storyPhases[phaseId]) {
              storyPhases[phaseId] = [];
            }
            storyPhases[phaseId].push({
              year: story.timelineMetadata.primaryYear,
              completed: true,
              stories: [story],
              phase: phaseId
            });
          }
        });
        
        setYearsByPhase(storyPhases);
      } catch (err: any) {
        setError(err.message || 'Failed to load stories');
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [currentUser, location.pathname]); // Re-fetch when route changes

  const handleNewStory = () => {
    if (!currentUser) {
      // Show login modal through Header component
      return;
    }
    navigate('/story/new');
  };

  return (
    <Layout className="min-h-screen bg-gradient-page">
      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Timeline */}
        <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-border-subtle">
          <Timeline />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <LayoutContent>
            <LayoutSection>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-4xl font-black text-text-primary tracking-tight">
                  Dashboard
                </h1>
                <button
                  onClick={handleNewStory}
                  className={cn(
                    components.button.base,
                    components.button.variants.primary,
                    components.button.sizes.md,
                    "shadow-lg hover:shadow-xl transition-all duration-300"
                  )}
                >
                  Start a New Story
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner />
                </div>
              ) : error ? (
                <Card variant="elevated" className="p-8 text-center shadow-lg">
                  <p className="text-accent-error">{error}</p>
                </Card>
              ) : stories.length === 0 ? (
                <Card variant="elevated" className="p-12 text-center shadow-lg">
                  <p className="text-text-secondary mb-6">
                    No stories yet. Start writing your first story!
                  </p>
                  <button
                    onClick={handleNewStory}
                    className={cn(
                      components.button.base,
                      components.button.variants.primary,
                      components.button.sizes.lg
                    )}
                  >
                    Start Writing
                  </button>
                </Card>
              ) : (
                <div className="grid gap-6 animate-fadeIn">
                  {stories.map((story) => (
                    <StoryCard 
                      key={story.id} 
                      story={{
                        ...story,
                        status: 'Unfinished' // TODO: Add status handling
                      }} 
                    />
                  ))}
                </div>
              )}
            </LayoutSection>
          </LayoutContent>
        </div>

        {/* Connections Panel */}
        <div className="w-[400px] min-w-[320px] max-w-[480px] border-l border-border-subtle">
          {currentUser && <ConnectionsPanel userId={currentUser.uid} />}
        </div>
      </div>
    </Layout>
  );
}