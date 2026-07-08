import { NextResponse } from "next/server";
import dbConnect from "@wse/core/lib/db";
import LegalDocument from "@wse/core/models/LegalDocument";

export async function GET() {
  await dbConnect();
  const docs = (await LegalDocument.find({}).lean()) as Array<{
    key: string;
    title: string;
    fileName: string;
    uploadedAt?: string | Date;
  }>;

  const normalized = docs.map((doc) => ({
    key: doc.key,
    title: doc.title,
    href: `/api/media/${doc.fileName}`,
    uploadedAt: doc.uploadedAt,
  }));

  return NextResponse.json(normalized);
}
