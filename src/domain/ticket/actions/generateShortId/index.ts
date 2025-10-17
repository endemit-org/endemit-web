import { customAlphabet } from "nanoid";
import { prisma } from "@/services/prisma";

export const generateShortId = async (maxRetries = 10) => {
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 4);

  for (let i = 0; i < maxRetries; i++) {
    const generatedId = nanoid();

    const existing = await prisma.ticket.findUnique({
      where: {
        shortId: generatedId,
      },
    });

    if (!existing) return generatedId;
  }

  throw new Error(`Failed to generate unique ID after ${maxRetries} attempts`);
};
