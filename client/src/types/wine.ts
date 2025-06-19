export interface Wine {
  id: number;
  name: string;
  year: number;
  bottles: number;
  image: string;
  ratings: {
    vn: number;
    jd: number;
    ws: number;
    abv: number;
  };
  description?: string;
  buyAgainLink?: string;
  qrCode?: string;
  qrLink?: string;
  foodPairing?: string[];
  location?:string;
  technicalDetails?: {
    varietal?: {
      primary?: string;
      secondary?: string;
      primaryPercentage?: string;
      secondaryPercentage?: string;
    }
    aging?: {
      drinkNow?: string;
      ageUpTo?: string;
    }
  }
} 