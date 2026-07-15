import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import User from "@wse/core/models/User"
import { MailerService } from "@wse/core/services/mailer"
import TBookOrganization, { type ITBookOrganization } from "../models/TBookOrganization"
import TBookOrgMembership from "../models/TBookOrgMembership"
import TBookOrgRole, { type ITBookOrgRole } from "../models/TBookOrgRole"
import TBookOrgInvite from "../models/TBookOrgInvite"
import TBookEventGroup from "../models/TBookEventGroup"
import TBookEvent from "../models/TBookEvent"
import TBookBooking from "../models/TBookBooking"
import {
  TBOOK_OWNER_PERMISSIONS,
  TBOOK_VIEWER_PERMISSIONS,
  isTBookPermission,
  type TBookPermission,
} from "../lib/permissions"
import { generateInviteToken, hashInviteToken } from "../lib/org-auth"
import { DEFAULT_TBOOK_CURRENCY, normalizeTBookCurrency } from "../lib/currency"

function oid(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Érvénytelen azonosító.")
  }
  return new mongoose.Types.ObjectId(id)
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "org"
}

async function uniqueSlug(base: string): Promise<string> {
  await dbConnect()
  let slug = slugify(base)
  let suffix = 0
  while (await TBookOrganization.exists({ slug })) {
    suffix += 1
    slug = `${slugify(base)}-${suffix}`
  }
  return slug
}

async function seedBuiltInRoles(organizationId: mongoose.Types.ObjectId) {
  const owner = await TBookOrgRole.create({
    organizationId,
    name: "Owner",
    description: "Teljes hozzáférés a szervezethez.",
    permissions: TBOOK_OWNER_PERMISSIONS,
    isBuiltIn: true,
  })
  await TBookOrgRole.create({
    organizationId,
    name: "Viewer",
    description: "Csak olvasási jogosultságok.",
    permissions: TBOOK_VIEWER_PERMISSIONS,
    isBuiltIn: true,
  })
  return owner
}

export class TBookOrgService {
  // ---- Platform (system admin) --------------------------------------------

  static async listOrganizations(): Promise<ITBookOrganization[]> {
    await dbConnect()
    return TBookOrganization.find({}).sort({ createdAt: -1 }).lean<ITBookOrganization[]>()
  }

  static async getOrganization(id: string): Promise<ITBookOrganization | null> {
    await dbConnect()
    return TBookOrganization.findById(oid(id)).lean<ITBookOrganization>()
  }

  static async createOrganization(input: {
    name: string
    createdByUserId?: string | null
    ownerUserId?: string | null
    ownerEmail?: string | null
    currency?: string
  }): Promise<{ organization: ITBookOrganization; ownerRoleId: string }> {
    await dbConnect()
    const slug = await uniqueSlug(input.name)
    const organization = await TBookOrganization.create({
      name: input.name.trim(),
      slug,
      status: "active",
      settings: { currency: normalizeTBookCurrency(input.currency ?? DEFAULT_TBOOK_CURRENCY) },
      createdBy: input.createdByUserId ? oid(input.createdByUserId) : null,
    })

    const ownerRole = await seedBuiltInRoles(organization._id as mongoose.Types.ObjectId)

    if (input.ownerUserId) {
      await TBookOrgService.addMember({
        organizationId: String(organization._id),
        userId: input.ownerUserId,
        roleIds: [String(ownerRole._id)],
      })
    } else if (input.ownerEmail?.trim()) {
      await TBookOrgService.createInvite({
        organizationId: String(organization._id),
        email: input.ownerEmail.trim(),
        roleIds: [String(ownerRole._id)],
        invitedByUserId: input.createdByUserId ?? null,
      })
    }

    return { organization, ownerRoleId: String(ownerRole._id) }
  }

