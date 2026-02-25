/**
 * Script to create ElevenLabs Interview Coach Agent
 *
 * Run with: source .env && node --loader tsx scripts/create-interview-agent.ts
 */

import { ElevenLabsClient } from "elevenlabs";
import { createConversationalAgent } from "../src/lib/elevenlabs";

const SYSTEM_PROMPT = `You are an expert interview coach conducting realistic practice interviews for job candidates. Your role is to ask thoughtful, relevant interview questions and provide constructive feedback.

INTERVIEW TYPES:
- Behavioral: Focus on past experiences using the STAR method (Situation, Task, Action, Result)
- Technical: Ask problem-solving questions, system design, and assess technical depth
- Situational: Present hypothetical on-the-job scenarios
- General: Mix of all interview types for comprehensive practice

CONVERSATION GUIDELINES:
1. Start by introducing yourself and asking what position they're preparing for
2. Ask 5-7 questions appropriate to the interview type
3. Listen carefully to responses and ask 1-2 follow-up questions to dig deeper
4. Be encouraging but professional - this should feel like a real interview
5. After each answer, provide brief feedback on strengths and areas for improvement
6. Keep questions realistic and relevant to actual job interviews
7. End the session by summarizing their performance and key takeaways

TONE: Professional, supportive, and conversational. You want to challenge the candidate while building their confidence.`;

const FIRST_MESSAGE = `Hi! I'm Sarah, your interview coach. I'm here to help you practice and improve your interview skills in a realistic setting.

To get started, could you tell me what position or role you're preparing to interview for?`;

async function main() {
  console.log("🎙️  Creating ElevenLabs Interview Coach Agent...\n");

  try {
    // Get Sarah's voice ID
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY not found in environment");
    }

    const client = new ElevenLabsClient({ apiKey });
    const voices = await client.voices.getAll();

    const sarahVoice = voices.voices.find(
      (v) => v.name?.toLowerCase() === "sarah"
    );

    if (!sarahVoice) {
      console.error("❌ Sarah voice not found. Available voices:");
      voices.voices.slice(0, 10).forEach((v) => {
        console.log(`   - ${v.name ?? "unnamed"} (${v.voice_id})`);
      });
      process.exit(1);
    }

    console.log(`✅ Found Sarah voice: ${sarahVoice.voice_id}\n`);

    // Create the agent
    console.log("📝 Creating agent with configuration:");
    console.log(`   Name: Interview Coach - DeepPivot`);
    console.log(`   Voice: Sarah (${sarahVoice.voice_id})`);
    console.log(`   Model: ElevenLabs Turbo v2.5`);
    console.log(`   Stability: 0.5`);
    console.log(`   Similarity Boost: 0.75`);
    console.log(`   Style: 0.3\n`);

    const agent = await createConversationalAgent({
      name: "Interview Coach - DeepPivot",
      systemPrompt: SYSTEM_PROMPT,
      firstMessage: FIRST_MESSAGE,
      voiceId: sarahVoice.voice_id,
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.3,
    });

    console.log("\n🎉 Agent created successfully!\n");
    console.log(`Agent ID: ${agent.agent_id}`);
    console.log(`\n📋 Next steps:`);
    console.log(`\n1. Add this to your .env file:`);
    console.log(`   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=${agent.agent_id}`);
    console.log(`\n2. Restart your development server:`);
    console.log(`   npm run dev`);
    console.log(`\n3. Test the interview feature at:`);
    console.log(`   http://localhost:3000/dashboard/interviews/session`);

    return agent.agent_id;
  } catch (error) {
    console.error("\n❌ Error creating agent:", error);
    if (error instanceof Error) {
      console.error("Details:", error.message);
    }
    process.exit(1);
  }
}

main();
