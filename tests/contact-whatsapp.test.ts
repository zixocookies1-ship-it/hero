/**
 * Guards the contact page's WhatsApp hand-off and the footer layout. Run with:
 * npx tsx --test tests/contact-whatsapp.test.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import { BRAND, contactEnquiryMessage, whatsappLink } from "../src/lib/brand";

const read = (relative: string) => fs.readFile(path.join(process.cwd(), relative), "utf8");

test("every entered field is carried into the WhatsApp message", () => {
  const message = contactEnquiryMessage({
    name: "Ruby Gupta",
    email: "ruby@example.com",
    phone: "9876543210",
    subject: "Wholesale enquiry",
    message: "I want to order 20 kg for my shop.",
  });

  for (const expected of [
    "Name: Ruby Gupta",
    "Phone: 9876543210",
    "Email: ruby@example.com",
    "Subject: Wholesale enquiry",
    "Message: I want to order 20 kg for my shop.",
  ]) {
    assert.ok(message.includes(expected), `missing "${expected}" in:\n${message}`);
  }

  assert.equal(message.split("\n").length, 5, "one line per populated field");
});

test("blank optional fields leave no empty headings", () => {
  const message = contactEnquiryMessage({
    name: "Ruby Gupta",
    email: "ruby@example.com",
    phone: "",
    subject: "Question",
    message: "Is the jaggery organic?",
  });

  assert.ok(!message.includes("Phone:"), "blank phone should be omitted entirely");
  assert.ok(!message.includes("::"), "no dangling colons");
  assert.ok(!message.includes("\n\n"), "no blank lines");
});

test("surrounding whitespace is trimmed out of the chat message", () => {
  const message = contactEnquiryMessage({
    name: "  Ruby Gupta  ",
    email: "",
    phone: "  9876543210 ",
    subject: "  Hi  ",
    message: "  Hello there  ",
  });

  assert.ok(message.includes("Name: Ruby Gupta"));
  assert.ok(!message.includes("  "), "no double spaces should survive");
});

test("the link points at the brand number and encodes the text", () => {
  const link = whatsappLink(contactEnquiryMessage({
    name: "Ruby Gupta",
    email: "",
    phone: "",
    subject: "Question",
    message: "Hello there",
  }));

  assert.ok(link.startsWith(`https://wa.me/${BRAND.whatsappNumber}?text=`), link);

  const text = new URL(link).searchParams.get("text");
  assert.ok(text?.includes("Name: Ruby Gupta"));
  // Newlines must survive as %0A, not be dropped.
  assert.ok(text?.includes("\n"), "field separators should be encoded newlines");
});

test("contact page no longer renders the phone number", async () => {
  const html = await read("src/app/(shop)/contact/page.tsx");

  assert.ok(!html.includes("phoneDisplay"), "contact page should not use phoneDisplay");
  assert.ok(!html.includes("phoneDial"), "contact page should not use phoneDial");
  assert.ok(!html.includes("whatsappLink"), "contact page should not build a WhatsApp link");
  assert.ok(html.includes("Email"), "email card should remain");
  assert.ok(html.includes("Address"), "address card should remain");
});

test("contact form hands off to WhatsApp instead of posting to an API", async () => {
  const source = await read("src/app/(shop)/contact/contact-form.tsx");

  // The number is injected from stored settings, so the link is built with the
  // settings-aware helper rather than the fixed BRAND constant.
  assert.ok(
    source.includes("whatsappLinkFor(") && source.includes("contactEnquiryMessage({"),
    "must build a WhatsApp link from the form fields"
  );
  assert.ok(!source.includes("/api/contact"), "must not post to an API endpoint");
  assert.ok(!source.includes("fetch("), "must not make a network request");
});

test("navbar has no WhatsApp link and uses the larger logo", async () => {
  const source = await read("src/components/navbar.tsx");

  assert.ok(!source.includes("whatsappLink"), "navbar should not link to WhatsApp");
  assert.ok(!source.includes("WhatsAppIcon"), "navbar should not render a WhatsApp icon");
  // 70% larger than the previous h-12 w-12 (48px) / sm:h-14 (56px).
  assert.ok(source.includes("h-20 w-20"), "mobile logo should be h-20 w-20");
  assert.ok(source.includes("sm:h-24 sm:w-24"), "sm+ logo should be sm:h-24 sm:w-24");
  // The logo holds a light interior, so it is blended into the cream with
  // mix-blend-multiply instead of glowing white. White glows read as a
  // whitish plate next to the mark.
  assert.ok(source.includes("mix-blend-multiply"), "navbar logo blends into the cream");
  assert.ok(
    !source.includes("rgba(255,255,255"),
    "navbar logo must not get a whitish gap behind it"
  );
  // The header cart uses the recognisable shopping-cart outline, not the old
  // hand-bag linework.
  assert.ok(
    source.includes("M2.25 3h1.386c.51 0") && source.includes("M6 20.25"),
    "navbar cart should use a regular cart mark"
  );
});

test("footer no longer lists contact details", async () => {
  const source = await read("src/components/footer.tsx");

  // The "Talk to us" block was removed from the footer. The postal address and the
  // social links stay, so only the phone, the WhatsApp link and the email go.
  assert.ok(!source.includes("Talk to us"), "footer should not render a Talk to us block");
  assert.ok(!source.includes("phoneDisplay"), "footer should not list the phone number");
  assert.ok(!source.includes("tel:"), "footer should not link to the phone number");
  assert.ok(!source.includes("mailto:"), "footer should not list the email address");
  assert.ok(!source.includes("whatsappLink"), "footer should not offer a WhatsApp link");
  assert.ok(source.includes("brand.address"), "footer keeps the postal address");
  assert.ok(source.includes("SocialLinks"), "footer keeps the social links");
});

test("footer logo is large enough to resolve and blends so it reads on the brown", async () => {
  const source = await read("src/components/footer.tsx");

  // Once the baked-in white plate was removed the mark sat directly on the dark
  // brown footer, where the brand green only reaches 2.78:1 and the emblem's
  // strokes render about 2px wide at 74px. It needs to be bigger to resolve.
  // The logo's light interior is dissolved with mix-blend-multiply (no white
  // halo) so the mark reads on the brown without a whitish glow.
  assert.ok(source.includes("h-24 w-24"), "footer logo should be h-24 w-24 (96px)");
  assert.ok(
    !source.includes("h-[74px]"),
    "the old 74px size resolved the emblem's strokes too thin to read"
  );
  assert.ok(
    source.includes("mix-blend-multiply"),
    "footer logo blends its interior away on the brown"
  );
  assert.ok(
    !source.includes("rgba(255,255,255"),
    "the footer logo must not carry a whitish halo"
  );
  // There must be no plate behind the mark either.
  assert.ok(!source.includes("rounded-full bg-"), "no plate behind the footer logo");
  assert.ok(!source.includes("object-cover"), "the logo must not be cropped or scaled to fill");
});

test("phone numbers cannot wrap mid-number wherever they are listed", async () => {
  // The footer no longer lists the phone, so this guard now covers the about page,
  // which is where the number is rendered.
  const about = await read("src/app/(shop)/about/page.tsx");

  assert.ok(about.includes("phoneDisplay"), "about page lists the phone number");
  assert.ok(
    about.includes("inline-block whitespace-nowrap"),
    "WhatsApp and Call entries must not wrap mid-number"
  );
});

test("reviews render stars and name initials, with no profile pictures", async () => {
  const source = await read("src/components/customer-reviews.tsx");

  assert.ok(source.includes("rating"), "reviews carry a rating");
  assert.ok(source.includes("initialsOf"), "reviews derive initials");
  assert.ok(!source.includes("<Image"), "no profile picture images");
  assert.ok(!source.includes("next/image"), "no profile picture images");
  assert.ok(!/avatar/i.test(source), "no avatar markup");
  // A star is drawn as SVG rather than a text glyph so it renders identically.
  assert.ok(source.includes("aria-label={`Rated"), "stars expose an accessible rating");
});