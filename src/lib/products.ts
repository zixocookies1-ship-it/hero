export type Product = {
  slug: string;
  name: string;
  variantName: string;
  shortName: string;
  flavourNote: string;
  description: string;
  ingredients: string;
  highlights: string[];
  weight: string;
  pack: string;
  mrp: number;
  sellingPrice: number;
  discountPercent: number;
  inStock: boolean;
  images: string[];
};

const imageSet = (slug: string, count: number) =>
  Array.from(
    { length: count },
    (_, index) => `/images/products/${slug}/${String(index + 1).padStart(2, "0")}.jpeg`
  );

export const products: Product[] = [
  {
    slug: "desi-chocolatey-jaggery",
    name: "Desi Chocolatey Jaggery",
    variantName: "Desi Chocolatey Gud",
    shortName: "Desi Chocolatey",
    flavourNote: "Classic Deep Brown",
    description:
      "Our classic take on traditional Indian jaggery, cooked slowly in pure clay pots over natural wood fire. The result is a deep, malty sweetness with notes of caramel and molasses, exactly the way jaggery has always been made in Maharashtra.",
    ingredients:
      "Organic sugarcane juice, jaggery, cocoa, natural colour.",
    highlights: [
      "Pure, natural and unadulterated",
      "No preservatives or chemicals",
      "Gold-kettle method in pure clay pots",
      "Naturally rich in iron and minerals",
    ],
    weight: "500g",
    pack: "Pack of 1",
    mrp: 299,
    sellingPrice: 239,
    discountPercent: 20,
    inStock: true,
    images: imageSet("desi-chocolatey-jaggery", 6),
  },
  {
    slug: "desi-elaichi-chocolatey-jaggery",
    name: "Desi Elaichi Chocolatey Jaggery",
    variantName: "Desi Elaichi & Sonth Chocolatey Gud",
    shortName: "Desi Elaichi",
    flavourNote: "Cardamom Infused",
    description:
      "Green cardamom and roasted sesame folded into slow-cooked jaggery for an aromatic, gently warming sweetness. A modern finish on an age-old Indian recipe, made for chai, sweets and everyday cooking.",
    ingredients:
      "Organic sugarcane juice, jaggery, green cardamom, roasted sesame (sonth), cocoa, natural colour.",
    highlights: [
      "Aromatic cardamom and roasted sesame",
      "No preservatives or chemicals",
      "Gold-kettle method in pure clay pots",
      "Suitable for chai and traditional sweets",
    ],
    weight: "500g",
    pack: "Pack of 1",
    mrp: 299,
    sellingPrice: 239,
    discountPercent: 20,
    inStock: true,
    images: imageSet("desi-elaichi-chocolatey-jaggery", 6),
  },
  {
    slug: "desi-til-chocolatey-jaggery",
    name: "Desi Til Chocolatey Jaggery",
    variantName: "Desi Til Chocolatey Gud",
    shortName: "Desi Til",
    flavourNote: "Nutty Sesame",
    description:
      "Roasted sesame seeds blended into our slow-cooked chocolatey jaggery for a warm, nutty sweetness. The sesame gives this variant its distinctive character and a naturally satisfying texture.",
    ingredients:
      "Organic sugarcane juice, jaggery, roasted sesame (til), cocoa, natural colour.",
    highlights: [
      "Roasted sesame for a nutty finish",
      "No preservatives or chemicals",
      "Gold-kettle method in pure clay pots",
      "Naturally rich in minerals",
    ],
    weight: "500g",
    pack: "Pack of 1",
    mrp: 299,
    sellingPrice: 239,
    discountPercent: 20,
    inStock: true,
    images: imageSet("desi-til-chocolatey-jaggery", 7),
  },
];

export const getProductBySlug = (slug: string) =>
  products.find((product) => product.slug === slug);

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const TRIO_SLUGS = products.map((product) => product.slug);