export const EVALUATION_PROMPT = (transcript, role) => `
You are a senior litigation expert. Analyze the following transcript for the role of ${role}.
Transcript:
${transcript}

Return a JSON object with scores (1-10) and brief comments for:
1. Legal Reasoning
2. Responsiveness
3. Clarity
4. Courtroom Handling

Format:
{
  "overall_score": 0-100,
  "criteria": {
    "legal_reasoning": { "score": 0, "comment": "" },
    "responsiveness": { "score": 0, "comment": "" },
    "clarity": { "score": 0, "comment": "" },
    "courtroom_handling": { "score": 0, "comment": "" }
  },
  "strengths": [],
  "weaknesses": [],
  "judicial_verdict": ""
}
`;
