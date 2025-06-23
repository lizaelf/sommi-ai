export interface WineData {
  id: number;
  name: string;
  year: string | number;
  ratings?: {
    vn?: number;
    jd?: number;
    ws?: number;
    abv?: number;
  };
  bottles?: number;
  image?: string;
  [key: string]: any;
} 