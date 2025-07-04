import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import dynamic from "next/dynamic";
import { HeroSection } from "./_components/hero-section";

const Chat = dynamic(() => import("@/components/Chat"), {
  ssr: false,
});

export default async function Page() {
  const accessToken = await getHumeAccessToken();

  if (!accessToken) {
    throw new Error('Unable to get access token');
  }

  return (
    <div className={"min-h-screen flex flex-col"}>
      <HeroSection />
      
      {/* Chat Section */}
      <section 
        id="chat-section" 
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4"
      >
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Ready to Practice?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Click the phone button below to start your AI-powered interview coaching session.
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[600px] flex flex-col">
            <Chat accessToken={accessToken} />
          </div>
        </div>
      </section>
    </div>
  );
}
