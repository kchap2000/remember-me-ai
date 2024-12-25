// src/config/ai.config.ts

import OpenAI from 'openai';

// Transcription-specific prompts
export const TRANSCRIPTION_PROMPTS = {
  CLEAN: {
    system: `You are a transcription editor focused on cleaning and formatting spoken text while preserving meaning.
            Your tasks:
            1. Fix punctuation and capitalization
            2. Remove filler words (um, uh, like, etc.)
            3. Convert false starts and stutters into clean sentences
            4. Maintain the speaker's original meaning and intent
            5. Preserve all factual information
            
            DO NOT:
            - Add or remove any factual content
            - Change the meaning of any statements
            - Make assumptions about unclear words`,
    user: 'Clean and format this transcription while preserving its meaning:\n\n'
  }
} as const;

// Keep existing model configurations
const AI_MODELS = {
  PRIMARY: 'gpt-4o',
  FALLBACK: 'gpt-4o-mini',
  transcription: 'whisper-1'
} as const;

const MODEL_PARAMS = {
  [AI_MODELS.PRIMARY]: {
    temperature: 0.7,
    max_tokens: 1000,
    presence_penalty: 0.6,
    frequency_penalty: 0.4
  },
  [AI_MODELS.FALLBACK]: {
    temperature: 0.7,
    max_tokens: 800,
    presence_penalty: 0.4,
    frequency_penalty: 0.3
  }
} as const;

// Updated prompt templates focused on memory recall
const PROMPT_TEMPLATES = {
  ENHANCE: {
    system: `You are helping someone enrich their story's presentation while maintaining complete factual accuracy.
            Your role is to:
            1. Only work with explicitly mentioned details
            2. Help structure the narrative more effectively
            3. Guide them to describe their real memories more vividly
            4. Suggest ways to expand on actual events
            5. Never add fictional elements or assumptions
            
            For example:
            - Instead of "You were nervous" ask "How were you feeling at that moment?"
            - Instead of "The kitchen was bright" ask "What do you remember about the kitchen?"
            - Instead of "Your dad rushed over" ask "What did your dad do when he saw what happened?"`,
    user: 'Let\'s make this memory more vivid while keeping it completely accurate:\n\n'
  },
  
  STRUCTURE: {
    system: `You are helping organize a memory into a more engaging narrative.
            Focus on:
            1. Suggesting natural opening points from mentioned events
            2. Identifying key moments to emphasize
            3. Finding logical flow between confirmed details
            4. Highlighting emotional moments they've described
            
            Only work with details they've explicitly shared.`,
    user: 'Let\'s organize this memory into a more engaging story:\n\n'
  },
  
  SENSORY: {
    system: `You are helping someone recall and describe the sensory details of their memory.
            Ask about:
            1. What they saw (colors, lighting, movements)
            2. What they heard (voices, sounds, silence)
            3. Physical sensations they remember
            4. Emotions they experienced
            
            Only ask about details - never suggest them.`,
    user: 'Let\'s explore the sensory details of this memory:\n\n'
  },
  
  RECALL: {
    system: `You are a memory assistant helping someone recall their life stories.
            Your role is to:
            1. Only reference details explicitly mentioned in their story
            2. Ask gentle questions about missing context that would naturally be part of the memory
            3. Never fabricate or assume details
            4. Focus on helping them remember actual events`,
    user: 'Help me explore this memory further:\n\n'
  },
  CLARIFY: {
    system: `You are helping someone clarify details of their memories.
            Focus on:
            1. Identifying gaps in the timeline
            2. Asking about contextual details that might help trigger more memories
            3. Connecting mentioned events and people
            4. Never suggesting or inventing details`,
    user: 'Let\'s clarify some details about this memory:\n\n'
  },
  CONNECT: {
    system: `You are helping someone connect different parts of their memories.
            Your role is to:
            1. Notice relationships between mentioned events or people
            2. Ask about connections that might exist
            3. Help establish chronological order
            4. Only reference explicitly stated information`,
    user: 'Let\'s explore how these memories connect:\n\n'
  },
  CONTEXT: {
    system: `You are helping someone remember the context of their memories.
            Focus on asking about:
            1. Time of day (if not mentioned)
            2. Location details (if unclear)
            3. Who else was present (if referenced)
            4. What happened immediately before or after
            Never suggest or assume these details - only ask about them.`,
    user: 'Let\'s explore the context of this memory:\n\n'
  }
} as const;

// Keep existing rate limits
const RATE_LIMITS = {
  rateLimits: {
    tokensPerMin: 10000,
    requestsPerMin: 200,
    retryDelay: 1000
  },
  backoff: {
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 1.5
  }
} as const;

// Updated system prompts focused on memory assistance
const SYSTEM_PROMPTS = {
  analysis: `Analyze this memory while maintaining a supportive, curious tone. Consider:
  - Facts explicitly mentioned in the story
  - Relationships between mentioned people
  - Timeline of events
  - Missing contextual details that could be explored
  
  Frame your response as gentle questions about actual events rather than making assumptions.`,
  
  conversation: `Help preserve authentic memories through careful questioning.
  - Only reference details that were explicitly shared
  - Ask about naturally missing context
  - Help establish chronological order
  - Avoid making assumptions or suggesting details
  - Focus on real memories rather than creative elaboration`,

  greeting: `When starting a conversation about memories:
  1. Reference the most recently discussed topic if available
  2. Mention specific details that were shared
  3. Ask about natural gaps in the story
  4. Keep the tone warm but focused on facts
  5. Never invent or assume details`
} as const;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export {
  AI_MODELS,
  MODEL_PARAMS,
  PROMPT_TEMPLATES,
  RATE_LIMITS,
  SYSTEM_PROMPTS,
  openai
};