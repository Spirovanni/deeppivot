import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { Phone, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface StartCallProps {
  accessToken?: string;
  configId?: string;
}

export default function StartCall({ accessToken, configId }: StartCallProps = {}) {
  const { status, connect, disconnect, readyState, messages } = useVoice();
  
  // Debug: Log what props we received
  console.log('StartCall component initialized with:', {
    hasAccessToken: !!accessToken,
    accessTokenLength: accessToken?.length,
    hasConfigId: !!configId
  });
  const [showButton, setShowButton] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const maxRetries = 3;
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    // Simple check - always show button when the component mounts
    // This ensures it works in all contexts including the chat section
    setShowButton(true);
    
    // Optional: Add scroll-based hiding/showing for landing page context
    const chatSection = document.getElementById('chat-section');
    if (chatSection) {
      // If we're in the chat section, always show the button
      return;
    }

    // If we're on the landing page, use scroll logic
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

  // Monitor connection state changes with retry logic
  useEffect(() => {
    console.log('Voice connection state changed:', {
      status: status,
      readyState: readyState,
      messagesCount: messages?.length || 0,
      retryCount,
      statusValue: status.value,
      statusReason: status.reason,
      isConnectingState: isConnecting,
      timestamp: new Date().toISOString()
    });
    
    // Debug: Log when we get disconnected without calling connect
    if (status.value === 'disconnected' && !isConnecting) {
      console.log('🚨 Got disconnected status without active connection attempt. This suggests VoiceProvider initialization issue.');
    }
    
    if (status.value === 'connected') {
      console.log(`🎉 Voice connection successful! [${connectionId}]`);
      setIsConnecting(false);
      setRetryCount(0);
      isConnectingRef.current = false;
      
      // Clear any pending timeouts
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    } else if (status.value === 'connecting') {
      console.log('🔄 Connecting to voice...');
      setIsConnecting(true);
    } else if (status.value === 'disconnected') {
      console.log(`❌ Voice disconnected [${connectionId}]:`, status.reason);
      setIsConnecting(false);
      isConnectingRef.current = false;
      
      // Only retry if it was an unexpected disconnection and we haven't hit max retries
      if (isConnecting && retryCount < maxRetries && status.reason !== 'user_initiated') {
        console.log(`🔄 Attempting retry ${retryCount + 1}/${maxRetries} in ${2 * (retryCount + 1)} seconds... [${connectionId}]`);
        
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          handleConnect();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      } else if (retryCount >= maxRetries) {
        console.error(`❌ Max retries reached. Connection failed. [${connectionId}]`);
        setIsConnecting(false);
        setRetryCount(0);
        isConnectingRef.current = false;
      }
    }
    
    // Cleanup timeouts on unmount
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [status, readyState, messages, isConnecting, retryCount, connectionId]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts on unmount
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      isConnectingRef.current = false;
    };
  }, []);

  // Extracted connection logic with React Strict Mode handling
  const handleConnect = async () => {
    // Prevent double connections due to React Strict Mode
    if (isConnectingRef.current) {
      console.log('Connection already in progress (ref check)');
      return;
    }

    if (status.value === 'connected') {
      console.log('Already connected to voice!');
      return;
    }
    
    if (isConnecting) {
      console.log('Already connecting to voice...');
      return;
    }

    // Generate unique connection ID to track this attempt
    const currentConnectionId = Math.random().toString(36).substring(7);
    setConnectionId(currentConnectionId);
    isConnectingRef.current = true;

    try {
      setIsConnecting(true);
      console.log(`🔄 Starting connection attempt [${currentConnectionId}]`);
      
      // Check microphone permissions first
      console.log('🎤 Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      // Check if this connection is still valid (not superseded by another)
      if (connectionId !== currentConnectionId) {
        console.log(`⚠️ Connection superseded [${currentConnectionId}]`);
        return;
      }
      
      // Debug the props we have
      console.log(`🔍 Debug info [${currentConnectionId}]:`, {
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length,
        accessTokenPreview: accessToken ? accessToken.substring(0, 8) + '...' : 'null',
        hasConfigId: !!configId,
        statusBeforeConnect: status.value
      });
      
      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (connectionId === currentConnectionId && status.value === 'connecting') {
          console.warn(`⏰ Connection timeout [${currentConnectionId}] - disconnecting`);
          disconnect();
          setIsConnecting(false);
          isConnectingRef.current = false;
        }
      }, 15000);
      
      // Attempt connection
      console.log(`🔗 Initiating WebSocket connection [${currentConnectionId}]`, {
        hasAccessToken: !!accessToken,
        hasConfigId: !!configId,
        accessTokenLength: accessToken?.length
      });
      
      // Connect using v0.1.x API (no parameters needed, uses VoiceProvider auth)
      console.log('About to call connect() with VoiceProvider auth');
      console.log('VoiceProvider should have:', {
        hasAccessToken: !!accessToken,
        hasConfigId: !!configId
      });
      
      const result = await connect();
      console.log('Connect result:', result);
      
      console.log(`🔄 Connection attempt completed [${currentConnectionId}]`);
      
    } catch (error) {
      console.error(`❌ Voice connection failed [${currentConnectionId}]:`, error);
      
      // Only update state if this is still the current connection attempt
      if (connectionId === currentConnectionId) {
        setIsConnecting(false);
        isConnectingRef.current = false;
      }
      
      // Show user-friendly error messages
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Microphone access denied. Please allow microphone access.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone.');
        } else {
          alert(error.message ?? 'Connection failed. Please try again.');
        }
      } else {
        alert('Connection failed. Please try again.');
      }
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    }
  };

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
                disabled={isConnecting}
                className={
                  "relative z-10 group flex items-center gap-3 px-8 py-4 rounded-full " +
                  "bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 " +
                  (isConnecting ? 
                    "opacity-75 cursor-not-allowed" : 
                    "hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-700 hover:scale-105"
                  ) + " " +
                  "text-white font-semibold text-lg shadow-2xl " +
                  "transform transition-all duration-300 ease-out " +
                  "hover:shadow-emerald-500/25 " +
                  "border border-white/20 backdrop-blur-sm " +
                  "active:scale-95"
                }
                onClick={() => {
                  console.log('Let\'s Build button clicked! Current state:', {
                    statusValue: status.value,
                    isConnecting,
                    retryCount
                  });
                  handleConnect();
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
                  {isConnecting ? 
                    (retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Connecting...') 
                    : 'Let\'s Build!'
                  }
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