  static async updateOrganization(
    id: string,
    patch: { name?: string; status?: "active" | "suspended"; currency?: string }
  ): Promise<void> {
    await dbConnect()
    const update: Record<string, unknown> = {}
    if (patch.name !== undefined) update.name = patch.name.trim()
    if (patch.status !== undefined) update.status = patch.status
    if (patch.currency !== undefined) {
      update["settings.currency"] = normalizeTBookCurrency(patch.currency)
    }
    await TBookOrganization.updateOne({ _id: oid(id) }, { $set: update })
  }

  static async getOrganizationStats(organizationId: string) {
    await dbConnect()
    const orgOid = oid(organizationId)
    const [groupCount, eventCount, bookingCount, memberCount] = await Promise.all([
      TBookEventGroup.countDocuments({ organizationId: orgOid }),
      TBookEvent.countDocuments({ organizationId: orgOid }),
      TBookBooking.countDocuments({ organizationId: orgOid }),
      TBookOrgMembership.countDocuments({ organizationId: orgOid, status: "active" }),
    ])
    return { groupCount, eventCount, bookingCount, memberCount }
  }

  // ---- Org settings -------------------------------------------------------

  static async updateOrgSettings(
    organizationId: string,
    patch: { name?: string; currency?: string }
  ): Promise<void> {
    await dbConnect()
    const update: Record<string, unknown> = {}
    if (patch.name !== undefined) update.name = patch.name.trim()
    if (patch.currency !== undefined) update["settings.currency"] = normalizeTBookCurrency(patch.currency)
    await TBookOrganization.updateOne({ _id: oid(organizationId) }, { $set: update })
  }

  // ---- Members ------------------------------------------------------------

  static async listMembers(organizationId: string) {
    await dbConnect()
    const memberships = await TBookOrgMembership.find({ organizationId: oid(organizationId) })
      .sort({ createdAt: 1 })
      .lean()
    const userIds = memberships.map((m) => m.userId)
    const users = await User.find({ _id: { $in: userIds } })
      .select("name email image")
      .lean()
    const userMap = new Map(users.map((u) => [String(u._id), u]))
    const roles = await TBookOrgRole.find({ organizationId: oid(organizationId) }).lean()
    const roleMap = new Map(roles.map((r) => [String(r._id), r]))

    return memberships.map((m) => ({
      id: String(m._id),
      userId: String(m.userId),
      status: m.status,
      user: userMap.get(String(m.userId)) ?? null,
      roles: (m.roleIds ?? []).map((rid) => roleMap.get(String(rid))).filter(Boolean),
      createdAt: m.createdAt,
    }))
  }

  static async addMember(input: {
    organizationId: string
    userId: string
    roleIds: string[]
  }): Promise<void> {
    await dbConnect()
    const orgOid = oid(input.organizationId)
    const userOid = oid(input.userId)
    const roleOids = input.roleIds.map(oid)

    const existing = await TBookOrgMembership.findOne({ organizationId: orgOid, userId: userOid })
    if (existing) {
      await TBookOrgMembership.updateOne(
        { _id: existing._id },
        { $set: { roleIds: roleOids, status: "active" } }
      )
      return
    }

    await TBookOrgMembership.create({
      organizationId: orgOid,
      userId: userOid,
      roleIds: roleOids,
      status: "active",
    })
  }

  static async updateMember(input: {
    organizationId: string
    membershipId: string
    roleIds?: string[]
    status?: "active" | "disabled"
  }): Promise<void> {
    await dbConnect()
    const patch: Record<string, unknown> = {}
    if (input.roleIds) patch.roleIds = input.roleIds.map(oid)
    if (input.status) patch.status = input.status
    await TBookOrgMembership.updateOne(
      { _id: oid(input.membershipId), organizationId: oid(input.organizationId) },
      { $set: patch }
    )
  }

  static async removeMember(organizationId: string, membershipId: string): Promise<void> {
    await dbConnect()
    await TBookOrgMembership.deleteOne({
      _id: oid(membershipId),
      organizationId: oid(organizationId),
    })
  }

