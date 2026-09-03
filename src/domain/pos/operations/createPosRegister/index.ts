import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { PosRegister, PosRegisterStatus } from "@prisma/client";
import { bustOnPosRegisterChanged } from "@/lib/services/cache";

export interface CreatePosRegisterInput {
  name: string;
  description?: string;
  status?: PosRegisterStatus;
  canTopUp?: boolean;
  acceptsWallet?: boolean;
  acceptsCash?: boolean;
  acceptsCard?: boolean;
  fiscalizeInvoices?: boolean;
  trackFulfillment?: boolean;
  printerUrl?: string | null;
}

export async function createPosRegister(
  input: CreatePosRegisterInput
): Promise<PosRegister> {
  const acceptsWallet = input.acceptsWallet ?? true;
  const acceptsCash = input.acceptsCash ?? false;
  const acceptsCard = input.acceptsCard ?? false;
  if (!acceptsWallet && !acceptsCash && !acceptsCard) {
    throw new Error("Register must accept at least one payment method");
  }

  const register = await prisma.posRegister.create({
    data: {
      name: input.name,
      description: input.description,
      status: input.status ?? "ACTIVE",
      canTopUp: input.canTopUp ?? false,
      acceptsWallet,
      acceptsCash,
      acceptsCard,
      fiscalizeInvoices: input.fiscalizeInvoices ?? false,
      trackFulfillment: input.trackFulfillment ?? false,
      printerUrl: input.printerUrl ?? null,
    },
  });

  await bustOnPosRegisterChanged();

  return register;
}
