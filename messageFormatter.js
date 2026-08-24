const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a fleet maintenance notification assistant. Convert JSON inspection data into a concise SMS message.
Rules:
- Defects found → start with: 🚨 NEW MAINTENANCE ISSUE
- No defects → start with: ✅ INSPECTION PASSED
- Include vehicle number, inspection type, each defect (category + notes)
- If driver_name exists in JSON, include as 'Driver: <name>'
- Under 150 words, plain text only — no markdown, no asterisks
- End defect reports with: 'Please inspect and resolve.'`;

async function formatInspectionMessage(data) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Convert to SMS message:\n${JSON.stringify(data, null, 2)}` },
        ],
      });

      const message = completion.choices[0].message.content?.trim();
      if (message) return message;
      console.log(`Attempt ${attempt} returned empty — retrying...`);
    } catch (err) {
      console.error(`Groq attempt ${attempt} failed:`, err.message);
    }
  }

  // Fallback if all attempts fail
  const defects = (data.defects || []).map(d => `• ${d.category}: ${d.notes}`).join('\n');
  return `🚨 NEW MAINTENANCE ISSUE\nTruck: ${data.vehicle_number}\nDriver: ${data.driver_name}\n${defects}\nPlease inspect and resolve.`;
}

module.exports = { formatInspectionMessage };