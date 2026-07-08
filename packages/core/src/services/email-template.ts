import dbConnect from "@wse/core/lib/db";
import EmailTemplate from "@wse/core/models/EmailTemplate";

export type EmailTemplateSeed = {
  type: string;
  subject: string;
  body: string;
  description?: string;
  variables?: string[];
  tags?: string[];
  pluginId?: string | null;
};

export const EmailTemplateService = {
  async getAll() {
    await dbConnect();
    return EmailTemplate.find({}).sort({ type: 1 }).lean();
  },

  async getByType(type: string) {
    await dbConnect();
    return EmailTemplate.findOne({ type }).lean();
  },

  async update(type: string, data: any) {
    await dbConnect();
    return EmailTemplate.findOneAndUpdate(
      { type },
      { $set: data },
      { upsert: true, returnDocument: "after" }
    );
  },

  async createMissing(type: string, data: EmailTemplateSeed) {
    await dbConnect();
    return EmailTemplate.findOneAndUpdate(
      { type },
      { $setOnInsert: data },
      { upsert: true, returnDocument: "after" }
    );
  }
};
