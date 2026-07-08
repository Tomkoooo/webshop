"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags";
import dbConnect from "@wse/core/lib/db";
import LegalDocument, { LegalDocumentKey } from "@wse/core/models/LegalDocument";
import { requireAdmin } from "@wse/core/lib/admin-auth";
import { MediaService } from "@wse/core/services/media";

const DOC_META: Record<LegalDocumentKey, { title: string }> = {
  impresszum: { title: "Impresszum" },
  terms: { title: "ÁSZF" },
  gdpr: { title: "GDPR / Adatkezelési tájékoztató" },
};

function normalizeKey(key: string): LegalDocumentKey {
  if (key === "impresszum" || key === "terms" || key === "gdpr") return key;
  throw new Error("Érvénytelen dokumentum típus.");
}

export async function getAdminLegalDocuments() {
  await requireAdmin();
  await dbConnect();
  const docs = await LegalDocument.find({}).lean();
  return JSON.parse(JSON.stringify(docs));
}

export async function uploadLegalDocument(key: string, formData: FormData) {
  await requireAdmin();
  await dbConnect();

  const safeKey = normalizeKey(key);
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Kérlek válassz fájlt.");
  }

  const existing = await LegalDocument.findOne({ key: safeKey });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = await MediaService.processUpload(buffer, file.name, file.type || "application/pdf");
  await MediaService.incrementUsage(filename);

  await LegalDocument.findOneAndUpdate(
    { key: safeKey },
    {
      key: safeKey,
      title: DOC_META[safeKey].title,
      fileName: filename,
      uploadedAt: new Date(),
    },
    { upsert: true, returnDocument: "after" }
  );

  if (existing?.fileName && existing.fileName !== filename) {
    await MediaService.decrementUsage(existing.fileName);
  }

  revalidatePath("/admin/info");
  revalidatePath("/");
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.legal);
}
