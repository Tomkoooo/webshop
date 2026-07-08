module.exports=[261636,a=>{"use strict";var b=a.i(137936),c=a.i(53112),d=a.i(746272),e=a.i(964955),f=a.i(602693),g=a.i(846944),h=a.i(886397),i=a.i(713095);let j=c.z.object({name:c.z.string().min(2),email:c.z.string().email(),message:c.z.string().min(10),recipientId:c.z.string().optional()});async function k(a,b){let c,i=j.safeParse({name:b.get("name"),email:b.get("email"),message:b.get("message"),recipientId:b.get("recipientId")||void 0});if(!i.success)return{ok:!1,message:"Kérjük ellenőrizze a megadott adatokat."};let k=await g.ContactEmailsService.list();if(0===k.length)return{ok:!1,message:"A kapcsolatfelvétel jelenleg nem elérhető."};let m=(0,d.findContactEmailById)(k,i.data.recipientId);if(!m)return{ok:!1,message:"Érvénytelen címzett."};let{name:n,email:o,message:p}=i.data;try{c=await h.ContactMessageService.create({name:n,email:o,message:p,recipientId:m.id,recipientLabel:m.label,recipientEmail:m.email})}catch(a){return console.error("Failed to persist contact form message:",a),{ok:!1,message:"Az üzenet mentése sikertelen. Kérjük próbálja újra később."}}try{return await f.MailerService.sendEmail({to:m.email,templateType:"contact_form_notification",data:{name:n,email:o,message:p,messageHtml:p.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\n/g,"<br />"),recipientLabel:m.label,recipientEmail:m.email,contactMessageId:c._id},logContext:{flow:"contact_form",recipientId:m.id,contactMessageId:c._id}}),await l(c._id,"sent"),{ok:!0,message:"Üzenet elküldve. Hamarosan válaszolunk."}}catch(a){var q;return await l(c._id,"failed",(q=a,JSON.stringify((0,e.serializeMailerError)(q)).slice(0,2e3))),{ok:!0,message:"Üzenetét rögzítettük. Hamarosan válaszolunk."}}}async function l(a,b,c){try{await h.ContactMessageService.updateNotificationStatus(a,b,c)}catch(a){console.error("Failed to update contact message notification status:",a)}}(0,i.ensureServerEntryExports)([k]),(0,b.registerServerReference)(k,"60ee6e96d7bc9694d573712569c899344f109c4a29",null),a.s(["submitContactForm",()=>k])},192306,a=>{"use strict";var b=a.i(137936),c=a.i(118558),d=a.i(564328),e=a.i(483414),f=a.i(861805),g=a.i(529555),h=a.i(221402),i=a.i(511566),j=a.i(635388);async function k(){let a=await (0,e.auth)();if(!a||a.user?.role!=="ADMIN")throw Error("Unauthorized")}async function l(b,e){if(await k(),await (0,f.default)(),!await i.PluginService.isEnabled("order-lab"))throw Error("Az order-lab plugin nincs engedélyezve.");if(!await (0,h.isFoxpostParcelManagerEnabled)())throw Error("A Foxpost csomagkezelő ki van kapcsolva.");let{OrderLabSettingsService:l}=await a.A(890596);try{await l.getFoxpostConfig()}catch(a){throw Error(a instanceof Error?a.message:"Foxpost sandbox kapcsolat nincs beállítva.")}let m=e?.skipExisting!==!1,n=Array.from(new Set(b.map(a=>String(a||"").trim()).filter(a=>d.default.Types.ObjectId.isValid(a))));if(0===n.length)throw Error("Nincs érvényes sandbox rendelés kijelölve.");let{default:o}=await a.A(176307),p=await o.find({_id:{$in:n}}),q=new Map(p.map(a=>[a._id.toString(),a])),r=0,s=0,t=0,u=[],v=[];for(let a of n){let b=q.get(a);if(!b){s+=1,v.push({orderId:a,reason:"not_found"});continue}if(!b.foxpostParcelPoint?.id){s+=1,v.push({orderId:a,reason:"no_foxpost_apm"});continue}if(m&&!(0,j.orderNeedsParcelLabel)(b)){s+=1,v.push({orderId:a,reason:"label_exists"});continue}let d=await (0,g.generateFoxpostShipment)({source:"sandbox",id:a});d.success?(r+=1,(0,c.revalidatePath)(`/admin/plugins/order-lab/orders/${a}`)):(t+=1,u.push({orderId:a,error:d.error||"Ismeretlen hiba"}))}return(0,c.revalidatePath)("/admin/plugins/order-lab/orders"),(0,c.revalidatePath)("/admin/plugins/order-lab"),{success:!0,successCount:r,skippedCount:s,failedCount:t,failures:u,skips:v,missingCount:n.length-p.length}}(0,a.i(713095).ensureServerEntryExports)([l]),(0,b.registerServerReference)(l,"60b35cef333347c9121f30187bb816cbb9099b99de",null),a.s(["bulkGenerateSandboxParcelLabels",()=>l])},770321,a=>{"use strict";var b=a.i(483414);async function c(){let a=await (0,b.auth)();if(!a?.user||"ADMIN"!==a.user.role)throw Error("Unauthorized");return a}a.s(["requireAdmin",()=>c])},106843,a=>{"use strict";var b=a.i(800717),c=a.i(746272),d=a.i(361132),e=a.i(560701);function f(a,b){let e=(0,c.parseContactEmailsFromShopContent)(a),f=(0,c.primaryContactEmail)(e);return{emails:e,primaryEmail:f,emailsDisplay:e.length>0?(0,c.formatContactEmailsForDisplay)(e):"",phone:(0,d.resolveContactDisplayField)(b?.phone,a.contact_phone),address:(0,d.resolveContactDisplayField)(b?.address,a.contact_address)}}let g=(0,b.cache)(async function(a){return f(await e.ShopContentService.getAll(),a)});a.s(["getStorefrontSiteContact",0,g,"resolveSiteContactChannels",()=>f])},195288,a=>{"use strict";var b=a.i(861805),c=a.i(112703);a.s(["EmailTemplateService",0,{getAll:async()=>(await (0,b.default)(),c.default.find({}).sort({type:1}).lean()),getByType:async a=>(await (0,b.default)(),c.default.findOne({type:a}).lean()),update:async(a,d)=>(await (0,b.default)(),c.default.findOneAndUpdate({type:a},{$set:d},{upsert:!0,returnDocument:"after"})),createMissing:async(a,d)=>(await (0,b.default)(),c.default.findOneAndUpdate({type:a},{$setOnInsert:d},{upsert:!0,returnDocument:"after"}))}])},147650,a=>{"use strict";var b=a.i(53930),c=a.i(571948),d=a.i(106843),e=a.i(350662),f=a.i(919007),g=a.i(511566),h=a.i(49993);function i(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}async function j(){let[a,f,g]=await Promise.all([b.BrandingSettingsService.get(),c.ThemeService.get(),(0,d.getStorefrontSiteContact)()]),j=i(a.brandName),k=f.primaryForeground,l=f.secondary,m=f.secondaryForeground,n=f.background,o=f.foreground,p=f.mutedForeground,q=f.border,r=`${(0,h.getPublicAppBaseUrl)()}/#contact`,s=i((0,e.getEmailFromAddress)()),t=g.emails.length?g.emails.map(a=>`${i(a.label)}: ${i(a.email)}`).join(" · "):"a weboldalon található kapcsolatfelvételi űrlapon",u=`
          <hr style="border:0;border-top:1px solid ${q};margin:30px 0;" />
          <p style="font-size:12px;line-height:1.6;color:${p};">
            Ez egy automatikus, no-reply \xfczenet a(z) ${s} c\xedmről. K\xe9rj\xfck, ne v\xe1laszolj erre az e-mailre.
            Kapcsolatfelv\xe9telhez \xedrj a weboldalon kereszt\xfcl: <a href="${r}" style="color:${k};font-weight:bold;">Kapcsolat</a>,
            vagy haszn\xe1ld az al\xe1bbi el\xe9rhetős\xe9geket: ${t}.
          </p>
          <p style="font-size:12px;color:${p};">${j}</p>
  `;return[{type:"order_confirmation",pluginId:null,tags:["core","shop","order"],subject:`${a.brandName} rendel\xe9s visszaigazol\xe1sa - #{{orderNumber}}`,body:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${n};color:${o};">
          <h1 style="color:${k};text-transform:uppercase;">K\xf6sz\xf6nj\xfck a rendel\xe9sed!</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${j} \xf6r\xf6mmel \xe9rtes\xedt, hogy megkaptuk a rendel\xe9sed (#{{orderNumber}}).</p>
          <div style="background:${l};color:${m};padding:15px;margin:20px 0;border:1px solid ${q};">
            <h3 style="margin-top: 0;">Rendel\xe9s \xf6sszefoglal\xf3:</h3>
            <p>V\xe9g\xf6sszeg: <strong>{{totalAmount}} Ft</strong></p>
            <p>Sz\xe1ll\xedt\xe1si c\xedm: {{shippingAddress}}</p>
          </div>
          <p>Amint csomagja \xfatra kel, \xfajabb \xe9rtes\xedt\xe9st k\xfcld\xfcnk.</p>
          {{#if orderViewUrl}}
          <p style="margin: 28px 0 12px;">
            <a href="{{orderViewUrl}}" style="display:inline-block;background:${l};color:${m};padding:12px 18px;text-decoration:none;font-weight:bold;">Rendel\xe9s megtekint\xe9se</a>
          </p>
          {{/if}}
          ${u}
        </div>
      `,description:"Webshop rendelés — vásárló kapja meg sikeres kosár/checkout után. Nem használja a tábor foglalás plugin.",variables:["orderNumber","customerName","totalAmount","items","shippingAddress","orderViewUrl","linkToAccountUrl","isGuestOrder"]},{type:"order_status_change",pluginId:null,tags:["core","shop","order"],subject:`${a.brandName} rendel\xe9s \xe1llapot\xe1nak v\xe1ltoz\xe1sa - #{{orderNumber}}`,body:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${n};color:${o};">
          <h1 style="color:${k};text-transform:uppercase;">Friss\xedt\xe9s a rendel\xe9sedről</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${j} \xe9rtes\xedt, hogy a #{{orderNumber}} sz\xe1m\xfa rendel\xe9sed \xe1llapota megv\xe1ltozott.</p>
          <div style="background:${l};color:${m};padding:15px;margin:20px 0;text-align:center;border:1px solid ${q};">
            <p style="margin:0;font-size:14px;">R\xe9gi: {{oldStatus}}</p>
            <p style="margin:10px 0;font-size:24px;font-weight:bold;color:${k};">\xdaj: {{newStatus}}</p>
          </div>
          ${u}
        </div>
      `,description:"Webshop rendelés állapotváltozás — nem tábor foglalás.",variables:["orderNumber","customerName","oldStatus","newStatus"]},{type:"order_cancelled",pluginId:null,tags:["core","shop","order"],subject:`${a.brandName} rendel\xe9s t\xf6r\xf6lve - #{{orderNumber}}`,body:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${n};color:${o};">
          <h1 style="color:${k};text-transform:uppercase;">Rendel\xe9s t\xf6r\xf6lve</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${j} \xe9rtes\xedt, hogy a #{{orderNumber}} sz\xe1m\xfa rendel\xe9sed t\xf6r\xf6lve lett.</p>
          <div style="background:${l};color:${m};padding:15px;margin:20px 0;text-align:center;border:1px solid ${q};">
            <p style="margin:0;font-size:14px;">R\xe9gi \xe1llapot: {{oldStatus}}</p>
            <p style="margin:10px 0;font-size:24px;font-weight:bold;color:${k};">\xdaj \xe1llapot: {{newStatus}}</p>
          </div>
          {{#if cancellationReason}}
          <div style="background:${n};padding:15px;margin:20px 0;border:1px solid ${q};">
            <p style="margin:0 0 8px;font-size:12px;font-weight:bold;text-transform:uppercase;color:${p};">Indokl\xe1s</p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.6;">{{cancellationReason}}</p>
          </div>
          {{/if}}
          {{#if reversalInvoiceId}}
          <p>A sztorn\xf3 sz\xe1mla azonos\xedt\xf3ja: <strong>{{reversalInvoiceId}}</strong>. A PDF csatolm\xe1nyk\xe9nt is megkapod.</p>
          {{/if}}
          <p>Ha k\xe1rty\xe1s fizet\xe9ssel rendelt\xe9l, a visszat\xe9r\xedt\xe9s a bankod szab\xe1lyai szerint jelenik meg.</p>
          ${u}
        </div>
      `,description:"Admin rendelés törlés — a vásárló kapja meg az állapotváltozás mellett (opcionális indoklással). Pár: order_status_change.",variables:["orderNumber","customerName","oldStatus","newStatus","cancellationReason","reversalInvoiceId"]},{type:"invoice_sent",pluginId:null,tags:["core","shop","invoicing","szamlazz"],subject:`${a.brandName} sz\xe1mla elk\xe9sz\xfclt - #{{orderNumber}} / {{invoiceId}}`,body:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${n};color:${o};">
          <h1 style="color:${k};text-transform:uppercase;">Sz\xe1mla elk\xe9sz\xfclt</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${j} #{{orderNumber}} rendel\xe9s\xe9hez tartoz\xf3 sz\xe1mla elk\xe9sz\xfclt (Sz\xe1ml\xe1zz.hu).</p>
          <p>Sz\xe1mla azonos\xedt\xf3: <strong>{{invoiceId}}</strong></p>
          <p>{{invoiceMessage}}</p>
          ${u}
        </div>
      `,description:"Sikeres Számlázz.hu számla — PDF csatolmánnyal. Pár: invoice_issue (hiba / kézi beavatkozás esetén).",variables:["orderNumber","customerName","invoiceId","invoiceMessage"]},{type:"invoice_issue",pluginId:null,tags:["core","shop","invoicing","szamlazz","szamlazz-failure"],subject:`${a.brandName} sz\xe1ml\xe1z\xe1si \xe9rtes\xedt\xe9s - #{{orderNumber}}`,body:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${n};color:${o};">
          <h1 style="color:${k};text-transform:uppercase;">Sz\xe1ml\xe1z\xe1si \xe9rtes\xedt\xe9s</h1>
          <p>Kedves {{customerName}},</p>
          <p>A(z) ${j} #{{orderNumber}} rendel\xe9s\xe9nek sz\xe1ml\xe1z\xe1sa manu\xe1lis ellenőrz\xe9st ig\xe9nyel.</p>
          <p>{{invoiceMessage}}</p>
          ${u}
        </div>
      `,description:"Ha a Számlázz.hu kiállítás vagy küldés sikertelen — értesíti a vásárlót. Pár: invoice_sent (sikeres számla).",variables:["orderNumber","customerName","invoiceMessage"]},{type:"contact_form_notification",pluginId:null,tags:["core","contact"],subject:`${a.brandName} kapcsolatfelv\xe9tel - {{name}}`,body:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${n};color:${o};">
          <h1 style="color:${k};text-transform:uppercase;">\xdaj kapcsolatfelv\xe9teli \xfczenet</h1>
          <div style="background:${l};color:${m};padding:15px;margin:20px 0;border:1px solid ${q};">
            <p><strong>N\xe9v:</strong> {{name}}</p>
            <p><strong>Felad\xf3 e-mail:</strong> {{email}}</p>
            <p><strong>C\xedmzett:</strong> {{recipientLabel}} &lt;{{recipientEmail}}&gt;</p>
            <p><strong>\xdczenet azonos\xedt\xf3:</strong> {{contactMessageId}}</p>
          </div>
          <p style="white-space:normal;">{{{messageHtml}}}</p>
          ${u}
        </div>
      `,description:"Belső értesítés a weboldali kapcsolat űrlapról (minden sablon).",variables:["name","email","message","messageHtml","recipientLabel","recipientEmail","contactMessageId"]},{type:"contact_reply",pluginId:null,tags:["core","contact"],subject:"{{subject}}",body:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;background:${n};color:${o};">
          <div style="line-height:1.6;">{{{bodyHtml}}}</div>
          <hr style="border:0;border-top:1px solid ${q};margin:28px 0;" />
          <p style="font-size:13px;color:${p};"><strong>{{originalName}}</strong> &lt;{{originalEmail}}&gt;</p>
          <p style="font-size:13px;color:${p};">{{{originalMessageHtml}}}</p>
          ${u}
        </div>
      `,description:"Admin válasz a kapcsolatfelvételi üzenetre.",variables:["subject","bodyHtml","bodyText","originalName","originalEmail","originalMessage","originalMessageHtml","adminName","adminEmail"]}]}async function k(){let a=await g.PluginService.listEnabled(),b=[];for(let c of a){let a=await (0,f.loadPluginModule)(c.id),d=[...a.emailTemplates??[],...a.getEmailTemplates?await a.getEmailTemplates():[]];if(d.length)for(let a of d)b.push({...a,pluginId:a.pluginId??c.id,tags:a.tags?.length?a.tags:[c.id]})}return b}async function l(){let[a,b]=await Promise.all([j(),k()]);return[...a,...b]}a.s(["EMAIL_TEMPLATE_TYPE_LABELS",0,{order_confirmation:"Rendelés visszaigazolása (webshop)",order_status_change:"Rendelés állapot (webshop)",order_cancelled:"Rendelés törlése (webshop — admin)",invoice_sent:"Számla elküldve (Számlázz — siker)",invoice_issue:"Számlázási probléma (Számlázz — hiba pár)",contact_form_notification:"Kapcsolatfelvétel (belső)",contact_reply:"Kapcsolat válasz",camp_registration_confirmation:"Tábor — visszaigazolás (vásárló)"},"buildAllEmailTemplateSeeds",()=>l,"buildCoreEmailTemplateSeeds",()=>j])},340849,a=>{"use strict";var b=a.i(137936),c=a.i(118558),d=a.i(195288),e=a.i(147650),f=a.i(770321);async function g(a,b){await (0,f.requireAdmin)();let e=b.get("subject"),g=b.get("body");if(!e||!g)throw Error("Tárgy és tartalom megadása kötelező");await d.EmailTemplateService.update(a,{subject:e,body:g}),(0,c.revalidatePath)("/admin/emails"),(0,c.revalidatePath)(`/admin/emails/${a}`)}async function h(){for(let a of(await (0,f.requireAdmin)(),await (0,e.buildAllEmailTemplateSeeds)()))await d.EmailTemplateService.update(a.type,a);(0,c.revalidatePath)("/admin/emails")}async function i(){for(let a of(await (0,f.requireAdmin)(),await (0,e.buildAllEmailTemplateSeeds)()))await d.EmailTemplateService.createMissing(a.type,a);(0,c.revalidatePath)("/admin/emails")}(0,a.i(713095).ensureServerEntryExports)([g,h,i]),(0,b.registerServerReference)(g,"606026a7bc82034f75ea1695301dfb36ec9259ddef",null),(0,b.registerServerReference)(h,"005ae79831437f813f54b92822390deb2ad1230310",null),(0,b.registerServerReference)(i,"009f61f6678282d71139345cff80bda9d5f8452a16",null),a.s(["initializeMissingEmailTemplates",()=>i,"seedEmailTemplates",()=>h,"updateEmailTemplate",()=>g])},933677,a=>{"use strict";var b=a.i(261636),c=a.i(192306),d=a.i(529555),e=a.i(340849);a.s([],57404),a.i(57404),a.s(["005ae79831437f813f54b92822390deb2ad1230310",()=>e.seedEmailTemplates,"009f61f6678282d71139345cff80bda9d5f8452a16",()=>e.initializeMissingEmailTemplates,"401076289e494b408e2be141b60cae3329cae27bbf",()=>d.refreshFoxpostTracking,"402faca63fe4467ee3ffcbfa2afe143aa300a560d4",()=>d.deleteFoxpostParcel,"4064e7c825b0d209fedc73b2961fc7d3da6da52b0d",()=>d.updateFoxpostParcel,"4096f25806c1df4cfc0bb322e411fc4b1ec062c63c",()=>d.updateFoxpostParcelPointOnOrder,"40b1231083de5bed06644ccc406fa8293ad93fcf56",()=>d.downloadFoxpostDeliveryNote,"40b7f4608a545d7045dc770f8c27f1d2fc141650c5",()=>d.generateFoxpostShipment,"40c210de5be9e0469e5c8ff7036ec435b5370c7cf4",()=>d.fetchFoxpostLabelInfo,"40cc49f11a03af16cec83660518b5e322e9db15e88",()=>d.clearFoxpostShipmentError,"40cd211a06cdde4976da4b572d77958fdf43c6c4f7",()=>d.createFoxpostReturn,"606026a7bc82034f75ea1695301dfb36ec9259ddef",()=>e.updateEmailTemplate,"60b35cef333347c9121f30187bb816cbb9099b99de",()=>c.bulkGenerateSandboxParcelLabels,"60ee6e96d7bc9694d573712569c899344f109c4a29",()=>b.submitContactForm],933677)},176307,a=>{a.v(b=>Promise.all(["server/chunks/ssr/packages_plugins_order-lab_models_SandboxOrder_ts_a987e976._.js"].map(b=>a.l(b))).then(()=>b(671916)))},890596,a=>{a.v(b=>Promise.all(["server/chunks/ssr/packages_plugins_order-lab_services_order-lab-settings-service_ts_89ea273c._.js"].map(b=>a.l(b))).then(()=>b(66872)))},817531,a=>{a.v(a=>Promise.resolve().then(()=>a(33823)))},906818,a=>{a.v(b=>Promise.all(["server/chunks/ssr/packages_core_src_lib_foxpost-apm-catalog_ts_30c8d928._.js"].map(b=>a.l(b))).then(()=>b(661134)))}];

//# sourceMappingURL=_704ad2dd._.js.map