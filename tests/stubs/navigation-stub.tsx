/**
 * Stubs next/navigation so the checkout form can be server-rendered in tests.
 * The form only calls router.push() after a successful payment, which a render
 * test never reaches.
 */
export const routerStub = { push: () => {}, replace: () => {}, refresh: () => {}, back: () => {} };

export function useRouter() {
  return routerStub;
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function usePathname() {
  return "/checkout";
}

export function redirect() {}

export function notFound() {}