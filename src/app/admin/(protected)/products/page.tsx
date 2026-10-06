import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { AdminDbFailure } from "@/components/admin-db-failure";
import AdminProductEditor, {
  type AdminProductRow,
} from "@/components/admin-product-editor";

export const dynamic = "force-dynamic";

type ProductRow = Prisma.CatalogProductGetPayload<{ include: { variants: true } }>;

/** The catalogue stores paise; every price on this site is whole rupees. */
const toInr = (paise: number) => Math.round(paise / 100);

function serialize(product: ProductRow): AdminProductRow {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    flavour: product.flavour,
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    sortOrder: product.sortOrder,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      weightLabel: variant.weightLabel,
      weightGrams: variant.weightGrams,
      packCount: variant.packCount,
      priceInr: toInr(variant.pricePaise),
      mrpInr: variant.mrpPaise === null ? null : toInr(variant.mrpPaise),
      inventory: variant.inventory,
      isActive: variant.isActive,
    })),
  };
}

export default async function AdminProductsPage() {
  let products: ProductRow[] = [];
  let failure: MongoFailure | null = null;

  try {
    products = await prisma.catalogProduct.findMany({
      orderBy: { sortOrder: "asc" },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin products query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  if (failure) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Products</h2>
        <AdminDbFailure
          failure={failure}
          title="The product database could not be queried. These products could not be loaded."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Products</h2>
          <p className="mt-1 text-sm text-gray-600">
            Read from the <code className="font-mono">products</code> and{" "}
            <code className="font-mono">productvariants</code> collections in MongoDB. Saved
            changes are live on the storefront immediately.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AdminProductEditor products={products.map(serialize)} />
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Hiding a product or variant never deletes it — it just stops appearing in the catalogue,
        and can be published again any time.
      </p>
    </div>
  );
}