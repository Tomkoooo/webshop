import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import mongoose from "mongoose"

const BACKUP_ROOT = join(import.meta.dirname, "../backups")

export type SeedBackupManifest = {
  createdAt: string
  database: string
  label: string
  collections: string[]
}

export async function backupCollectionsBeforeSeed(
  label: string,
  collectionNames: string[],
  filter?: Record<string, unknown>
): Promise<string> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const dir = join(BACKUP_ROOT, `${stamp}-${label}`)
  await mkdir(dir, { recursive: true })

  const db = mongoose.connection.db
  if (!db) throw new Error("mongoose connection not ready")

  const manifest: SeedBackupManifest = {
    createdAt: new Date().toISOString(),
    database: db.databaseName,
    label,
    collections: collectionNames,
  }

  for (const name of collectionNames) {
    const docs = await db
      .collection(name)
      .find(filter ?? {})
      .toArray()
    await writeFile(join(dir, `${name}.json`), JSON.stringify(docs, null, 2), "utf8")
  }

  await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8")
  console.log(`  Backup written: ${dir}`)
  return dir
}
