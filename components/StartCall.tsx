import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { Phone, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function StartCall() {
  const { status, connect } = useVoice();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if we're in the chat section (forced display)
    const chatSection = document.getElementById('chat-section');
    if (chatSection) {
      // If chat section exists, show button immediately
      setShowButton(true);
      return;
    }

    const handleScroll = () => {
      const heroImage = document.getElementById('hero-image');
      if (heroImage) {
        const imageRect = heroImage.getBoundingClientRect();
        // Show button when the image is mostly scrolled past (80% of image height)
        const imageBottom = imageRect.bottom;
        const threshold = window.innerHeight * 0.2; // Show when 80% of image is scrolled past
        
        setShowButton(imageBottom < threshold);
      }
    };

    // Initial check for scroll position
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Also check when the component mounts or updates if chat section exists
  useEffect(() => {
    const checkChatSection = () => {
      const chatSection = document.getElementById('chat-section');
      if (chatSection) {
        setShowButton(true);
      }
    };

    // Check immediately
    checkChatSection();
    
    // Use MutationObserver to detect when chat section is added to DOM
    const observer = new MutationObserver(checkChatSection);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  return (
    <AnimatePresence>
      {status.value !== "connected" && showButton ? (
        <motion.div
          className={"fixed inset-0 p-4 flex items-center justify-center bg-background"}
          initial="initial"
          animate="enter"
          exit="exit"
          variants={{
            initial: { opacity: 0 },
            enter: { opacity: 1 },
            exit: { opacity: 0 },
          }}
        >
          <AnimatePresence>
            <motion.div
              variants={{
                initial: { scale: 0.5 },
                enter: { scale: 1 },
                exit: { scale: 0.5 },
              }}
              className="relative"
            >
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 opacity-75 blur-xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <button
                className={
                  "relative z-10 group flex items-center gap-3 px-8 py-4 rounded-full " +
                  "bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 " +
                  "hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 " +
                  "text-white font-semibold text-lg shadow-2xl " +
                  "transform transition-all duration-300 ease-out " +
                  "hover:scale-105 hover:shadow-emerald-500/25 " +
                  "border border-white/20 backdrop-blur-sm " +
                  "active:scale-95"
                }
                onClick={() => {
                  connect()
                    .then(() => {})
                    .catch(() => {})
                    .finally(() => {});
                }}
              >
                {/* Sparkle icon with animation */}
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="size-5 text-white drop-shadow-lg" />
                </motion.div>
                
                {/* Button text with subtle animation */}
                <motion.span
                  className="relative"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Let's Build!
                </motion.span>
                
                {/* Phone icon with pulse animation */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Phone
                    className={"size-5 text-white fill-current drop-shadow-lg"}
                    strokeWidth={0}
                  />
                </motion.div>
                
                {/* Subtle inner glow */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
              </button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
