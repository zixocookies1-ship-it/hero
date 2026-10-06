import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { AdminDbFailure } from "@/components/admin-db-failure";
import AdminSettingsForm, {
  type AdminSettingsData,
} from "@/components/admin-settings-form";

export const dynamic = "force-dynamic";

type SettingsRow = Prisma.BusinessSettingsGetPayload<Record<string, never>>;

function serialize(settings: SettingsRow): AdminSettingsData {
  const social = (settings.social && typeof settings.social === "object" && !Array.isArray(settings.social)
    ? (settings.social as Record<string, unknown>)
    : {}) as Record<string, string>;

  return {
    id: settings.id,
    brandName: settings.brandName,
    tagline: settings.tagline,
    announcement: settings.announcement,
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    whatsappNumber: settings.whatsappNumber,
    instagramHandle: settings.instagramHandle,
    twitterHandle: settings.twitterHandle,
    legalName: settings.legalName,
    gstNumber: settings.gstNumber,
    fssaiNumber: settings.fssaiNumber,
    cinNumber: settings.cinNumber,
    businessAddressLine1: settings.businessAddressLine1,
    businessAddressLine2: settings.businessAddressLine2,
    businessCity: settings.businessCity,
    businessState: settings.businessState,
    businessPincode: settings.businessPincode,
    businessCountry: settings.businessCountry,
    businessHours: settings.businessHours,
    razorpayDisplayName: settings.razorpayDisplayName,
    social: {
      instagram: social.instagram ?? "",
      youtube: social.youtube ?? "",
      facebook: social.facebook ?? "",
    },
  };
}

export default async function AdminSettingsPage() {
  let settings: SettingsRow | null = null;
  let failure: MongoFailure | null = null;

  try {
    settings = await prisma.businessSettings.findFirst();
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin settings query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  if (failure) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Settings</h2>
        <AdminDbFailure
          failure={failure}
          title="The settings database could not be queried. These values could not be loaded."
        />
      </div>
    );
  }

  if (!settings) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Settings</h2>
        <div className="mt-6 rounded-lg bg-white p-10 text-center shadow">
          <p className="text-gray-600">
            The database answered, and the businesssettings collection is empty.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Settings</h2>
      <p className="mt-1 text-sm text-gray-600">
        Edited from the <code className="font-mono">businesssettings</code> collection. The
        storefront shows saved values on its next request.
      </p>

      <div className="mt-6">
        <AdminSettingsForm initial={serialize(settings)} />
      </div>
    </div>
  );
}