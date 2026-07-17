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
  prices: {
    homedepot: ProductPrice;
    lowes: ProductPrice;
    wayfair: ProductPrice;
    amazon: ProductPrice;
  };
}

export const CORE_PRODUCTS: CompetitorProduct[] = [
  {
    name: "Ariel Hepburn 42\" Single Freestanding Vanity (White/Quartz)",
    model: "T043SWQRVOWHT",
    upc: "840318329611",
    rating: 4.5,
    reviewCount: 112,
    mapPrice: 1200.00,
    prices: {
      homedepot: { 
        price: 1080.00, 
        inStock: true, 
        url: "https://www.homedepot.com/p/323469749",
        shipping: 95.00,
        coupon: 100.00,
        couponText: "$100 dynamic cart coupon",
        regionalStock: { east: true, midwest: true, west: false },
        daysOOS: 0
      },
      lowes: { 
        price: 1242.00, 
        inStock: true, 
        url: "https://www.lowes.com",
        shipping: 120.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      wayfair: { 
        price: 1200.00, 
        inStock: true, 
        url: "https://www.wayfair.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: false, west: true },
        daysOOS: 0
      },
      amazon: { 
        price: 1266.00, 
        inStock: true, 
        url: "https://www.amazon.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      }
    }
  },
  {
    name: "Ariel Hepburn 37\" Single Freestanding Vanity (White/Quartz)",
    model: "T037SLWQRVOWHT",
    upc: "840318364162",
    rating: 4.3,
    reviewCount: 98,
    mapPrice: 1000.00,
    prices: {
      homedepot: { 
        price: 1000.00, 
        inStock: true, 
        url: "https://www.homedepot.com/p/323469734",
        shipping: 95.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      lowes: { 
        price: 1020.00, 
        inStock: true, 
        url: "https://www.lowes.com",
        shipping: 120.00,
        coupon: 50.00,
        couponText: "$50 Lowe's card discount",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      wayfair: { 
        price: 1000.00, 
        inStock: true, 
        url: "https://www.wayfair.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: false },
        daysOOS: 0
      },
      amazon: { 
        price: 1050.00, 
        inStock: false, 
        url: "https://www.amazon.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: false, midwest: false, west: false },
        daysOOS: 18
      }
    }
  },
  {
    name: "Ariel Cambridge 61\" Double Freestanding Vanity (Grey/Marble)",
    model: "A061DCW2RVOGRY",
    upc: "843012156897",
    rating: 4.4,
    reviewCount: 134,
    mapPrice: 1500.00,
    prices: {
      homedepot: { 
        price: 1500.00, 
        inStock: true, 
        url: "https://www.homedepot.com/p/318945472",
        shipping: 145.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      lowes: { 
        price: 1540.00, 
        inStock: true, 
        url: "https://www.lowes.com",
        shipping: 150.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: false, west: true },
        daysOOS: 0
      },
      wayfair: { 
        price: 1500.00, 
        inStock: true, 
        url: "https://www.wayfair.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      amazon: { 
        price: 1500.00, 
        inStock: true, 
        url: "https://www.amazon.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      }
    }
  },
  {
    name: "Ariel Hamlet 55\" Single Freestanding Vanity (Grey/Marble)",
    model: "F055SCW2OVOGRY",
    upc: "840318350479",
    rating: 4.6,
    reviewCount: 76,
    mapPrice: 1250.00,
    prices: {
      homedepot: { 
        price: 1250.00, 
        inStock: true, 
        url: "https://www.homedepot.com/p/320069625",
        shipping: 95.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      lowes: { 
        price: 1250.00, 
        inStock: true, 
        url: "https://www.lowes.com",
        shipping: 120.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      wayfair: { 
        price: 1250.00, 
        inStock: true, 
        url: "https://www.wayfair.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      amazon: { 
        price: 1290.00, 
        inStock: true, 
        url: "https://www.amazon.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      }
    }
  },
  {
    name: "Ariel Monroe 55\" Single Freestanding Vanity (White/Quartz)",
    model: "B55WQRVOWHT",
    upc: "840318368108",
    rating: 4.2,
    reviewCount: 89,
    mapPrice: 1700.00,
    prices: {
      homedepot: { 
        price: 1700.00, 
        inStock: true, 
        url: "https://www.arielbath.com/ariel-monroe-55-inch-single-rectangle-sink-bathroom-vanity-with-pure-white-quartz-countertop-15-inch-edge-in-white-b55wqrvowht",
        shipping: 95.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      lowes: { 
        price: 1750.00, 
        inStock: true, 
        url: "https://www.lowes.com",
        shipping: 120.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      wayfair: { 
        price: 1650.00, 
        inStock: true, 
        url: "https://www.wayfair.com",
        shipping: 0,
        coupon: 80.00,
        couponText: "$80 Wayfair member coupon",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      amazon: { 
        price: 1744.00, 
        inStock: true, 
        url: "https://www.amazon.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      }
    }
  },
  {
    name: "Ariel Hamlet 43\" Single Freestanding Vanity (Grey/Quartz)",
    model: "F043S-WQ-VO-GRY",
    upc: "843012147772",
    rating: 4.4,
    reviewCount: 54,
    mapPrice: 1100.00,
    prices: {
      homedepot: { 
        price: 1100.00, 
        inStock: true, 
        url: "https://www.homedepot.com/p/304367338",
        shipping: 95.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      lowes: { 
        price: 1150.00, 
        inStock: true, 
        url: "https://www.lowes.com",
        shipping: 120.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      wayfair: { 
        price: 1100.00, 
        inStock: true, 
        url: "https://www.wayfair.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      amazon: { 
        price: 1112.00, 
        inStock: true, 
        url: "https://www.amazon.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      }
    }
  },
  {
    name: "Ariel Bristol 48.25\" Single Freestanding Vanity (Grey/Quartz)",
    model: "H049SWQRVOGRY",
    upc: "843012158419",
    rating: 4.5,
    reviewCount: 63,
    mapPrice: 1200.00,
    prices: {
      homedepot: { 
        price: 1200.00, 
        inStock: true, 
        url: "https://www.arielbath.com/ariel-bristol-49-in-single-rectangle-sink-vanity-with-white-quartz-countertop-in-grey-h049swqrvogry",
        shipping: 95.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      lowes: { 
        price: 1220.00, 
        inStock: true, 
        url: "https://www.lowes.com",
        shipping: 120.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      wayfair: { 
        price: 1200.00, 
        inStock: true, 
        url: "https://www.wayfair.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      amazon: { 
        price: 1209.00, 
        inStock: true, 
        url: "https://www.amazon.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      }
    }
  },
  {
    name: "Ariel Bristol 73\" Double Freestanding Vanity (White/Marble)",
    model: "H073DCW2RVOWHT",
    upc: "843012159409",
    rating: 4.7,
    reviewCount: 145,
    mapPrice: 1550.00,
    prices: {
      homedepot: { 
        price: 1562.00, 
        inStock: true, 
        url: "https://www.homedepot.com/p/324466338",
        shipping: 145.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      lowes: { 
        price: 1580.00, 
        inStock: true, 
        url: "https://www.lowes.com",
        shipping: 150.00,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      wayfair: { 
        price: 1550.00, 
        inStock: true, 
        url: "https://www.wayfair.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      },
      amazon: { 
        price: 1550.00, 
        inStock: true, 
        url: "https://www.amazon.com",
        shipping: 0,
        coupon: 0,
        couponText: "",
        regionalStock: { east: true, midwest: true, west: true },
        daysOOS: 0
      }
    }
  }
];
