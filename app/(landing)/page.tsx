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
  const featureBentoRef = useRef<HTMLDivElement>(null);

  // Get access token on mount
  useEffect(() => {
    const fetchToken = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/hume-token');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch access token');
        }
        
        setAccessToken(data.accessToken);
      } catch (error) {
        console.error('Failed to get access token:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Application</h2>
          <p className="text-gray-600">{error || 'Unable to get access token'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HeroSection />
      
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
          <HumeChat 
            accessToken={accessToken} 
            onClose={() => {
              // Scroll back to the FeatureBentoGrid section
              if (featureBentoRef.current) {
                featureBentoRef.current.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
