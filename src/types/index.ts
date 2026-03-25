export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  hours: string | null;
  conversation: boolean;
  price_range: "저" | "중" | "고";
  atmosphere: string[];
  menus: MenuItem[];
  photos: string[];
  description: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  name: string;
  price: number;
}

export interface PlaceFilter {
  keyword?: string;
  conversation?: boolean | null;
  price_range?: string | null;
  atmosphere?: string | null;
}
