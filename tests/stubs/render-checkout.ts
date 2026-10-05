/**
 * Renders the checkout form to HTML with next/navigation stubbed.
 *
 * The stub is needed because useRouter() throws outside a mounted app router, and
 * the form only calls router.push() after a successful payment. The resolve hook
 * must be installed before checkout-form is imported, which is why the form is
 * pulled in dynamically rather than with a static import.
 */
import module from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

let registered = false;

async function load() {
  if (!registered) {
    const stubUrl = pathToFileURL(
      path.join(process.cwd(), "tests", "stubs", "navigation-stub.tsx")
    ).href;

    // registerHooks is not in the installed @types/node; the runtime has it.
    const registerHooks = (
      module as unknown as {
        registerHooks?: (hooks: unknown) => void;
      }
    ).registerHooks;

    if (!registerHooks) {
      throw new Error("module.registerHooks is unavailable in this Node version");
    }

    registerHooks({
      resolve(
        specifier: string,
        context: unknown,
        nextResolve: (s: string, c: unknown) => unknown
      ) {
        if (specifier === "next/navigation") {
          return { url: stubUrl, shortCircuit: true };
        }
        return nextResolve(specifier, context);
      },
    });
    registered = true;
  }

  const React = (await import("react")).default;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { CartProvider } = await import("../../src/context/cart-context");
  const CheckoutForm = (await import("../../src/components/checkout-form")).default;

  return { React, renderToStaticMarkup, CartProvider, CheckoutForm };
}

/**
 * Returns the checkout form markup. During SSR the cart context returns its
 * server snapshot (empty), so no items are listed; field markup is what this
 * exercises. Money is asserted in checkout.test.ts against the pricing module.
 */
export async function renderCheckout(
  options: { shippingFeeInr: number; freeAboveInr: number | null } = {
    shippingFeeInr: 49,
    freeAboveInr: 900,
  }
): Promise<string> {
  const { React, renderToStaticMarkup, CartProvider, CheckoutForm } = await load();

  return renderToStaticMarkup(
    React.createElement(
      CartProvider,
      null,
      React.createElement(CheckoutForm, {
        shippingFeeInr: options.shippingFeeInr,
        freeAboveInr: options.freeAboveInr,
      })
    )
  );
}