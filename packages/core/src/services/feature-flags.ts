import dbConnect from "@wse/core/lib/db";
import FeatureFlag from "@wse/core/models/FeatureFlag";

export class FeatureFlagService {
  static async isEnabled(key: string, fallback: boolean = false): Promise<boolean> {
    await dbConnect();
    const flag = await FeatureFlag.findOne({ key }).lean();
    if (!flag) return fallback;
    return Boolean(flag.enabled);
  }
}
