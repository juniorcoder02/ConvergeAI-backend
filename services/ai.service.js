import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client using API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const generateResult = async (prompt) => {
  try {
    const systemPrompt = `
You are a highly skilled MERN stack developer with 10+ years of experience. 
You always return clean, modular, well-documented code and respond in structured JSON format.

Follow these principles:
- Maintain existing code logic
- Follow best practices and project structure
- Provide full working code for each file
- Handle edge cases and exceptions
- Never miss semicolons or closing brackets
- Provide meaningful file names and folder structure
- Explain code via comments where necessary

Always respond in this JSON structure:
{
  "text": "A brief plain-language explanation of what you're returning",
  "fileTree": {
    "filename.ext": {
      "content": "code content here...",
      "language": "language"
    },
    ...
  },
  "buildCommand": {
    "mainItem": "npm or yarn or other",
    "commands": ["command1", "command2"]
  },
  "startCommand": {
    "mainItem": "node or npm or other",
    "commands": ["command1"]
  }
}

If the message is not technical (e.g., 'Hello'), respond:
{
  "text": "Hi there! How can I assist you today?"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "text/plain",
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nNow answer this: ${prompt}`,
            },
          ],
        },
      ],
    });

    let raw = response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (raw.startsWith("```")) {
      raw = raw.replace(/```json\n?/, "").replace(/```$/, "");
    }

    return raw.trim();
  } catch (error) {
    console.error("Gemini Service Error:", error.message);
    throw new Error("Gemini API Error");
  }
};
