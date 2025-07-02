export interface Wine {
  id?: number;
  name: string;
  year: string | number;
  bottles?: string | number;
  image: string;
  ratings: {
    vn: string | number;
    jd: string | number;
    ws: string | number;
    abv: string | number;
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
      ageUpTo?: string;
    }
  }
} 