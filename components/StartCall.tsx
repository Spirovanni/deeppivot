import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
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
            >
              <Button
                className={"z-50 flex items-center gap-1.5 rounded-full"}
                onClick={() => {
                  connect()
                    .then(() => {})
                    .catch(() => {})
                    .finally(() => {});
                }}
              >
                <span>
                  <Phone
                    className={"size-4 opacity-50 fill-current"}
                    strokeWidth={0}
                  />
                </span>
                <span>Let's Build!</span>
              </Button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
