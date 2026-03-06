import { anonymize } from "./lib/pii";

async function verify() {
    const candidateName = "Xavier Martinez";
    const transcript = "Candidate: Xavier Martinez\nInterviewer: Hello Xavier, your phone is 555-1212.";
    const feedback = "# [NAME]\n## Strengths\nYou did great Xavier Martinez!";

    console.log("--- Original Transcript ---");
    console.log(transcript);
    console.log("\n--- Anonymized Transcript (with exclusion) ---");
    console.log(anonymize(transcript, [candidateName]));

    console.log("\n--- Original Feedback ---");
    console.log(feedback);
    const processedFeedback = feedback.replace("[NAME]", candidateName);
    console.log("\n--- Anonymized Feedback (with exclusion) ---");
    console.log(anonymize(processedFeedback, [candidateName]));
}

verify().catch(console.error);
