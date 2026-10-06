import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { classifyMongoError, type MongoFailure } from "@/lib/mongo-diagnostics";
import { AdminDbFailure } from "@/components/admin-db-failure";
import AdminCouponEditor, {
  type AdminCouponData,
} from "@/components/admin-coupon-editor";

export const dynamic = "force-dynamic";

type CouponRow = Prisma.CouponGetPayload<Record<string, never>>;

function serialize(coupon: CouponRow): AdminCouponData {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minimumOrderAmount: coupon.minimumOrderAmount,
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    active: coupon.active,
  };
}

export default async function AdminCouponsPage() {
  let coupons: CouponRow[] = [];
  let failure: MongoFailure | null = null;

  try {
    coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  } catch (error) {
    failure = classifyMongoError(error);
    console.error("[mongo] admin coupons query failed", {
      kind: failure.kind,
      errorName: failure.errorName,
      errorCode: failure.errorCode,
    });
  }

  if (failure) {
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Coupons</h2>
        <AdminDbFailure
          failure={failure}
          title="The coupon database could not be queried. These coupons could not be loaded."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[var(--jaggery-brown)]">Coupons</h2>
          <p className="mt-1 text-sm text-gray-600">
            Codes created here are validated at cart and checkout immediately.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <AdminCouponEditor coupons={coupons.map(serialize)} />
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Coupons are deactivated rather than deleted, so one that was ever used stays on record
        with the orders it discounted.
      </p>
    </div>
  );
}