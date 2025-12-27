import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhancePostContent = async (currentText: string): Promise<string> => {
  if (!currentText.trim()) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Rewrite the following blog post to be more engaging, witty, and concise, suitable for a micro-blogging platform. Keep the tone minimal and cool.
      
      Original Text:
      ${currentText}`,
    });
    
    return response.text?.trim() || currentText;
  } catch (error) {
    console.error("Gemini enhancement failed:", error);
    throw error;
  }
};

export const generatePostIdeas = async (): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Give me 3 short, thought-provoking micro-blog post ideas about technology, privacy, or the future. Format as a simple list.",
    });
    const text = response.text || "";
    return text.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^-\s*/, ''));
  } catch (error) {
    console.error("Gemini ideas failed:", error);
    return ["Talk about decentralized web", "Share a photo of your workspace", "Write about local-first software"];
  }
};
