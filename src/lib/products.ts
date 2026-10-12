export type Product = {
  slug: string;
  name: string;
  /**
   * Set when the product is flagged as a featured/best seller in the admin.
   * Undefined for the shipped fallback list, which has no such concept — the
   * storefront treats "no featured flag anywhere" as "nothing decided yet" and
   * shows everything.
   */
  featured?: boolean;
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

/**
 * Shelf life in months, quoted on the about page, the trust strip and the FAQ.
 * Kept here as the single value so those three cannot drift apart.
 */
export const SHELF_LIFE_MONTHS = 8;

/**
 * Display order for every catalogue listing (home, products grid, about, footer
 * and the related products block). The array order below is the order customers
 * see, so re-ordering it re-orders the whole site. Keep it consistent with the
 * order flavours are described in across the copy: classic, then til, then
 * elaichi.
 */
export const products: Product[] = [
  {
    slug: "desi-chocolatey-jaggery",
    name: "Desi Chocolatey Jaggery",
    variantName: "Desi Chocolatey Gud",
    shortName: "Desi Chocolatey",
    flavourNote: "Classic Deep Brown",
    description:
      "Our classic take on traditional Indian jaggery, cooked slowly in pure clay pots over natural wood fire. The result is a deep, malty sweetness with notes of caramel and molasses, exactly the way jaggery has always been made in Uttar Pradesh.",
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
    images: [
      "/images/products/desi-chocolatey-jaggery/04.jpg",
      "/images/products/desi-chocolatey-jaggery/02.jpg",
      "/images/products/desi-chocolatey-jaggery/03.jpg",
      "/images/products/desi-chocolatey-jaggery/01.jpg",
      "/images/products/desi-chocolatey-jaggery/05.jpg",
      "/images/products/desi-chocolatey-jaggery/06.jpg",
    ],
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
    images: [
      "/images/products/desi-til-chocolatey-jaggery/06.jpeg",
      "/images/products/desi-til-chocolatey-jaggery/02.jpeg",
      "/images/products/desi-til-chocolatey-jaggery/03.jpeg",
      "/images/products/desi-til-chocolatey-jaggery/04.jpeg",
      "/images/products/desi-til-chocolatey-jaggery/05.jpeg",
      "/images/products/desi-til-chocolatey-jaggery/07.jpeg",
    ],
  },
  {
    slug: "desi-elaichi-chocolatey-jaggery",
    name: "Desi Elaichi Chocolatey Jaggery",
    variantName: "Desi Elaichi Chocolatey Gud",
    shortName: "Desi Elaichi",
    flavourNote: "Cardamom Infused",
    description:
      "Green cardamom and roasted sesame folded into slow-cooked jaggery for an aromatic, gently warming sweetness. A modern finish on an age-old Indian recipe, made for chai, sweets and everyday cooking.",
    ingredients:
      "Organic sugarcane juice, jaggery, green cardamom, roasted sesame (til), cocoa, natural colour.",
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
    images: [
      "/images/products/desi-elaichi-chocolatey-jaggery/02 (1).jpeg",
      "/images/products/desi-elaichi-chocolatey-jaggery/03 (1).jpeg",
      "/images/products/desi-elaichi-chocolatey-jaggery/04 (1).jpeg",
      "/images/products/desi-elaichi-chocolatey-jaggery/05 (1).jpeg",
      "/images/products/desi-elaichi-chocolatey-jaggery/06 (1).jpeg",
    ],
  },
];

/**
 * Looks a slug up in a catalogue.
 *
 * `catalogue` is optional and defaults to the shipped list, so every caller
 * that has not been given the database catalogue still behaves exactly as
 * before. Callers on the server pass `await loadCatalogue()` instead, which is
 * how an admin edit reaches a price shown to a customer.
 */
export const getProductBySlug = (
  slug: string,
  catalogue: readonly Product[] = products
) => catalogue.find((product) => product.slug === slug);

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const TRIO_SLUGS = products.map((product) => product.slug);

/**
 * Merchandising badge shown on the product card for the current best seller.
 * Deliberately a slug list instead of the database `isFeatured` flag: the home
 * page renders the featured subset *instead of* the full catalogue as soon as
 * anything is flagged, so flagging one product would collapse the grid to a
 * single card. Adding a slug here only paints the badge.
 */
export const BEST_SELLER_SLUGS: readonly string[] = ["desi-til-chocolatey-jaggery"];

export const isBestSeller = (slug: string): boolean => BEST_SELLER_SLUGS.includes(slug);