export enum Theme {
  CYBERPUNK = 'Cyberpunk',
  FANTASY = 'Fantasy',
  RETRO = 'Retro Arcade',
  ZOMBIE = 'Zombie Apocalypse',
  SUPERHERO = 'Superhero',
  SCI_FI = 'Sci-Fi',
  HORROR = 'Horror',
  MYTHOLOGY = 'Mythology'
}

export interface CardStat {
  label: string;
  value: number;
  max?: number;
}

export interface CardData {
  name: string;
  title: string;
  element: string; // e.g., Fire, Tech, Bio
  description: string;
  stats: CardStat[];
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    border: string;
  };
}

export interface GenerationState {
  step: 'idle' | 'upload' | 'processing_text' | 'processing_image' | 'complete' | 'error';
  error?: string;
}