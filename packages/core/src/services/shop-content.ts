import dbConnect from "@wse/core/lib/db";
import ShopContent from "@wse/core/models/ShopContent";

export type ShopContentKey = 
  | "hero_title"
  | "hero_description"
  | "hero_primary_cta"
  | "hero_secondary_cta"
  | "hero_badges"
  | "story_title"
  | "story_content"
  | "story_accordions"
  | "story_cards"
  | "features_title"
  | "features_subtitle"
  | "features_cards"
  | "reviews_title"
  | "reviews_subtitle"
  | "shop_title"
  | "shop_description"
  | "shop_view_all_label"
  | "shop_featured_title"
  | "contact_title"
  | "contact_highlight"
  | "contact_description"
  | "contact_form_button"
  | "shop_seo_title"
  | "shop_seo_description"
  | "contact_email"
  | "contact_emails"
  | "invoice_error_alert_emails"
  | "contact_phone"
  | "contact_address";

export const ShopContentService = {
  async getBySection(section: string): Promise<Record<string, string>> {
    await dbConnect();
    const content = await ShopContent.find({ section }).lean();
    
    return content.reduce((acc: Record<string, string>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);
  },

  async getAll(): Promise<Record<string, string>> {
    await dbConnect();
    const content = await ShopContent.find({}).lean();
    
    return content.reduce((acc: Record<string, string>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);
  },

  async update(key: string, value: string, section: string): Promise<any> {
    await dbConnect();
    return ShopContent.findOneAndUpdate(
      { key },
      { value, section },
      { upsert: true, returnDocument: "after" }
    );
  },

  async updateMany(items: { key: string; value: string; section: string }[]) {
    await dbConnect();
    const bulkOps = items.map((item) => ({
      updateOne: {
        filter: { key: item.key },
        update: { value: item.value, section: item.section },
        upsert: true,
      },
    }));
    return ShopContent.bulkWrite(bulkOps);
  }
};
