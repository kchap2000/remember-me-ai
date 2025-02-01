import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Card } from '../layout/Card';
import { BirthYearModal } from './BirthYearModal';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LIFE_PHASES } from '../../config/timeline.config';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { timelineService } from '../../services/timeline.service';
import { cn } from '../../utils/cn';
import { components } from '../../styles/components';
import type { TimelineYear, LifePhase, Story } from '../../types';

function TimelinePhaseLabel({ phase, isFirst }: { phase: LifePhase; isFirst: boolean }) {
  return (
    <div className={`relative py-4 ${isFirst ? 'mt-0' : 'mt-2'}`}>
      <div 
        className="pl-12 pr-4 py-2 rounded-r-lg relative z-10"
        style={{ 
          backgroundColor: `${phase.color}80` 
        }}
      >
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full shadow-md"
              style={{ backgroundColor: phase.color }}
            />
            <h3 className="text-sm font-semibold text-white">
              {phase.name}
            </h3>
          </div>
        </div>
      </div>
      
      <div 
        className="absolute left-6 top-0 bottom-0 w-px z-0"
        style={{ 
          background: `linear-gradient(180deg, 
            ${isFirst ? phase.color : 'transparent'} 0%,
            ${phase.color} 50%,
            ${phase.color} 100%
          )`
        }}
      />
    </div>
  );
}

export function Timeline() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [years, setYears] = useState<TimelineYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showBirthYearModal, setShowBirthYearModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { birthYear, setBirthYear } = usePreferencesStore();

  // Group years by phase
  const yearsByPhase = years.reduce((acc, year) => {
    if (!year.phase) return acc;
    if (!acc[year.phase]) {
      acc[year.phase] = [];
    }
    acc[year.phase].push(year);
    return acc;
  }, {} as Record<string, TimelineYear[]>);
  
  const generateTimeline = useCallback(() => {
    if (!birthYear) return;
    
    const currentYear = new Date().getFullYear();
    const yearsArray = Array.from({ length: currentYear - birthYear + 1 }, (_, i) => {
      const year = birthYear + i;
      const phase = LIFE_PHASES.find(
        p => (year - birthYear) >= p.startAge && (year - birthYear) <= p.endYear
      );
      
      return {
        year,
        completed: false,
        stories: [],
        phase: phase?.id
      };
    });
    setYears(yearsArray);
  }, [birthYear]);

  // Fetch stories and update timeline
  const updateTimelineStories = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const storiesByYear = await timelineService.fetchStoriesForTimeline(currentUser.uid);
      
      setYears(prev => prev.map(yearData => ({
        ...yearData,
        stories: storiesByYear[yearData.year] || [],
        completed: (storiesByYear[yearData.year]?.length || 0) > 0
      })));
    } catch (error) {
      console.error('Error updating timeline stories:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !birthYear) {
      setShowBirthYearModal(true);
    } else if (currentUser && birthYear) {
      generateTimeline();
      updateTimelineStories();
    }
  }, [currentUser, birthYear, generateTimeline, updateTimelineStories]);

  const handleBirthYearSubmit = async (year: number) => {
    try {
      // Save to local store
      setBirthYear(year);
      
      // Save to Firebase profile if user is logged in
      if (currentUser?.uid) {
        await userService.updateUserProfile(currentUser.uid, {
          birthYear: year
        });
      }
    } catch (error) {
      console.error('Error saving birth year:', error);
    }
    setShowBirthYearModal(false);
  };

  const calculateProgress = () => {
    const completedYears = years.filter(y => y.completed).length;
    return Math.round((completedYears / years.length) * 100);
  };

  return (
    <Card
      variant="elevated"
      className="w-72 h-full flex flex-col"
    >
      {!birthYear && !showBirthYearModal && (
        <div className="flex flex-col items-center justify-center h-full">
          <button
            onClick={() => setShowBirthYearModal(true)}
            className={cn(
              components.button.base,
              components.button.variants.primary,
              components.button.sizes.md
            )}
          >
            Set Birth Year
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto relative">
        {Object.entries(yearsByPhase).map(([phaseId, phaseYears], phaseIndex) => {
          const phase = LIFE_PHASES.find(p => p.id === phaseId)!;
          return (
            <div key={phaseId} className="relative">
              <TimelinePhaseLabel
                phase={phase}
                isFirst={phaseIndex === 0}
              />
              
              {phaseYears.map((yearData) => (
                <div 
                  key={yearData.year}
                  className={`pl-12 py-2 relative group cursor-pointer
                           ${selectedYear === yearData.year ? 'bg-[#2a2833]' : 'hover:bg-[#2a2833]'}
                           transition-colors`}
                  onClick={() => setSelectedYear(yearData.year)}
                >
                  <div 
                    className="absolute left-5 top-1/2 -translate-y-1/2 w-3 h-3 
                             rounded-full border-2 transition-colors"
                    style={{
                      backgroundColor: yearData.completed ? phase.color : '#2a2833',
                      borderColor: yearData.completed ? phase.color : '#403c53',
                      boxShadow: selectedYear === yearData.year 
                        ? `0 0 0 2px ${phase.color}40`
                        : 'none'
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white text-shadow-sm transition-colors">
                      {yearData.year}
                    </span>
                    {yearData.stories.length > 0 ? (
                      <span 
                        className="text-xs font-medium text-white px-2 py-1 rounded shadow-md"
                        style={{ 
                          backgroundColor: `${phase.color}90`
                        }}
                      >
                        {yearData.stories.length} {yearData.stories.length === 1 ? 'story' : 'stories'}
                      </span>
                    ) : (
                      <Plus 
                        size={16} 
                        className="text-white opacity-50 group-hover:opacity-100 transition-opacity" 
                      />
                    )}
                  </div>

                  {selectedYear === yearData.year && yearData.stories.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {yearData.stories.map((story) => (
                        <div
                          key={story.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/story/${story.id}`);
                          }}
                          className="p-2 rounded transition-colors cursor-pointer"
                          style={{ 
                            backgroundColor: `${phase.color}80`,
                            borderLeft: `2px solid ${phase.color}`
                          }}
                        >
                          <h4 className="text-sm text-white font-medium">
                            {story.title}
                          </h4>
                          {story.excerpt && (
                            <p className="text-xs text-white mt-1 line-clamp-2">
                              {story.excerpt}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      
      {showBirthYearModal && (
        <BirthYearModal
          onSubmit={handleBirthYearSubmit}
          onClose={() => setShowBirthYearModal(false)}
        />
      )}
    </Card>
  );
}