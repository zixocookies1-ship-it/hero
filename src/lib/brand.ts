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

export const addressLine = (separator = ", ") =>
  [
    BRAND.address.line1,
    BRAND.address.line2,
    `${BRAND.address.cityState} ${BRAND.address.pincode}`,
    BRAND.address.country,
  ].join(separator);

export const whatsappLink = (message?: string) => {
  const base = `https://wa.me/${BRAND.whatsappNumber}`;
  return message
    ? `${base}?text=${encodeURIComponent(message)}`
    : base;
};

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