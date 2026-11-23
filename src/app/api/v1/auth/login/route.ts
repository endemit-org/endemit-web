import { NextRequest, NextResponse } from "next/server";
import { createUserSession } from "@/lib/services/auth";
import { z } from "zod";
import { authenticateUser } from "@/domain/auth/operations/authenticateUser";
import {
  RATE_LIMITED_MESSAGE,
  consumeClientRateLimit,
  consumeRateLimit,
} from "@/lib/services/rateLimit";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid credentials format" },
        { status: 400 }
      );
    }

    const { username, password } = result.data;

    // Password guessing: capped per client and per targeted account.
    const window = { windowMs: 10 * 60 * 1000 };
    const isAllowed =
      (await consumeClientRateLimit("login", { limit: 20, ...window })) &&
      (await consumeRateLimit(`login:user:${username.toLowerCase()}`, {
        limit: 10,
        ...window,
      }));

    if (!isAllowed) {
      return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });
    }

    // Authenticate user
    const user = await authenticateUser({ username, password });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session
    await createUserSession(user.id, request);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
