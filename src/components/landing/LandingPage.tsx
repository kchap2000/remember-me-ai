import React, { useState, useEffect } from 'react';
import { Brain, ChevronDown, Edit3, Heart, Share2, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginModal } from '../auth/LoginModal';
import heroImage from '../../assets/images/landing/universal_upscale_0_2cb14607-ce3e-4957-82d1-92e40dbedfa1_0.jpg';
import visionImage from '../../assets/images/landing/universal_upscale_0_ad1d0193-4fff-41dd-8424-a94851d0592c_0.jpg';

const features = [
  {
    icon: Edit3,
    title: 'Story Editor',
    description: 'Effortlessly begin or continue writing your life story.',
  },
  {
    icon: Heart,
    title: 'AI Assistant',
    description: 'Receive real-time support for crafting, refining, and enhancing your narrative.',
  },
  {
    icon: Share2,
    title: 'Connections',
    description: 'Link people to your story and see how they fit into your timeline.',
  },
  {
    icon: History,
    title: 'Life Timeline',
    description: 'Automatically organize your memories into a personal life timeline.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create an Account',
    description: 'Sign up securely to begin your journey.',
  },
  {
    number: '02',
    title: 'Start Your Story',
    description: 'Use the AI-powered editor to craft or continue your story.',
  },
  {
    number: '03',
    title: 'Build Connections',
    description: 'Link people and moments to create a richer narrative.',
  },
  {
    number: '04',
    title: 'Preserve Your Timeline',
    description: 'Watch as your stories come together in a beautifully organized timeline.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const handleAuth = (mode: 'signup' | 'login') => {
    setIsSignUp(mode === 'signup');
    setShowLoginModal(true);
  };

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-background-primary text-text-primary animate-fade-in">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-surface">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/40" />
          <img
            src={heroImage}
            alt="Family memories"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-text-primary text-shadow-lg">
            Welcome to Remember Me AI
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-text-secondary max-w-3xl mx-auto text-shadow-md">
            Join us in shaping the future of personal storytelling. You're among the first to explore this beta version.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => handleAuth('signup')}
              className="px-8 py-4 bg-accent-primary hover:bg-accent-secondary rounded-lg text-lg font-semibold transition-colors shadow-glow hover:shadow-glow-strong"
            >
              Sign Up
            </button>
            <button 
              onClick={() => handleAuth('login')}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-lg text-lg font-semibold transition-colors backdrop-blur-sm shadow-md"
            >
              Login
            </button>
          </div>
          <p className="text-text-secondary italic text-shadow-sm">Help us shape the future of memory preservation.</p>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-text-secondary">
          <ChevronDown className="w-8 h-8 text-white/70" />
        </div>
      </div>

      {/* Vision Section */}
      <section className="py-24 bg-[#232328]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="mb-8">
                <Brain className="w-12 h-12 text-[#4B23E8] mb-4" />
                <h2 className="text-4xl font-bold mb-6">
                  Our Vision: Preserving Life Stories and Building Connections
                </h2>
              </div>
              <div className="space-y-6 text-gray-300">
                <p>
                  Remember Me AI is not just about capturing stories. Our long-term vision includes incorporating photos and 
                  generative media to recreate cherished moments, aiding memory recall for those struggling with challenges 
                  like dementia, and connecting life's dots to build a comprehensive picture of who we are.
                </p>
                <p>
                  Imagine a platform that becomes a true connector—helping families build out lifelines, family trees, and 
                  preserve memories for future generations. This is just the beginning, and we can't wait to see how this 
                  transformative journey unfolds.
                </p>
              </div>
            </div>
            <div className="flex-1">
              <img
                src={visionImage}
                alt="Family connection"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold mb-4">What You Can Do in This Beta Version</h2>
            <p className="text-text-tertiary max-w-2xl mx-auto">
              Experience the core features that make Remember Me AI unique and powerful.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors shadow-md hover:shadow-lg animate-fade-in-up"
              >
                <feature.icon className="w-12 h-12 text-accent-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-tertiary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

            {/* Feedback Section */}
      <section className="py-24 bg-[#232328]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#4B23E8] to-[#6D4AE6] rounded-2xl p-12 text-center">
            <h2 className="text-4xl font-bold mb-6">Your Feedback Shapes Our Future</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              As one of our first users, your insights are invaluable. Help us refine and grow Remember Me AI 
              into the best memory-preserving tool.
            </p>
            <button className="px-8 py-4 bg-white text-[#4B23E8] rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Let's Work Together To Make This Better
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-[#1A1A1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-16 text-center">How Remember Me AI Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="text-6xl font-bold text-[#4B23E8]/20 mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1A1A1E] py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Remember Me AI</h3>
              <p className="text-gray-400 text-sm">
                Preserving memories and connecting generations through the power of AI.
              </p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Remember Me AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        defaultMode={isSignUp ? 'signup' : 'login'}
      />
    </div>
  );
}