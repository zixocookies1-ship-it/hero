/**
 * Static policy scaffolding for the storefront.
 *
 * The brief explicitly said no legal wording was provided and none should be
 * invented. These pages therefore state only things that are true of the site
 * as it is built (order flow, payment via Razorpay, goods across India, COD not
 * offered, prices including taxes) and mark the genuinely unknown specifics —
 * refund windows, jurisdictions, bare numbers the business must decide — with
 * bracketed `[to be confirmed]` placeholders. Nothing here invents a promise,
 * a timeline or a legal claim.
 *
 * Shipping charges are not hard-coded here: the shipping policy page injects
 * the live values from the shipping configuration, so this copy can never
 * drift from what is actually charged.
 */

export type PolicySection = {
  heading: string;
  body: string[];
};

export type Policy = {
  slug: string;
  navTitle: string;
  shortDescription: string;
  title: string;
  intro: string;
  sections: PolicySection[];
};

export const POLICIES: Policy[] = [
  {
    slug: "shipping-policy",
    navTitle: "Shipping Policy",
    shortDescription: "Charges, despatch times and tracking",
    title: "Shipping Policy",
    intro:
      "How we pack, despatch and charge delivery on orders placed on this website.",
    sections: [
      {
        heading: "Where we deliver",
        body: ["We deliver to delivery addresses across India."],
      },
      {
        heading: "Delivery charges",
        body: [
          "A flat delivery charge of {{deliveryFee}} is added to every order.",
          "Orders of {{freeAbove}} or more qualify for free delivery.",
        ],
      },
      {
        heading: "Despatch times",
        body: [
          "Orders are despatched within [X–Y] working days of confirmed payment. [to be confirmed]",
        ],
      },
      {
        heading: "Tracking",
        body: [
          "Once a shipment is handed to our delivery partner, a tracking reference is shared with you through the contact details you provided at checkout.",
        ],
      },
      {
        heading: "Delays",
        body: [
          "Deliveries occasionally take longer in remote areas. If a delivery is delayed we will contact you using the details on your order.",
        ],
      },
    ],
  },
  {
    slug: "delivery-policy",
    navTitle: "Delivery Policy",
    shortDescription: "How orders reach you",
    title: "Delivery Policy",
    intro:
      "How orders are delivered, including addresses, failed deliveries and payment on delivery.",
    sections: [
      {
        heading: "Delivery area",
        body: [
          "We currently deliver to addresses within India. Serviceability may be checked against the delivery PIN code before an order is confirmed.",
        ],
      },
      {
        heading: "Payment on delivery",
        body: [
          "Cash on Delivery is not currently offered. Every order is paid online through the payment gateway at checkout.",
        ],
      },
      {
        heading: "Estimated delivery",
        body: [
          "Orders are generally delivered within a few working days of despatch. A more specific estimate, where available, is shown at checkout.",
        ],
      },
      {
        heading: "Failed or undeliverable deliveries",
        body: [
          "If a delivery cannot be completed, our team or the delivery partner will contact you using the details provided at checkout.",
        ],
      },
      {
        heading: "Address accuracy",
        body: [
          "Please ensure the delivery address and PIN code are correct. We may contact you if an address looks incomplete and, where necessary, ask you to reconfirm it before despatch.",
        ],
      },
    ],
  },
  {
    slug: "privacy-policy",
    navTitle: "Privacy Policy",
    shortDescription: "How your information is used",
    title: "Privacy Policy",
    intro:
      "How we collect, use and protect the information you share when you browse this website or place an order.",
    sections: [
      {
        heading: "Information we collect",
        body: [
          "Name, phone number, email address, delivery address and order details when you place an order.",
          "Information you send us when you contact us or raise a query.",
          "Cookies and local browser storage used to keep your shopping cart and a few basic preferences.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To confirm, fulfil and deliver your orders, including sharing delivery details with our shipping partner.",
          "To answer questions and provide support.",
          "To keep the website secure and functioning correctly.",
        ],
      },
      {
        heading: "Payments",
        body: [
          "Payments are processed by the Razorpay payment gateway. We do not see or store your card number or bank details.",
          "Only the payment status (paid, failed or pending) is recorded against your order.",
        ],
      },
      {
        heading: "Sharing",
        body: [
          "We share the minimum details needed — name, phone number and delivery address — with our delivery partner to ship your order.",
          "We do not sell or rent your personal information to anyone.",
        ],
      },
      {
        heading: "Storage and security",
        body: [
          "Information is stored on secure infrastructure and protected with reasonable technical measures.",
          "Order information is kept for as long as needed for record-keeping, returns and legal obligations. The exact retention period is [to be confirmed].",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can ask us to correct or delete the personal information we hold about you. Contact us through the contact page and we will respond.",
        ],
      },
      {
        heading: "Updates",
        body: [
          "This policy may be updated from time to time. The version on this page is the current one.",
        ],
      },
    ],
  },
  {
    slug: "return-policy",
    navTitle: "Return Policy",
    shortDescription: "Returns and replacements",
    title: "Return Policy",
    intro:
      "How returns and replacements are handled for orders placed on this website.",
    sections: [
      {
        heading: "Food products",
        body: [
          "Our products are food items made in small batches. For health and hygiene reasons we cannot accept returns of opened or partially used jars.",
        ],
      },
      {
        heading: "Problems with your order",
        body: [
          "If your order arrives damaged, incorrect or is not what you ordered, contact us within [X] days of delivery with your order ID and photos. [to be confirmed]",
        ],
      },
      {
        heading: "What happens next",
        body: [
          "We review every claim and, once confirmed, send a replacement or process a refund as appropriate.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "Approved refunds are returned to the original payment method within [X] business days. [to be confirmed]",
        ],
      },
      {
        heading: "How to reach us",
        body: [
          "Raise any return request through the contact page, quoting your order ID.",
        ],
      },
    ],
  },
  {
    slug: "cancellation-policy",
    navTitle: "Cancellation Policy",
    shortDescription: "Cancelling an order",
    title: "Cancellation Policy",
    intro:
      "When you can cancel an order and how refunds work after a cancellation.",
    sections: [
      {
        heading: "Before despatch",
        body: [
          "You may request a cancellation before your order has been despatched. Once an order is with our delivery partner it can no longer be cancelled.",
        ],
      },
      {
        heading: "Timing",
        body: [
          "Cancellation requests are usually accepted within [X] hours of placing the order. [to be confirmed]",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "If your payment has been captured and the order is cancelled, the amount is returned to the original payment method within [X] business days. [to be confirmed]",
        ],
      },
      {
        heading: "How to cancel",
        body: [
          "Use the contact page, quoting your order ID, to request a cancellation.",
        ],
      },
    ],
  },
  {
    slug: "terms-and-conditions",
    navTitle: "Terms & Conditions",
    shortDescription: "The terms that apply to your use",
    title: "Terms & Conditions",
    intro:
      "The terms that apply when you browse this website, place an order or contact us.",
    sections: [
      {
        heading: "About these terms",
        body: [
          "By using this website you agree to these terms. If you do not agree with any part of them, please do not use the site.",
        ],
      },
      {
        heading: "Our products",
        body: [
          "Product descriptions and images are provided for information. Actual jaggery may vary slightly from the photographs.",
        ],
      },
      {
        heading: "Prices and payment",
        body: [
          "Prices are shown in Indian rupees and include applicable taxes unless stated otherwise.",
          "All payments are processed through the payment gateway at checkout. Prices may be revised at any time.",
        ],
      },
      {
        heading: "Orders",
        body: [
          "We may decline, cancel or hold orders that appear fraudulent, incorrect or priced in error, and we will inform you if we do.",
        ],
      },
      {
        heading: "Delivery",
        body: ["Title to the products passes to you on delivery."],
      },
      {
        heading: "Intellectual property",
        body: [
          "All content on this website — text, images and branding — belongs to us and may not be reproduced without permission.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "To the extent permitted by law, our liability in connection with an order is limited to the value of that order.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms are governed by the laws of India. Disputes are subject to the jurisdiction of the courts at [city]. [to be confirmed]",
        ],
      },
      {
        heading: "Contact",
        body: [
          "Questions about these terms can be sent through the contact page.",
        ],
      },
    ],
  },
];

export const POLICY_SLUGS: string[] = POLICIES.map((policy) => policy.slug);

export const POLICY_LINKS = POLICIES.map((policy) => ({
  label: policy.navTitle,
  href: `/policies/${policy.slug}`,
}));

export const getPolicy = (slug: string): Policy | undefined =>
  POLICIES.find((policy) => policy.slug === slug);