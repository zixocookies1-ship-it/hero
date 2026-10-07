import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { AdminDbFailure } from "@/components/admin-db-failure";
import AdminBannerEditor, {
  type AdminBannerEntry,
} from "@/components/admin-banner-editor";

export const dynamic = "force-dynamic";

type SectionRow = Prisma.SectionGetPayload<Record<string, never>>;

function serialize(section: SectionRow): AdminBannerEntry {
  return {
    key: section.key,
    label: section.label,
    eyebrow: section.eyebrow,
    title: section.title,
    titleAccent: section.titleAccent,
    body: section.body,
    body2: section.body2,
    image: section.image,
    imageMobile: section.imageMobile ?? "",
    itemsJson: JSON.stringify(section.items ?? [], null, 2),
    linksJson: JSON.stringify(section.links ?? [], null, 2),
  };
}

export default async function AdminBannersPage() {
  let sections: SectionRow[] = [];
  let failure: MongoFailure | null = null;

  try {
    sections = await prisma.section.findMany({ orderBy: { key: "asc" } });
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin banners query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  if (failure) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Banners</h2>
        <AdminDbFailure
          failure={failure}
          title="The sections database could not be queried. These sections could not be loaded."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Banners</h2>
          <p className="mt-1 text-sm text-gray-600">
            Every page banner and copy block, read from the{" "}
            <code className="font-mono">sections</code> collection. Saved edits are live on the
            storefront immediately.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AdminBannerEditor sections={sections.map(serialize)} />
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Image fields take a path (/images/...) or a full URL. Copy using {"{{placeholders}}"}
        keeps live prices and the shelf life in sync with the catalogue.
      </p>
    </div>
  );
}