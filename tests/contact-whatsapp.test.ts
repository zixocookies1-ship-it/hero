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

  assert.ok(
    source.includes("whatsappLink(message)") && source.includes("contactEnquiryMessage({"),
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
});

test("footer logo is 70% larger and the phone number cannot wrap", async () => {
  const source = await read("src/components/footer.tsx");

  // 44px * 1.7 = 74.8, so 74px.
  assert.ok(source.includes("h-[74px] w-[74px]"), "footer logo should be 74px");
  assert.ok(
    source.includes("inline-block whitespace-nowrap"),
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