import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import type { Metadata } from "next";
import { PosRegisterInterface } from "@/app/_components/pos/PosRegisterInterface";

export const metadata: Metadata = {
  title: "POS",
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  params: Promise<{ registerId: string }>;
}

export default async function PosRegisterPage({ params }: Props) {
  const user = await getCurrentUser();
  const { registerId } = await params;

  if (!user) {
    redirect("/signin?redirect=/pos");
  }

  // Check assignment and count user's registers
  const [assignment, userRegisterCount] = await Promise.all([
    prisma.posRegisterSeller.findUnique({
      where: {
        registerId_userId: {
          registerId,
          userId: user.id,
        },
      },
    }),
    prisma.posRegisterSeller.count({
      where: {
        userId: user.id,
        register: { status: "ACTIVE" },
      },
    }),
  ]);

  if (!assignment) {
    redirect("/pos");
  }

  // Get register with items
  const register = await prisma.posRegister.findUnique({
    where: { id: registerId },
    include: {
      items: {
        where: { item: { status: "ACTIVE" } },
        include: { item: true },
        orderBy: { item: { name: "asc" } },
      },
    },
  });

  if (!register || register.status !== "ACTIVE") {
    notFound();
  }

  // Get pending orders for this seller at this register
  const pendingOrders = await prisma.posOrder.findMany({
    where: {
      registerId,
      sellerId: user.id,
      status: "PENDING",
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const items = register.items.map(ri => ({
    id: ri.item.id,
    name: ri.item.name,
    description: ri.item.description,
    cost: ri.item.cost,
    direction: ri.item.direction,
  }));

  return (
    <PosRegisterInterface
      register={{
        id: register.id,
        name: register.name,
        canTopUp: register.canTopUp,
      }}
      items={items}
      showBackButton={userRegisterCount > 1}
      initialPendingOrders={pendingOrders.map(o => ({
        id: o.id,
        shortCode: o.shortCode,
        orderHash: o.orderHash,
        subtotal: o.subtotal,
        total: o.total,
        status: o.status,
        scannedAt: o.scannedAt?.toISOString() ?? null,
        expiresAt: o.expiresAt.toISOString(),
        createdAt: o.createdAt.toISOString(),
        items: o.items.map(i => ({
          itemId: i.itemId,
          name: i.name,
          quantity: i.quantity,
          total: i.total,
        })),
      }))}
    />
  );
}
