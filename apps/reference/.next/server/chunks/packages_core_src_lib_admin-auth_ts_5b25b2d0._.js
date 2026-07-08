module.exports=[770321,r=>{"use strict";var e=r.i(483414);async function t(){let r=await (0,e.auth)();if(!r?.user||"ADMIN"!==r.user.role)throw Error("Unauthorized");return r}r.s(["requireAdmin",()=>t])}];

//# sourceMappingURL=packages_core_src_lib_admin-auth_ts_5b25b2d0._.js.map