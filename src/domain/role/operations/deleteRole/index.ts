import "server-only";

import { prisma } from "@/lib/services/prisma";

export const deleteRole = async (id: string): Promise<void> => {
  // Check if role is a system role
  const role = await prisma.role.findUnique({
    where: { id },
    select: { isSystem: true },
  });

  if (role?.isSystem) {
    throw new Error("Cannot delete system roles");
  }

  await prisma.role.delete({
    where: { id },
  });
};
