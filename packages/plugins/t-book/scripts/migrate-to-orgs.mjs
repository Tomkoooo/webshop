#!/usr/bin/env node
/**
 * One-time migration: assign legacy t-book data to a default organization.
 *
 * Usage:
 *   DATABASE_URL=mongodb://... node packages/plugins/t-book/scripts/migrate-to-orgs.mjs
 *
 * Env:
 *   TBOOK_MIGRATION_ORG_NAME — default org name (default: "Legacy")
 *   TBOOK_MIGRATION_PROMOTE_ADMINS_TO_SYSTEM — if "1", User.role===ADMIN → isSystemAdmin
 *   TBOOK_MIGRATION_ASSIGN_ADMINS_AS_OWNERS — if "1", ADMIN users also get Owner membership
 */
import mongoose from "mongoose"

const ORG_NAME = process.env.TBOOK_MIGRATION_ORG_NAME?.trim() || "Legacy"
const PROMOTE_SYSTEM = process.env.TBOOK_MIGRATION_PROMOTE_ADMINS_TO_SYSTEM === "1"
const ASSIGN_OWNERS = process.env.TBOOK_MIGRATION_ASSIGN_ADMINS_AS_OWNERS === "1"

function slugify(name) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "org"
  )
}

async function main() {
  const uri = process.env.DATABASE_URL
  if (!uri) {
    console.error("DATABASE_URL is required")
    process.exit(1)
  }

  await mongoose.connect(uri)
  const db = mongoose.connection.db

  const orgs = db.collection("tbookorganizations")
  const roles = db.collection("tbookorgroles")
  const memberships = db.collection("tbookorgmemberships")
  const users = db.collection("users")
  const groups = db.collection("tbookeventgroups")
  const events = db.collection("tbookevents")
  const hotels = db.collection("tbookhotels")
  const bookings = db.collection("tbookbookings")

  let org = await orgs.findOne({ slug: slugify(ORG_NAME) })
  if (!org) {
    const now = new Date()
    const insert = await orgs.insertOne({
      name: ORG_NAME,
      slug: slugify(ORG_NAME),
      status: "active",
      settings: { currency: "HUF" },
      createdBy: null,
      createdAt: now,
      updatedAt: now,
    })
    org = await orgs.findOne({ _id: insert.insertedId })
    console.info("[migrate] Created organization:", ORG_NAME, insert.insertedId.toString())
  } else {
    console.info("[migrate] Using existing organization:", org._id.toString())
  }

  const orgId = org._id

  let ownerRole = await roles.findOne({ organizationId: orgId, name: "Owner", isBuiltIn: true })
  if (!ownerRole) {
    const now = new Date()
    const allPerms = [
      "org:read",
      "org:update",
      "member:read",
      "member:invite",
      "member:manage",
      "role:read",
      "role:manage",
      "group:read",
      "group:write",
      "group:apiKey",
      "event:read",
      "event:write",
      "hotel:read",
      "hotel:write",
      "booking:read",
      "booking:export",
      "booking:manage",
      "stats:read",
    ]
    const viewerPerms = allPerms.filter((p) => p.includes(":read") || p === "stats:read")
    const ownerInsert = await roles.insertOne({
      organizationId: orgId,
      name: "Owner",
      description: "Teljes hozzáférés",
      permissions: allPerms,
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
    })
    await roles.insertOne({
      organizationId: orgId,
      name: "Viewer",
      description: "Csak olvasás",
      permissions: viewerPerms,
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
    })
    ownerRole = await roles.findOne({ _id: ownerInsert.insertedId })
    console.info("[migrate] Seeded built-in roles")
  }

  const entityUpdates = await Promise.all([
    groups.updateMany({ organizationId: { $in: [null, undefined] } }, { $set: { organizationId: orgId } }),
    events.updateMany({ organizationId: { $in: [null, undefined] } }, { $set: { organizationId: orgId } }),
    hotels.updateMany({ organizationId: { $in: [null, undefined] } }, { $set: { organizationId: orgId } }),
    bookings.updateMany({ organizationId: { $in: [null, undefined] } }, { $set: { organizationId: orgId } }),
  ])
  console.info("[migrate] Backfilled organizationId:", {
    groups: entityUpdates[0].modifiedCount,
    events: entityUpdates[1].modifiedCount,
    hotels: entityUpdates[2].modifiedCount,
    bookings: entityUpdates[3].modifiedCount,
  })

  if (PROMOTE_SYSTEM) {
    const promoted = await users.updateMany(
      { role: "ADMIN", isSystemAdmin: { $ne: true } },
      { $set: { isSystemAdmin: true } }
    )
    console.info("[migrate] Promoted ADMIN users to isSystemAdmin:", promoted.modifiedCount)
  }

  if (ASSIGN_OWNERS) {
    const adminUsers = await users.find({ $or: [{ role: "ADMIN" }, { isSystemAdmin: true }] }).toArray()
    for (const user of adminUsers) {
      await memberships.updateOne(
        { organizationId: orgId, userId: user._id },
        {
          $set: {
            organizationId: orgId,
            userId: user._id,
            roleIds: [ownerRole._id],
            status: "active",
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      )
    }
    console.info("[migrate] Assigned Owner membership to admin users:", adminUsers.length)
  }

  await mongoose.disconnect()
  console.info("[migrate] Done.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
