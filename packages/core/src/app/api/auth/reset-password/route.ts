import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@wse/core/lib/db";
import PasswordResetToken from "@wse/core/models/PasswordResetToken";
import User from "@wse/core/models/User";
import { hashPassword, sha256Hex } from "@wse/core/lib/password";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Hiányzó token." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "A jelszónak legalább 8 karakter hosszúnak kell lennie." },
        { status: 400 }
      );
    }

    await dbConnect();

    const tokenHash = sha256Hex(token);
    const resetEntry = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    if (!resetEntry) {
      return NextResponse.json(
        { error: "A token érvénytelen vagy lejárt." },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    await User.findByIdAndUpdate(resetEntry.user, { passwordHash });

    resetEntry.usedAt = new Date();
    await resetEntry.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Szerver hiba történt." }, { status: 500 });
  }
}
