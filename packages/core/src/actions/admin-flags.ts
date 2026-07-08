"use server";

import { revalidatePath } from "next/cache";
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags";
import { setCachedMaintenanceEnabled } from "@wse/core/lib/maintenance-flag-cache";
import dbConnect from "@wse/core/lib/db";
import FeatureFlag from "@wse/core/models/FeatureFlag";
import { requireAdmin } from "@wse/core/lib/admin-auth";
import {
  isAdminFlagKeyAccessible,
  getAccessiblePluginFeatureFlagKeys,
  getDeploymentForAdmin,
} from "@wse/core/lib/admin-settings-access";
import { isShopEnabled } from "@wse/core/lib/features/shop";
import { PluginService } from "@wse/core/services/plugin";

type FlagSeed = {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
};

const DEFAULT_FLAGS: FlagSeed[] = [
  {
    key: "newsletter",
    label: "Hírlevél modul",
    description: "Hírlevél oldalak és kampánykezelés engedélyezése.",
    defaultEnabled: false,
  },
  {
    key: "shopPage",
    label: "Shop oldal",
    description: "A /shop oldal és a főoldali termék-kategória blokk engedélyezése.",
    defaultEnabled: true,
  },
  {
    key: "maintenanceMode",
    label: "Karbantartás mód",
    description: "Nem admin felhasználóknak minden oldal helyett a karbantartási oldal jelenik meg.",
    defaultEnabled: false,
  },
  {
    key: "glsParcelPicker",
    label: "GLS csomagpont választó (pénztár)",
    description: "GLS csomagpont térkép/widget a pénztárban; a GLS szállítási mód csak így jelenik meg.",
    defaultEnabled: false,
  },
  {
    key: "glsParcelManager",
    label: "GLS csomagkezelő (admin)",
    description: "Rendelés adminban: GLS címke generálás és letöltés MyGLS API-val.",
    defaultEnabled: false,
  },
  {
    key: "foxpostParcelPicker",
    label: "Foxpost csomagautomata választó (pénztár)",
    description: "Foxpost APT finder iframe a pénztárban; a Foxpost szállítási mód csak így jelenik meg.",
    defaultEnabled: false,
  },
  {
    key: "foxpostParcelManager",
    label: "Foxpost csomagkezelő (admin)",
    description: "Rendelés adminban: Foxpost csomag létrehozás és címke PDF FoxWeb API-val.",
    defaultEnabled: false,
  },
  {
    key: "stripePayments",
    label: "Stripe fizetés",
    description: "Stripe alapú online kártyás fizetés engedélyezése.",
    defaultEnabled: false,
  },
  {
    key: "szamlazzInvoicing",
    label: "Automatikus számlázás",
    description: "Számlázz.hu/szamlazz.ts alapú automatikus számlázás.",
    defaultEnabled: false,
  },
  {
    key: "pluginCampBooking",
    label: "Tábor foglalás plugin",
    description: "Minecraft / tábor turnus foglalás, Stripe checkout, Excel export.",
    defaultEnabled: false,
  },
  {
    key: "pluginPressKit",
    label: "Sajtóanyagok plugin",
    description: "Jelszóval védett sajtóportál, CMS, PDF előnézet, meghívók és statisztika.",
    defaultEnabled: false,
  },
  {
    key: "pluginOrderLab",
    label: "Order Lab plugin",
    description: "Foxpost sandbox rendeléskezelés és csomag/címke teszt külön gyűjteményben.",
    defaultEnabled: false,
  },
];

async function migrateLegacyCombinedParcelFlag() {
  const legacy = await FeatureFlag.findOne({ key: "glsParcelPicker" }).lean();
  if (!legacy?.description?.includes("GLS és Foxpost")) {
    return;
  }
  const wasEnabled = Boolean(legacy.enabled);
  const parcelKeys = ["glsParcelPicker", "glsParcelManager", "foxpostParcelPicker", "foxpostParcelManager"] as const;
  const seeds = DEFAULT_FLAGS.filter((f) => parcelKeys.includes(f.key as (typeof parcelKeys)[number]));

  for (const seed of seeds) {
    await FeatureFlag.findOneAndUpdate(
      { key: seed.key },
      {
        $set: {
          label: seed.label,
          description: seed.description,
          ...(wasEnabled ? { enabled: true } : {}),
        },
        $setOnInsert: {
          key: seed.key,
          enabled: wasEnabled ? true : seed.defaultEnabled,
        },
      },
      { upsert: true }
    );
  }
}

export async function getAdminFeatureFlags() {
  await requireAdmin();
  await dbConnect();

  for (const flag of DEFAULT_FLAGS) {
    await FeatureFlag.findOneAndUpdate(
      { key: flag.key },
      {
        $setOnInsert: {
          key: flag.key,
          label: flag.label,
          description: flag.description,
          enabled: flag.defaultEnabled,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  await migrateLegacyCombinedParcelFlag();

  for (const flag of DEFAULT_FLAGS) {
    await FeatureFlag.findOneAndUpdate(
      { key: flag.key },
      { $set: { label: flag.label, description: flag.description } },
      { upsert: false }
    );
  }

  const flags = await FeatureFlag.find({}).sort({ key: 1 }).lean();
  return JSON.parse(JSON.stringify(flags));
}

export async function updateFeatureFlag(flagKey: string, enabled: boolean) {
  await requireAdmin();
  const host = await PluginService.getHost();
  const deployment = getDeploymentForAdmin(host);
  const shopEnabled = isShopEnabled();
  const pluginFlagKeys = new Set(getAccessiblePluginFeatureFlagKeys(deployment));
  const allowed =
    isAdminFlagKeyAccessible(flagKey, deployment, shopEnabled) || pluginFlagKeys.has(flagKey);
  if (!allowed) {
    throw new Error("Ez a beállítás nem érhető el ezen a deploymenten.");
  }
  await dbConnect();

  await FeatureFlag.findOneAndUpdate(
    { key: flagKey },
    { enabled },
    { returnDocument: "after" }
  );

  revalidatePath("/admin/info");
  revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.flags);
  if (flagKey === "maintenanceMode") {
    setCachedMaintenanceEnabled(enabled);
  }
}
