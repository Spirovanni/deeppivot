"use client";

import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import { ComponentRef, useRef } from "react";

export default function ClientComponent({
  accessToken,
}: {
  accessToken: string;
}) {
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);

  // optional: use configId from environment variable
  const configId = process.env['NEXT_PUBLIC_HUME_CONFIG_ID'];
  
  // Debug logging
  console.log('Chat component initialization:', {
    accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : 'null',
    accessTokenLength: accessToken?.length,
    configId,
    hasConfigId: !!configId,
    accessTokenValid: accessToken && accessToken.length > 10,
    configIdValid: configId && configId.length > 30
  });
  
  return (
    <div
      className={
        "relative grow flex flex-col mx-auto w-full overflow-hidden min-h-[600px]"
      }
    >
      <VoiceProvider
        auth={{ type: "accessToken", value: accessToken }}
        onMessage={() => {
          if (timeout.current) {
            window.clearTimeout(timeout.current);
          }

          timeout.current = window.setTimeout(() => {
            if (ref.current) {
              const scrollHeight = ref.current.scrollHeight;

              ref.current.scrollTo({
                top: scrollHeight,
                behavior: "smooth",
              });
            }
          }, 200);
        }}
        onOpen={() => {
          console.log('🟢 VoiceProvider WebSocket opened successfully!');
        }}
        onClose={(event) => {
          console.log('🔴 VoiceProvider WebSocket closed:', {
            code: event?.code,
            reason: event?.reason,
            wasClean: event?.wasClean
          });
        }}
        onError={(error) => {
          console.error('❌ VoiceProvider WebSocket error:', error);
          alert(error.message ?? "Something went wrong");
        }}
      >
        <Messages ref={ref} />
        <Controls />
        <StartCall accessToken={accessToken} configId={configId} />
      </VoiceProvider>
    </div>
  );
}
