"use server";

import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { revalidatePath } from "next/cache";
import dbConnect from "@wse/core/lib/db";
import User from "@wse/core/models/User";
import Order from "@wse/core/models/Order";
import PasswordResetToken from "@wse/core/models/PasswordResetToken";
import { requireAdmin } from "@wse/core/lib/admin-auth";
import { formatEmailFromHeader } from "@wse/core/lib/email-from";
import { hashPassword, sha256Hex } from "@wse/core/lib/password";
import { repairAuthAccounts } from "@wse/core/lib/repair-auth-accounts";
import {
  buildAdminCustomerRows,
  type AdminCustomerFilters,
} from "@wse/core/lib/admin-customers";

type UserRole = "ADMIN" | "USER";
type AdminUserRow = {
  _id: { toString: () => string };
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
};

type UserOrderRow = {
  _id: { toString: () => string };
  total: number;
  status: string;
  createdAt: Date | string;
  items: { name: string; quantity: number; variantLabel?: string }[];
  billingInfo?: {
    type?: "personal" | "company";
    name?: string;
    taxNumber?: string;
    zip?: string;
    city?: string;
    street?: string;
  };
  shippingAddress?: {
    name?: string;
    zip?: string;
    city?: string;
    street?: string;
    comment?: string;
  };
};

type AdminUserFilters = AdminCustomerFilters;

function normalizeRole(role: string): UserRole {
  return role === "ADMIN" ? "ADMIN" : "USER";
}

async function getTransporter() {
  const user = process.env.EMAIL_USER || "test@example.com";
  const pass = process.env.EMAIL_PASS || "password";
  const host = process.env.EMAIL_HOST || "smtp.example.com";
  const port = parseInt(process.env.EMAIL_PORT || "587");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function getAdminUsers(filters: AdminUserFilters = {}) {
  await requireAdmin();
  await dbConnect();

  const [usersRaw, ordersRaw] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).lean(),
    Order.find({})
      .sort({ createdAt: -1 })
      .select("_id user total status createdAt billingInfo.name billingInfo.email shippingAddress.name shippingAddress.email")
      .lean(),
  ]);

  const enriched = buildAdminCustomerRows(usersRaw, ordersRaw, filters);
  return JSON.parse(JSON.stringify(enriched));
}

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin();
  await dbConnect();

  await User.findByIdAndUpdate(userId, { role: normalizeRole(role) });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function createAdminUser(formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const role = normalizeRole(String(formData.get("role") || "ADMIN"));

  if (!email) throw new Error("Email megadása kötelező.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Adj meg egy érvényes email címet.");
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    await User.findByIdAndUpdate(existing._id, {
      role,
      ...(name ? { name } : {}),
    });
  } else {
    await User.create({
      email,
      name: name || undefined,
      role,
      newsletterSubscribed: false,
    });
  }

  revalidatePath("/admin/users");
}

export async function deleteAdminUser(userId: string) {
  const session = await requireAdmin();
  await dbConnect();

  if (session.user?.id === userId) {
    throw new Error("Saját admin fiókot nem törölhetsz.");
  }

  const user = await User.findById(userId).lean();
  if (!user) throw new Error("Felhasználó nem található.");

  if (user.role === "ADMIN") {
    const adminCount = await User.countDocuments({ role: "ADMIN" });
    if (adminCount <= 1) {
      throw new Error("Az utolsó admin fiók nem törölhető.");
    }
  }

  const ongoingOrders = await Order.countDocuments({
    user: userId,
    status: { $in: ["pending", "processing", "shipped"] },
  });
  if (ongoingOrders > 0) {
    throw new Error("A felhasználónak folyamatban lévő rendelése van — előbb zárd le.");
  }

  await User.findByIdAndDelete(userId);

  const client = await import("@wse/core/lib/mongodb").then((m) => m.default);
  const db = (await client).db();
  await db.collection("accounts").deleteMany({ userId: user._id });
  await db.collection("sessions").deleteMany({ userId: user._id });

  revalidatePath("/admin/users");
}

export async function syncAuthUserProfiles() {
  await requireAdmin();
  const result = await repairAuthAccounts();
  revalidatePath("/admin/users");
  return result;
}

export async function updateAdminUserProfile(userId: string, formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = normalizeRole(String(formData.get("role") || "USER"));

  if (!email) throw new Error("Email megadása kötelező.");
  const existing = await User.findOne({ email, _id: { $ne: userId } }).lean();
  if (existing) throw new Error("Ez az email cím már használatban van.");

  await User.findByIdAndUpdate(userId, {
    name: name || undefined,
    email,
    role,
  });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function updateAdminUserPassword(userId: string, formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    throw new Error("A jelszónak legalább 8 karakter hosszúnak kell lennie.");
  }

  await User.findByIdAndUpdate(userId, { passwordHash: hashPassword(password) });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function getAdminUserDetails(userId: string) {
  await requireAdmin();
  await dbConnect();

  const [userRaw, ordersRaw] = await Promise.all([
    User.findById(userId).lean(),
    Order.find({ user: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!userRaw) {
    return null;
  }

  const user = userRaw as AdminUserRow & {
    billingInfo?: {
      type?: "personal" | "company";
      name?: string;
      taxNumber?: string;
      country?: string;
      city?: string;
      zip?: string;
      street?: string;
    };
    shippingAddress?: {
      name?: string;
      country?: string;
      city?: string;
      zip?: string;
      street?: string;
      comment?: string;
    };
    createdAt?: Date | string;
    passwordHash?: string;
  };

  const orders = ordersRaw as UserOrderRow[];
  const totalSpent = orders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + (order.total || 0), 0);

  return JSON.parse(
    JSON.stringify({
      user: {
        ...user,
        hasPassword: Boolean(user.passwordHash),
      },
      orders,
      stats: {
        ordersCount: orders.length,
        totalSpent,
        lastOrderAt: orders[0]?.createdAt || null,
      },
    })
  );
}

export async function sendAdminPasswordReset(userId: string) {
  await requireAdmin();
  await dbConnect();

  const user = await User.findById(userId).lean();
  if (!user?.email) {
    throw new Error("A felhasználóhoz nincs email cím beállítva.");
  }

  await PasswordResetToken.deleteMany({ user: userId, usedAt: { $exists: false } });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await PasswordResetToken.create({
    user: userId,
    tokenHash,
    expiresAt,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/auth/reset-password/${rawToken}`;

  const transporter = await getTransporter();

  await transporter.sendMail({
    from: formatEmailFromHeader(),
    to: user.email,
    subject: "Jelszó visszaállítás",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Jelszó visszaállítás</h2>
        <p>Kedves ${user.name || "Vásárló"}!</p>
        <p>Az admin felületről jelszó visszaállítás indult a fiókodhoz.</p>
        <p>Kattints az alábbi gombra a jelszó beállításához (60 percig érvényes):</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#FF5500;color:white;padding:12px 18px;text-decoration:none;">Jelszó visszaállítása</a>
        </p>
        <p>Ha nem te kérted, ezt az emailt figyelmen kívül hagyhatod.</p>
      </div>
    `,
  });

  revalidatePath(`/admin/users/${userId}`);
}
