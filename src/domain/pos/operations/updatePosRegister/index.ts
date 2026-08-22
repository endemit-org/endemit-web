import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { PosRegister, PosRegisterStatus } from "@prisma/client";
import { bustOnPosRegisterChanged } from "@/lib/services/cache";

export interface UpdatePosRegisterInput {
  id: string;
  name?: string;
  description?: string | null;
  status?: PosRegisterStatus;
  canTopUp?: boolean;
  acceptsWallet?: boolean;
  acceptsCash?: boolean;
  acceptsCard?: boolean;
  fiscalizeInvoices?: boolean;
  trackFulfillment?: boolean;
}

export async function updatePosRegister(
  input: UpdatePosRegisterInput
): Promise<PosRegister> {
  if (
    input.acceptsWallet === false &&
    input.acceptsCash === false &&
    input.acceptsCard === false
  ) {
    throw new Error("Register must accept at least one payment method");
  }

  const register = await prisma.posRegister.update({
    where: { id: input.id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.canTopUp !== undefined && { canTopUp: input.canTopUp }),
      ...(input.acceptsWallet !== undefined && { acceptsWallet: input.acceptsWallet }),
      ...(input.acceptsCash !== undefined && { acceptsCash: input.acceptsCash }),
      ...(input.acceptsCard !== undefined && { acceptsCard: input.acceptsCard }),
      ...(input.fiscalizeInvoices !== undefined && { fiscalizeInvoices: input.fiscalizeInvoices }),
      ...(input.trackFulfillment !== undefined && { trackFulfillment: input.trackFulfillment }),
    },
  });

  await bustOnPosRegisterChanged();

  return register;
}
