import mongoose, { Document, Model, Schema } from "mongoose"

export interface IThemeSetting extends Document {
  key: string
  colors: Record<string, string>
  /**
   * When true, `colors` is merged on top of the active template baseline.
   * Saves from the theme editor store all tokens so the full palette applies.
   * Omit/false: legacy full snapshot.
   */
  overridesOnly?: boolean
}

const ThemeSettingSchema = new Schema<IThemeSetting>(
  {
    key: { type: String, required: true, unique: true, default: "theme" },
    colors: { type: Schema.Types.Mixed, required: true, default: {} },
    overridesOnly: { type: Boolean },
  },
  { timestamps: true }
)

const ThemeSetting: Model<IThemeSetting> =
  mongoose.models.ThemeSetting || mongoose.model<IThemeSetting>("ThemeSetting", ThemeSettingSchema)

export default ThemeSetting
