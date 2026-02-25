/**
 * Script to help set up ElevenLabs Conversational AI agent
 * Run with: npx tsx scripts/setup-elevenlabs-agent.ts
 */

import { ElevenLabsClient } from "elevenlabs";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log("🎙️  ElevenLabs Interview Coach Agent Setup\n");

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("❌ ELEVENLABS_API_KEY not found in environment variables");
    process.exit(1);
  }

  const client = new ElevenLabsClient({ apiKey });

  try {
    // List existing agents
    console.log("📋 Checking existing agents...\n");
    const agentsPage = await client.conversationalAi.getAgents();
    const agents = agentsPage.agents ?? [];

    if (agents.length > 0) {
      console.log("Found existing agents:");
      agents.forEach((agent, idx: number) => {
        console.log(`${idx + 1}. ${agent.name || "Unnamed"} (ID: ${agent.agent_id})`);
      });
      console.log();

      const useExisting = await question("Would you like to use an existing agent? (y/n): ");
      if (useExisting.toLowerCase() === "y") {
        const agentNum = await question("Enter agent number: ");
        const selectedAgent = agents[parseInt(agentNum) - 1];
        const agentId = selectedAgent.agent_id;

        console.log(`\n✅ Selected agent: ${selectedAgent.name}`);
        console.log(`\n📝 Add this to your .env file:`);
        console.log(`NEXT_PUBLIC_ELEVENLABS_AGENT_ID=${agentId}`);

        rl.close();
        return;
      }
    }

    // Get available voices
    console.log("\n🎤 Fetching available voices...\n");
    const voices = await client.voices.getAll();

    console.log("Recommended professional voices:");
    const professionalVoices = voices.voices?.slice(0, 10) || [];
    professionalVoices.forEach((voice: any, idx: number) => {
      console.log(`${idx + 1}. ${voice.name} (${voice.labels?.accent || 'Unknown accent'}, ${voice.labels?.age || 'Unknown age'})`);
    });

    console.log("\n📄 Recommended Agent Configuration:");
    console.log("=" .repeat(60));
    console.log(`
Agent Name: Interview Coach

System Prompt:
You are an expert career coach and interview specialist conducting professional interview practice sessions. Your role is to:

1. Conduct realistic job interviews across different types:
   - Behavioral: Focus on STAR method (Situation, Task, Action, Result)
   - Technical: Assess problem-solving and technical knowledge
   - Situational: Explore how candidates handle hypothetical scenarios
   - General: Comprehensive assessment of skills and experience

2. Interview Style:
   - Ask one question at a time
   - Allow the candidate to fully respond before asking follow-ups
   - Provide brief acknowledgments (e.g., "I see," "That's interesting")
   - Ask natural follow-up questions based on their answers
   - Be professional, encouraging, and realistic

3. Questions to Ask:
   - Start with: "Tell me about yourself and your background"
   - Ask about specific experiences relevant to their field
   - Probe for details using "Can you tell me more about...?"
   - Ask about challenges, learnings, and outcomes
   - Conclude with: "Do you have any questions for me?"

4. Feedback Approach:
   - Be constructive and supportive
   - Note strong answers and areas for improvement
   - Keep the conversation flowing naturally

First Message:
"Hello! I'm your AI interview coach, and I'm here to help you practice for real interviews. I'll be conducting a professional interview simulation. We can focus on behavioral questions, technical discussions, situational scenarios, or do a general interview. Let's start with: Can you tell me a bit about yourself and what type of role you're preparing for?"

Voice: Choose a professional, clear voice (e.g., "Rachel" or "Chris" for American accent)

Settings:
- Language: English
- Stability: 0.5 (balanced)
- Similarity: 0.75 (consistent voice)
- Style: 0.0 (neutral, professional)
    `);
    console.log("=" .repeat(60));

    console.log("\n🔗 Next Steps:");
    console.log("1. Go to: https://elevenlabs.io/app/conversational-ai");
    console.log("2. Click 'Create Agent'");
    console.log("3. Copy the configuration above");
    console.log("4. After creating, copy the Agent ID");
    console.log("5. Add to .env: NEXT_PUBLIC_ELEVENLABS_AGENT_ID=<your-agent-id>");
    console.log("\n💡 Tip: Test your agent in the ElevenLabs dashboard before using it in the app!\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    rl.close();
  }
}

main();
