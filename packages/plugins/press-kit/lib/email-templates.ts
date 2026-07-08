import type { EmailTemplateSeed } from "@wse/core/services/email-template"

export function buildPressKitEmailTemplateSeeds(brandName: string): EmailTemplateSeed[] {
  return [
    {
      type: "press_kit_invite",
      pluginId: "press-kit",
      tags: ["press-kit", "transactional", "invite"],
      subject: `${brandName} — sajtóanyagok hozzáférés`,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="text-transform:uppercase;">Sajtóanyagok</h1>
          <p>Kedves {{name}},</p>
          <p>Örömmel osztjuk meg veled a {{outlet}} számára elérhető sajtóanyagokat és a digitális előnézetet.</p>
          <div style="background:#f4f4f4;padding:15px;margin:20px 0;">
            <p><strong>Belépési link:</strong> <a href="{{portalUrl}}">{{portalUrl}}</a></p>
            {{#if password}}
            <p><strong>Jelszó:</strong> {{password}}</p>
            {{/if}}
            <p>{{accessInstructions}}</p>
          </div>
          <p style="font-size:12px;color:#666;">{{analyticsNotice}}</p>
          <p style="font-size:12px;color:#666;">Ez egy személyes meghívó — kérjük, ne oszd meg másokkal.</p>
        </div>
      `,
      description: "Press-kit plugin — egyedi sajtós meghívó linkkel és jelszóval.",
      variables: [
        "name",
        "outlet",
        "portalUrl",
        "password",
        "accessInstructions",
        "analyticsNotice",
      ],
    },
  ]
}
