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

const imageSet = (slug: string, count: number) =>
  Array.from(
    { length: count },
    (_, index) => `/images/products/${slug}/${String(index + 1).padStart(2, "0")}.jpeg`
  );

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
    images: imageSet("desi-chocolatey-jaggery", 6),
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