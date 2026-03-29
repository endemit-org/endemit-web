"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { updateUser } from "@/domain/user/operations/updateUser";
import type { SerializedUser } from "@/domain/user/types";

interface UpdateMyProfileInput {
  name?: string | null;
  image?: string | null;
}

export async function updateMyProfileAction(
  data: UpdateMyProfileInput
): Promise<SerializedUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  return await updateUser(currentUser.id, {
    name: data.name,
    image: data.image,
  });
}
