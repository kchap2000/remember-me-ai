import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../layout/Card';
import { cn } from '../../utils/cn';
import { components } from '../../styles/components';
import type { Story } from '../../types';

interface StoryCardProps {
  story: Story & { status: string };
}

export function StoryCard({ story }: StoryCardProps) {
  const navigate = useNavigate();

  return (
    <div className="p-4 animate-fade-in-up">
      <Card 
        variant="surface" 
        className="flex items-stretch justify-between gap-4 group hover:shadow-glow"
      >
        <div className="flex flex-[2_2_0px] flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-text-tertiary text-sm group-hover:text-text-secondary transition-colors">
              {story.status}
            </p>
            <p className="text-text-primary text-lg font-bold group-hover:text-white transition-colors">
              {story.title}
            </p>
            <p className="text-text-tertiary text-sm line-clamp-2">{story.content}</p>
          </div>
          <button
            onClick={() => navigate(`/story/${story.id}`)}
            aria-label={`Continue editing ${story.title}`}
            className={cn(
              components.button.base,
              components.button.variants.secondary,
              components.button.sizes.sm,
              "w-fit opacity-0 group-hover:opacity-100 transition-opacity"
            )}
          >
            <span className="truncate">Continue</span>
          </button>
        </div>
        <div
          className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl flex-1 
                   transition-transform duration-300 group-hover:scale-[1.02]"
          style={{ backgroundImage: `url(${story.coverImage})` }}
          role="img"
          aria-label={`Cover image for ${story.title}`}
        />
      </Card>
    </div>
  );
}