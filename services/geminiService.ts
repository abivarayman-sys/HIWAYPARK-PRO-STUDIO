import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Relying on the environment variable strictly as per guidelines
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY environment variable is missing.");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
  }

  /**
   * Edits an image based on a prompt using gemini-2.5-flash-image
   */
  async editImage(base64Image: string, prompt: string): Promise<string> {
    try {
      // Extract just the base64 data, removing the data:image/jpeg;base64, prefix if present
      let cleanBase64 = base64Image;
      let mimeType = 'image/jpeg';

      if (base64Image.startsWith('data:')) {
        const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        }
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      // Find the generated image in the response parts
      if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }

      throw new Error("No image data found in the response.");
    } catch (error) {
      console.error("Error editing image with Gemini:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
