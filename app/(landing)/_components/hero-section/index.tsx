"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { SignUpButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useState, useLayoutEffect } from "react";

interface HeroSectionProps {
  onGetStarted?: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [isClient, setIsClient] = useState(false);

  useLayoutEffect(() => {
    setIsClient(true);
  }, []);

  const scrollToChat = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      // Fallback: Calculate the scroll position that will trigger the chat to show
      // Based on the logic in page.tsx: rect.bottom < windowHeight * 0.3
      // We need to scroll past the FeatureBentoGrid section
      const windowHeight = window.innerHeight;
      const targetScroll = windowHeight * 2; // Scroll past hero + feature bento grid
      
      window.scrollTo({ 
        top: targetScroll,
        behavior: 'smooth'
      });
      
      // Alternative approach: try to find and scroll to chat-section after a delay
      setTimeout(() => {
        const chatSection = document.getElementById('chat-section');
        if (chatSection) {
          chatSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 1000); // Give time for the chat to appear
    }
  };

  return (
    <div className="relative my-10 flex flex-col items-center justify-center">
      {/* <Navbar /> */}

      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="px-4 py-10 md:py-20">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-7xl dark:text-slate-300">
          {"Ace your next interview with AI coaching"
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>
        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 0.8,
          }}
          className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400"
        >
          Practice with our AI career coach that understands your emotions and provides personalized feedback to help you succeed.
        </motion.p>
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.3,
            delay: 1,
          }}
          className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          {isClient && <HeroButtons onGetStarted={scrollToChat} />}
        </motion.div>
        <motion.div
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.3,
            delay: 1.2,
          }}
          className="relative z-10 mt-20 mx-auto max-w-2xl"
        >
          <div 
            id="hero-image"
            className="rounded-2xl border border-gray-300 bg-white p-2 shadow-xl dark:border-gray-600 dark:bg-gray-800"
          >
            <Image
              src="/landing-mock.png"
              alt="Deep Pivot interview coaching platform preview"
              width={1024}
              height={1536}
              className="aspect-[2/3] w-full h-auto object-cover rounded-xl"
              priority
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Separate component for hero buttons to handle Clerk hooks properly
const HeroButtons = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <>
        <button 
          onClick={onGetStarted}
          className="w-44 transform rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-3 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-600 hover:to-pink-600"
        >
          Start Session
        </button>
        <button 
          onClick={() => {
            // Scroll to features section for logged in users
            const featuresSection = document.querySelector('[data-features-section]');
            if (featuresSection) {
              featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="w-44 transform rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-black transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:from-gray-800 dark:hover:to-gray-900"
        >
          Learn More
        </button>
      </>
    );
  }

  return (
    <>
      <SignUpButton mode="modal">
        <button className="w-44 transform rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-3 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-violet-600 hover:to-pink-600">
          Get Started Free
        </button>
      </SignUpButton>
      <button 
        onClick={() => {
          // Scroll to features section for non-logged in users
          const featuresSection = document.querySelector('[data-features-section]');
          if (featuresSection) {
            featuresSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="w-44 transform rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-black transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:from-gray-800 dark:hover:to-gray-900"
      >
        Learn More
      </button>
    </>
  );
};