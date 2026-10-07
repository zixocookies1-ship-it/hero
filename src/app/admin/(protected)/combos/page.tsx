import { Combo, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { AdminDbFailure } from "@/components/admin-db-failure";
import AdminComboEditor, {
  type AdminComboRow,
  type ComboItemRow,
} from "@/components/admin-combo-editor";

export const dynamic = "force-dynamic";

type ComboRow = Combo;

/** Combos store paise like the product variants; admin edits whole rupees. */
const toInr = (paise: number) => Math.round(paise / 100);

function comboItems(value: Prisma.JsonValue): ComboItemRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): ComboItemRow[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const slug = "slug" in entry && typeof entry.slug === "string" ? entry.slug : "";
    if (!slug) return [];
    const name = "name" in entry && typeof entry.name === "string" ? entry.name : "";
    const quantity =
      "quantity" in entry && typeof entry.quantity === "number" && Number.isInteger(entry.quantity)
        ? entry.quantity
        : 1;
    return [{ slug, name, quantity }];
  });
}

function serialize(combo: ComboRow): AdminComboRow {
  return {
    id: combo.id,
    name: combo.name,
    description: combo.description,
    image: combo.image,
    priceInr: toInr(combo.pricePaise),
    mrpInr: combo.mrpPaise === null ? null : toInr(combo.mrpPaise),
    items: comboItems(combo.items),
    isActive: combo.isActive,
    isFeatured: combo.isFeatured,
    showOnHomepage: combo.showOnHomepage,
    showOnProducts: combo.showOnProducts,
    sortOrder: combo.sortOrder,
  };
}

export default async function AdminCombosPage() {
  let combos: ComboRow[] = [];
  let failure: MongoFailure | null = null;

  try {
    combos = await prisma.combo.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin combos query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  let productOptions: { slug: string; name: string }[] = [];
  if (!failure) {
    try {
      productOptions = (
        await prisma.catalogProduct.findMany({
          orderBy: { sortOrder: "asc" },
          select: { slug: true, name: true },
          where: { isActive: true },
        })
      ).map((product) => ({ slug: product.slug, name: product.name }));
    } catch (error) {
      const optionsFailure = classifyMongoError(error);
      console.error("[mongo] admin combos product options failed", {
        kind: optionsFailure.kind,
        errorName: optionsFailure.errorName,
        errorCode: optionsFailure.errorCode,
      });
    }
  }

  if (failure) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Combos</h2>
        <AdminDbFailure
          failure={failure}
          title="The combo collection could not be queried. These combos could not be loaded."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Combos</h2>
          <p className="mt-1 text-sm text-gray-600">
            Read from the <code className="font-mono">combos</code> collection in MongoDB. Combos
            appear in the storefront COMBOS sections and check out as a single cart line.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AdminComboEditor
          combos={combos.map(serialize)}
          productOptions={productOptions}
        />
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Hiding a combo never deletes it — it just stops appearing in the storefront, and can be
        published again any time. Deleting permanently removes it.
      </p>
    </div>
  );
}