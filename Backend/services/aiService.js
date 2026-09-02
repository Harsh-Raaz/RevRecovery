const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
});

const diagnosePayment = async (payment) => {
  const prompt = `
You are an AI Revenue Recovery Agent.

Analyze this failed payment and determine:
1. Diagnosis
2. Root cause
3. Confidence
4. Probability of recovery
5. Best recovery action
6. Recommended retry delay
7. Customer message
8. Risk level

Possible actions:
RETRY
CONTACT_CUSTOMER
WAIT
STOP

Rules:
- Never recommend more than 3 retries.
- Never claim that money was recovered unless payment status is SUCCESS.
- Do not expose sensitive payment information.
- Confidence must be between 0 and 1.
- Recovery probability must be between 0 and 1.
- Return ONLY valid JSON.

Payment data:
${JSON.stringify(payment, null, 2)}

Return exactly:

{
  "diagnosis": "",
  "rootCause": "",
  "confidence": 0,
  "recoveryProbability": 0,
  "recommendedAction": "RETRY",
  "retryAfterMinutes": 15,
  "customerMessage": "",
  "reasoning": "",
  "riskLevel": "LOW"
}
`;

  const result = await model.generateContent(prompt);

  const text = result.response.text();

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
};

module.exports = {
  diagnosePayment,
};