  static async findUserByEmail(email: string) {
    await dbConnect()
    return User.findOne({ email: email.trim().toLowerCase() }).lean()
  }

  // ---- Roles --------------------------------------------------------------

  static async listRoles(organizationId: string): Promise<ITBookOrgRole[]> {
    await dbConnect()
    return TBookOrgRole.find({ organizationId: oid(organizationId) })
      .sort({ isBuiltIn: -1, name: 1 })
      .lean<ITBookOrgRole[]>()
  }

  static async createRole(input: {
    organizationId: string
    name: string
    description?: string
    permissions: string[]
  }): Promise<ITBookOrgRole> {
    await dbConnect()
    const permissions = input.permissions.filter(isTBookPermission) as TBookPermission[]
    return TBookOrgRole.create({
      organizationId: oid(input.organizationId),
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      permissions,
      isBuiltIn: false,
    })
  }

  static async updateRole(input: {
    organizationId: string
    roleId: string
    name?: string
    description?: string
    permissions?: string[]
  }): Promise<void> {
    await dbConnect()
    const role = await TBookOrgRole.findOne({
      _id: oid(input.roleId),
      organizationId: oid(input.organizationId),
    }).lean()
    if (!role) throw new Error("Szerepkör nem található.")
    if (role.isBuiltIn && input.name !== undefined && input.name !== role.name) {
      throw new Error("Beépített szerepkör neve nem módosítható.")
    }

    const patch: Record<string, unknown> = {}
    if (input.name !== undefined) patch.name = input.name.trim()
    if (input.description !== undefined) patch.description = input.description.trim()
    if (input.permissions !== undefined) {
      patch.permissions = input.permissions.filter(isTBookPermission)
    }
    await TBookOrgRole.updateOne({ _id: oid(input.roleId) }, { $set: patch })
  }

  static async deleteRole(organizationId: string, roleId: string): Promise<void> {
    await dbConnect()
    const role = await TBookOrgRole.findOne({
      _id: oid(roleId),
      organizationId: oid(organizationId),
    }).lean()
    if (!role) throw new Error("Szerepkör nem található.")
    if (role.isBuiltIn) throw new Error("Beépített szerepkör nem törölhető.")

    const inUse = await TBookOrgMembership.countDocuments({
      organizationId: oid(organizationId),
      roleIds: oid(roleId),
    })
    if (inUse > 0) throw new Error("A szerepkör tagokhoz van rendelve — előbb vedd el tőlük.")

    await TBookOrgRole.deleteOne({ _id: oid(roleId) })
  }

  // ---- Invites ------------------------------------------------------------

