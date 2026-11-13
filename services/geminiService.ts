import { CardData, Theme } from '../types';

// Helper to convert File to Base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export interface CustomCardOptions {
  name?: string;
  description?: string;
  stats?: { label: string; value: number }[];
}

export const generateCardMetadata = async (
  base64Image: string,
  theme: Theme,
  options?: CustomCardOptions
): Promise<CardData> => {
  const response = await fetch('/api/card/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, theme, options }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to generate card metadata');
  }

  return data as CardData;
};

export const transformImage = async (
  base64Image: string,
  theme: Theme,
  cardData: CardData
): Promise<string> => {
  const response = await fetch('/api/card/transform', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, theme, cardData }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.imageBase64) {
    throw new Error(data?.error || 'Failed to generate transformed image');
  }

  return data.imageBase64 as string;
};