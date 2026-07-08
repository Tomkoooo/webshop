import { NextResponse } from "next/server";
import { auth } from "@wse/core/auth";
import dbConnect from "@wse/core/lib/db";
import User from "@wse/core/models/User";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Bejelentkezés szükséges." }, { status: 401 });
  }

  await dbConnect();

  const user = session.user.id
    ? await User.findById(session.user.id)
    : await User.findOne({ email: session.user.email });

  if (!user) {
    return NextResponse.json({ error: "Felhasználó nem található." }, { status: 404 });
  }

  if (!user.email) {
    return NextResponse.json({ error: "A feliratkozáshoz email cím szükséges." }, { status: 400 });
  }

  user.newsletterSubscribed = true;
  if (!user.newsletterSubscribedAt) {
    user.newsletterSubscribedAt = new Date();
  }
  user.newsletterUnsubscribedAt = undefined;
  await user.save();

  return NextResponse.json({ success: true, newsletterSubscribed: true });
}