  static async listInvites(organizationId: string) {
    await dbConnect()
    const now = new Date()
    return TBookOrgInvite.find({
      organizationId: oid(organizationId),
      acceptedAt: null,
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .lean()
  }

  static async createInvite(input: {
    organizationId: string
    email: string
    roleIds: string[]
    invitedByUserId?: string | null
  }): Promise<{ inviteId: string; token?: string }> {
    await dbConnect()
    const email = input.email.trim().toLowerCase()
    const org = await TBookOrganization.findById(oid(input.organizationId)).lean()
    if (!org) throw new Error("Szervezet nem található.")

    const existingUser = await User.findOne({ email }).lean()
    if (existingUser) {
      await TBookOrgService.addMember({
        organizationId: input.organizationId,
        userId: String(existingUser._id),
        roleIds: input.roleIds,
      })
      return { inviteId: "" }
    }

    const token = generateInviteToken()
    const invite = await TBookOrgInvite.create({
      organizationId: oid(input.organizationId),
      email,
      roleIds: input.roleIds.map(oid),
      tokenHash: hashInviteToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedBy: input.invitedByUserId ? oid(input.invitedByUserId) : null,
    })

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "").replace(/\/$/, "")
    const acceptUrl = `${appUrl}/auth/invite?token=${encodeURIComponent(token)}`

    try {
      await MailerService.sendSystemHtmlEmail({
        to: email,
        subject: `Meghívó: ${org.name} — tBook`,
        html: `<p>Meghívtak a <strong>${org.name}</strong> szervezetbe a tBook adminban.</p>
<p><a href="${acceptUrl}">Meghívó elfogadása</a></p>
<p>A link 7 napig érvényes. Bejelentkezés Google fiókkal szükséges.</p>`,
        text: `Meghívtak a ${org.name} szervezetbe. Nyisd meg: ${acceptUrl}`,
        logContext: { flow: "tbook_org_invite", organizationId: input.organizationId },
      })
    } catch (error) {
      console.error("[tbook-org] invite email failed", error)
      if (process.env.NODE_ENV !== "production") {
        console.info("[tbook-org] invite token (dev only):", token)
      }
    }

    return { inviteId: String(invite._id), token: process.env.NODE_ENV !== "production" ? token : undefined }
  }

  static async acceptInviteByToken(token: string, userId: string, userEmail: string): Promise<string | null> {
    await dbConnect()
    const tokenHash = hashInviteToken(token)
    const invite = await TBookOrgInvite.findOne({
      tokenHash,
      acceptedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean()
    if (!invite) return null

    const email = userEmail.trim().toLowerCase()
    if (invite.email !== email) {
      throw new Error("A meghívó más e-mail címre szólt.")
    }

    await TBookOrgService.addMember({
      organizationId: String(invite.organizationId),
      userId,
      roleIds: (invite.roleIds ?? []).map(String),
    })

    await TBookOrgInvite.updateOne({ _id: invite._id }, { $set: { acceptedAt: new Date() } })
    return String(invite.organizationId)
  }

  static async processPendingInvitesForEmail(email: string, userId: string): Promise<string[]> {
    await dbConnect()
    const normalized = email.trim().toLowerCase()
    const invites = await TBookOrgInvite.find({
      email: normalized,
      acceptedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean()

    const orgIds: string[] = []
    for (const invite of invites) {
      await TBookOrgService.addMember({
        organizationId: String(invite.organizationId),
        userId,
        roleIds: (invite.roleIds ?? []).map(String),
      })
      await TBookOrgInvite.updateOne({ _id: invite._id }, { $set: { acceptedAt: new Date() } })
      orgIds.push(String(invite.organizationId))
    }
    return orgIds
  }

  static async listOrganizationsForUser(userId: string) {
    await dbConnect()
    const memberships = await TBookOrgMembership.find({
      userId: oid(userId),
      status: "active",
    }).lean()
    const orgIds = memberships.map((m) => m.organizationId)
    const orgs = await TBookOrganization.find({ _id: { $in: orgIds }, status: "active" })
      .sort({ name: 1 })
      .lean()
    return orgs.map((org) => ({
      id: String(org._id),
      name: org.name,
      slug: org.slug,
    }))
  }

  static async getOwnerRoleId(organizationId: string): Promise<string | null> {
    await dbConnect()
    const role = await TBookOrgRole.findOne({
      organizationId: oid(organizationId),
      name: "Owner",
      isBuiltIn: true,
    }).lean()
    return role ? String(role._id) : null
  }

  /** Default role for new members when none is selected (Viewer, else first role). */
  static async getDefaultMemberRoleIds(organizationId: string): Promise<string[]> {
    await dbConnect()
    const viewer = await TBookOrgRole.findOne({
      organizationId: oid(organizationId),
      name: "Viewer",
      isBuiltIn: true,
    }).lean()
    if (viewer) return [String(viewer._id)]
    const any = await TBookOrgRole.findOne({ organizationId: oid(organizationId) })
      .sort({ isBuiltIn: -1, name: 1 })
      .lean()
    return any ? [String(any._id)] : []
  }
}
