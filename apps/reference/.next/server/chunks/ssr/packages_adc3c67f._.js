module.exports=[62656,a=>{"use strict";a.s(["PressKitAdminScreen",()=>b]);let b=(0,a.i(211857).registerClientReference)(function(){throw Error("Attempted to call PressKitAdminScreen() from the server but PressKitAdminScreen is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/packages/plugins/press-kit/admin/PressKitAdminScreen.tsx <module evaluation>","PressKitAdminScreen")},313210,a=>{"use strict";a.s(["PressKitAdminScreen",()=>b]);let b=(0,a.i(211857).registerClientReference)(function(){throw Error("Attempted to call PressKitAdminScreen() from the server but PressKitAdminScreen is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/packages/plugins/press-kit/admin/PressKitAdminScreen.tsx","PressKitAdminScreen")},355583,a=>{"use strict";a.i(62656);var b=a.i(313210);a.n(b)},105098,a=>{"use strict";var b=a.i(765404),c=a.i(355583);let d=(0,b.definePlugin)({manifest:{id:"press-kit",name:"Sajtóanyagok",version:"1.0.0",description:"Jelszóval védett sajtóportál, CMS szövegek, digitális képregény előnézet, meghívók és megnyitás-statisztika.",requiresShop:!0,featureFlagKey:"pluginPressKit"},getEmailTemplates:async()=>{var b;let{BrandingSettingsService:c}=await a.A(408276);return b=(await c.get()).brandName,[{type:"press_kit_invite",pluginId:"press-kit",tags:["press-kit","transactional","invite"],subject:`${b} — sajt\xf3anyagok hozz\xe1f\xe9r\xe9s`,body:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h1 style="text-transform:uppercase;">Sajt\xf3anyagok</h1>
          <p>Kedves {{name}},</p>
          <p>\xd6r\xf6mmel osztjuk meg veled a {{outlet}} sz\xe1m\xe1ra el\xe9rhető sajt\xf3anyagokat \xe9s a digit\xe1lis előn\xe9zetet.</p>
          <div style="background:#f4f4f4;padding:15px;margin:20px 0;">
            <p><strong>Bel\xe9p\xe9si link:</strong> <a href="{{portalUrl}}">{{portalUrl}}</a></p>
            {{#if password}}
            <p><strong>Jelsz\xf3:</strong> {{password}}</p>
            {{/if}}
            <p>{{accessInstructions}}</p>
          </div>
          <p style="font-size:12px;color:#666;">{{analyticsNotice}}</p>
          <p style="font-size:12px;color:#666;">Ez egy szem\xe9lyes megh\xedv\xf3 — k\xe9rj\xfck, ne oszd meg m\xe1sokkal.</p>
        </div>
      `,description:"Press-kit plugin — egyedi sajtós meghívó linkkel és jelszóval.",variables:["name","outlet","portalUrl","password","accessInstructions","analyticsNotice"]}]},admin:{statsSegment:"stats",navItems:[{label:"Áttekintés",segment:""},{label:"Kapcsolatok",segment:"contacts"},{label:"Oldal szerkesztése",segment:"content"},{label:"Megnyitások",segment:"stats"}],Screen:c.PressKitAdminScreen},api:{handle:b=>a.A(286566).then(a=>a.handlePressKitApi(b))}});a.s(["pressKit",0,d],105098)},408276,a=>{a.v(a=>Promise.resolve().then(()=>a(53930)))},286566,a=>{a.v(b=>Promise.all(["server/chunks/ssr/[root-of-the-server]__8e3c4043._.js","server/chunks/ssr/packages_plugins_press-kit_api_handlers_ts_cb2d8957._.js"].map(b=>a.l(b))).then(()=>b(128217)))}];

//# sourceMappingURL=packages_adc3c67f._.js.map