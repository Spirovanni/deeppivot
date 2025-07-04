"use client";

import { HeroSection } from "./_components/hero-section";
import { FeatureBentoGrid } from "./_components/feature-bento-grid";
import { HumeChat } from "./_components/hume-chat";
import { useState, useEffect, useRef } from "react";

interface PageProps {}

export default function Page({}: PageProps) {
  const [showHumeChat, setShowHumeChat] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const featureBentoRef = useRef<HTMLDivElement>(null);

  // Function to force show chat (called from Get Started button)
  const forceShowChat = () => {
    if (accessToken) {
      setShowHumeChat(true);
    } else {
      // If no access token, try to fetch it first
      fetchToken().then(() => {
        setShowHumeChat(true);
      }).catch(() => {
        // Show error but still allow viewing the chat interface
        setError("Unable to get access token, but you can still explore the interface");
        setShowHumeChat(true);
      });
    }
  };

  // Extract token fetching logic into a separate function
  const fetchToken = async () => {
    try {
      setDebugInfo("Fetching access token...");
      const response = await fetch('/api/hume-token');
      setDebugInfo(`Response status: ${response.status}`);
      
      const data = await response.json();
      setDebugInfo(`Response data: ${JSON.stringify(data)}`);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch access token');
      }
      
      setAccessToken(data.accessToken);
      setDebugInfo("Access token received successfully");
      return data.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}`);
      throw error;
    }
  };

  // Get access token on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        await fetchToken();
      } catch (error) {
        // Continue loading the app even if token fetch fails
        console.warn('Continuing without access token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!featureBentoRef.current) return;

      const rect = featureBentoRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Show HumeChat when user has scrolled significantly past FeatureBentoGrid
      // This ensures FeatureBentoGrid is fully viewed before transition
      const scrolledPastThreshold = rect.bottom < windowHeight * 0.3;
      
      setShowHumeChat(scrolledPastThreshold);
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="mb-2">Loading...</p>
          <p className="text-sm text-gray-600">{debugInfo}</p>
          <button 
            onClick={() => {
              setIsLoading(false);
              setError("Skipped loading - continuing without full initialization");
            }}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Skip & Continue
          </button>
        </div>
      </div>
    );
  }

  if (error && !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-4">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Application</h2>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-4">{debugInfo}</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={() => {
                setError(null);
                setIsLoading(false);
              }} 
              className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Continue Without Voice Features
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection onGetStarted={forceShowChat} />
      
      {/* FeatureBentoGrid with proper spacing */}
      <section 
        ref={featureBentoRef}
        className="py-20 px-4 min-h-screen flex items-center justify-center"
      >
        <div className="w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Why Choose Our AI Coach?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Discover the features that make our interview coaching platform unique and effective.
            </p>
          </div>
          <FeatureBentoGrid />
        </div>
      </section>

      {/* Spacer to ensure smooth transition */}
      <div className="h-screen"></div>

      {/* HumeChat - only show when scrolled past FeatureBentoGrid */}
      {showHumeChat && (
        <div 
          className="fixed inset-0 z-50 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out"
          style={{
            opacity: showHumeChat ? 1 : 0,
            transform: showHumeChat ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          {accessToken ? (
            <HumeChat 
              accessToken={accessToken} 
              onClose={() => {
                setShowHumeChat(false);
                // Scroll back to the top
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Voice Features Unavailable</h2>
                <p className="text-gray-600 mb-4">Unable to connect to voice services.</p>
                <button 
                  onClick={() => setShowHumeChat(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
