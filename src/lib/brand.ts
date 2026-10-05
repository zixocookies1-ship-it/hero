export const BRAND = {
  name: "Nature's Choice Jaggery",
  tagline: "Traditional Indian jaggery, slow-cooked the traditional way.",
  whatsappNumber: "8805551680",
  phoneDisplay: "+91 88055 51680",
  phoneDial: "+918805551680",
  email: "support@natureschoicejaggery.com",
  location: "Mumbai, Maharashtra, India",
  officeAddress: "Mumbai, Maharashtra, India",
  instagram: "https://instagram.com/",
  facebook: "https://facebook.com/",
} as const;

export const whatsappLink = (message?: string) => {
  const base = `https://wa.me/${BRAND.whatsappNumber}`;
  return message
    ? `${base}?text=${encodeURIComponent(message)}`
    : base;
};