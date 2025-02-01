import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory, BaseMemory } from 'langchain/memory';
import { ChatPromptTemplate } from 'langchain/prompts';
import { BaseMessage, SystemMessage, HumanMessage } from 'langchain/schema';
import { PROMPT_TEMPLATES } from '../../config/ai.config';
import type { StoryContext } from '../../types/chat';

// Initialize ChatOpenAI with environment variables
const model = new ChatOpenAI({
  openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY,
  modelName: 'gpt-4o',
  temperature: 0.7
});

// Create unified conversation prompt template
const createUnifiedPrompt = () => {
  return ChatPromptTemplate.fromPromptMessages([
    ['system', `You are a supportive AI writing assistant helping users develop their stories 
      through natural conversation. Your name is Muse, and you're passionate about helping people 
      preserve and enhance their memories through storytelling. 
      
      When responding to a greeting message:
      - Return ONLY the initial greeting: "Hi! I'm Muse, your writing companion. I'm here to help you capture and develop your stories. I love how every memory has its own unique voice and emotional resonance."
      - Do not add any analysis or suggestions yet
      
      For all other messages, your approach:
      1. Start with genuine curiosity about their story
      2. Ask thoughtful questions that help them explore deeper
      3. Notice emotional moments and gently encourage elaboration
      4. Offer specific, actionable suggestions in a conversational way
      5. Keep responses concise and engaging
      6. Use a warm, encouraging tone
      7. React naturally to what they share
      
      When analyzing context:
      1. Pay attention to explicit time/location mentions
      2. Consider historical context of mentioned years
      3. Note any uncertainty or memory gaps
      4. Validate and build upon confirmed details
      5. Be sensitive to emotional significance
      
      Format your regular responses to:
      2. Acknowledge what was shared
      2. Address any expressed uncertainty
      3. Build on confirmed details
      4. Ask focused follow-up questions
      5. Offer gentle suggestions for development`],
    ['human', '{input}']
  ]);
};

// Create story processor with unified chain
export const createStoryProcessor = async (context: StoryContext, memory?: BaseMemory) => {
  const chain = new ConversationChain({
    memory: memory || new BufferMemory({ returnMessages: true }),
    prompt: createUnifiedPrompt(),
    llm: model
  });

  return {
    invoke: async ({ input, updateMode = false }) => {
      // For greeting messages, return only the initial greeting
      if (input.isGreeting) {
        return { 
          content: "Hi! I'm Remo, your writing companion. I'm here to help you capture and develop your stories. I love how every memory has its own unique voice and emotional resonance."
        };
      }

      // Format context string
      const formattedContext = `
Story Context:
Title: ${context.metadata.title}
Content: ${context.content}
Tags: ${context.metadata.tags.join(', ')}
${context.metadata.contextualDetails ? 
  `Time Period: ${JSON.stringify(context.metadata.contextualDetails.timePeriod)}
Location: ${JSON.stringify(context.metadata.contextualDetails.location)}
Historical Context: ${JSON.stringify(context.metadata.contextualDetails.historicalContext)}` 
  : ''}

User Message: ${input.content}

Instructions: ${updateMode ? 
  'Generate an updated version of the story incorporating recent feedback.' :
  'Provide a thoughtful response that helps develop the story further.'}`;

      const response = await chain.call({
        input: formattedContext
      });

      return { content: response.response };
    }
  };
};