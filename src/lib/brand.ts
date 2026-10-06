export const BRAND = {
  name: "Nature's Choice Jaggery",
  tagline: "Traditional Indian jaggery, slow-cooked the traditional way.",
  whatsappNumber: "8805551680",
  phoneDisplay: "+91 88055 51680",
  phoneDial: "+918805551680",
  email: "support@natureschoicejaggery.com",
  address: {
    line1: "316, Puranapul",
    line2: "Harbanshpur, Azamgarh",
    cityState: "Uttar Pradesh",
    pincode: "276001",
    country: "India",
  },
  social: {
    instagram:
      "https://www.instagram.com/natureschoicejaggery?stkn=cXYwMGR0MWN2MzIz&utm_source=qr",
    youtube: "https://youtube.com/@natureschoicejaggery?si=iBnHBxHAU2_p4YZg",
    facebook: "https://www.facebook.com/share/18eeBBMEFV/?mibextid=wwXIfr",
  },
} as const;

export const addressLine = (separator = ", ") => addressLineOf(BRAND, separator);

export type Address = {
  line1: string;
  line2: string;
  cityState: string;
  pincode: string;
  country: string;
};

/**
 * Same two helpers parameterised over a brand, so a caller that loaded the
 * business settings from the database renders the stored values. The
 * no-argument forms above still exist for callers that have not loaded one.
 */
export const addressLineOf = (
  brand: { address: Address },
  separator = ", "
) =>
  [
    brand.address.line1,
    brand.address.line2,
    `${brand.address.cityState} ${brand.address.pincode}`,
    brand.address.country,
  ].join(separator);

export const whatsappLinkFor = (
  brand: { whatsappNumber: string },
  message?: string
) => {
  const base = `https://wa.me/${brand.whatsappNumber}`;
  return message
    ? `${base}?text=${encodeURIComponent(message)}`
    : base;
};

export const whatsappLink = (message?: string) =>
  whatsappLinkFor(BRAND, message);

/**
 * Builds a WhatsApp message from the contact form fields. Lines are omitted
 * entirely when left blank so an optional phone number never leaves a stray
 * "Phone:" heading in the chat.
 */
export type ContactEnquiry = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export const contactEnquiryMessage = (enquiry: ContactEnquiry): string => {
  const lines = [
    enquiry.name.trim() && `Name: ${enquiry.name.trim()}`,
    enquiry.phone.trim() && `Phone: ${enquiry.phone.trim()}`,
    enquiry.email.trim() && `Email: ${enquiry.email.trim()}`,
    enquiry.subject.trim() && `Subject: ${enquiry.subject.trim()}`,
    enquiry.message.trim() && `Message: ${enquiry.message.trim()}`,
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
};