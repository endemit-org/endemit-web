import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { PosKitchenDisplay } from "@/app/_components/pos/PosKitchenDisplay";

export const metadata: Metadata = {
  title: "Kitchen",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ registerId: string }>;
}

// View-only kitchen display for fulfillment-tracked registers.
export default async function PosKitchenPage({ params }: Props) {
  const user = await getCurrentUser();
  const { registerId } = await params;

  if (!user) {
    redirect("/signin?redirect=/pos");
  }

  const assignment = await prisma.posRegisterSeller.findUnique({
    where: { registerId_userId: { registerId, userId: user.id } },
  });
  if (!assignment) {
    redirect("/pos");
  }

  const register = await prisma.posRegister.findUnique({
    where: { id: registerId },
    select: { id: true, name: true, status: true, trackFulfillment: true },
  });
  if (!register || register.status !== "ACTIVE" || !register.trackFulfillment) {
    notFound();
  }

  const orders = await prisma.posOrder.findMany({
    where: { registerId, status: "PAID", fulfillmentStatus: "OPEN" },
    orderBy: { paidAt: "asc" },
    include: { items: { select: { name: true, quantity: true } } },
  });

  return (
    <PosKitchenDisplay
      registerId={register.id}
      registerName={register.name}
      initialOrders={orders.map(order => ({
        id: order.id,
        orderHash: order.orderHash,
        shortCode: order.shortCode,
        queueNumber: order.queueNumber,
        note: order.note,
        paidAt: order.paidAt?.toISOString() ?? order.createdAt.toISOString(),
        items: order.items,
      }))}
    />
  );
}
