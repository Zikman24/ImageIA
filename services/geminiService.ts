import { GoogleGenAI, Modality } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const fileToGenerativePart = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Format d\'URL de données invalide. Attendu "data:mime/type;base64,..."');
  }
  const mimeType = match[1];
  const data = match[2];
  return {
    inlineData: {
      data,
      mimeType,
    },
  };
};

export const transformImage = async (
  base64ImageDataUrl: string,
  style: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("La clé API n'est pas configurée. Veuillez définir la variable d'environnement API_KEY.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const imagePart = fileToGenerativePart(base64ImageDataUrl);
  const textPart = {
    text: `Recréez cette image entière dans un style ${style}. Assurez-vous que le résultat est une image complète qui reflète cette nouvelle direction artistique.`,
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [imagePart, textPart],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  
  const candidates = response.candidates;

  if (candidates && candidates.length > 0 && candidates[0].content && candidates[0].content.parts) {
      for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              const mimeType = part.inlineData.mimeType;
              return `data:${mimeType};base64,${base64ImageBytes}`;
          }
      }
  }

  throw new Error("Aucune image n'a été générée par l'API. La réponse a peut-être été bloquée ou est vide.");
};