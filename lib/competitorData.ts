// Complete catalog mapping for Ariel Bath competitor price tracking
export interface ProductPrice {
  price: number;
  inStock: boolean;
  url: string;
  shipping: number;
  coupon: number;
  couponText: string;
  regionalStock: { east: boolean; midwest: boolean; west: boolean };
  daysOOS: number;
}

export interface CompetitorProduct {
  name: string;
  model: string;
  upc: string;
  rating: number;
  reviewCount: number;
  mapPrice: number;
  prices: Record<string, ProductPrice>;
}

export const CORE_PRODUCTS: CompetitorProduct[] = [
  {
    name: "Ariel Hepburn 42\" Single Freestanding Vanity (White/Quartz)",
    model: "T043SWQRVOWHT",
    upc: "840318329611",
    rating: 4.5,
    reviewCount: 112,
    mapPrice: 1200.00,
    prices: {}
  },
  {
    name: "Ariel Hepburn 37\" Single Freestanding Vanity (White/Quartz)",
    model: "T037SLWQRVOWHT",
    upc: "840318364162",
    rating: 4.3,
    reviewCount: 98,
    mapPrice: 1000.00,
    prices: {}
  },
  {
    name: "Ariel Cambridge 61\" Double Freestanding Vanity (Grey/Marble)",
    model: "A061DCW2RVOGRY",
    upc: "843012156897",
    rating: 4.4,
    reviewCount: 134,
    mapPrice: 1500.00,
    prices: {}
  },
  {
    name: "Ariel Hamlet 55\" Single Freestanding Vanity (Grey/Marble)",
    model: "F055SCW2OVOGRY",
    upc: "840318350479",
    rating: 4.6,
    reviewCount: 76,
    mapPrice: 1250.00,
    prices: {}
  },
  {
    name: "Ariel Monroe 55\" Single Freestanding Vanity (White/Quartz)",
    model: "B55WQRVOWHT",
    upc: "840318368108",
    rating: 4.2,
    reviewCount: 89,
    mapPrice: 1700.00,
    prices: {}
  },
  {
    name: "Ariel Hamlet 43\" Single Freestanding Vanity (Grey/Quartz)",
    model: "F043S-WQ-VO-GRY",
    upc: "843012147772",
    rating: 4.4,
    reviewCount: 54,
    mapPrice: 1100.00,
    prices: {}
  },
  {
    name: "Ariel Bristol 48.25\" Single Freestanding Vanity (Grey/Quartz)",
    model: "H049SWQRVOGRY",
    upc: "843012158419",
    rating: 4.5,
    reviewCount: 63,
    mapPrice: 1200.00,
    prices: {}
  },
  {
    name: "Ariel Bristol 73\" Double Freestanding Vanity (White/Marble)",
    model: "H073DCW2RVOWHT",
    upc: "843012159409",
    rating: 4.7,
    reviewCount: 145,
    mapPrice: 1550.00,
    prices: {}
  }
];
