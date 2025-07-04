import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";

const Chat = dynamic(() => import("@/components/Chat"), {
  ssr: false,
});

interface HumeChatProps {
  accessToken: string;
  onClose?: () => void;
}

export function HumeChat({ accessToken, onClose }: HumeChatProps) {
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Scroll back to top if no close handler
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="chat-section" 
      className="h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col"
    >
      {/* Header with back button */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          AI Interview Coach
        </h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Ready to Practice?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Click the phone button below to start your AI-powered interview coaching session.
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col min-h-0">
            <Chat accessToken={accessToken} />
          </div>
        </div>
      </div>
    </section>
  );
}
