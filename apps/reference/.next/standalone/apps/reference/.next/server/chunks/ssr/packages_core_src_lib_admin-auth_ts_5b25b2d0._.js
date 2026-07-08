module.exports=[770321,a=>{"use strict";var b=a.i(483414);async function c(){let a=await (0,b.auth)();if(!a?.user||"ADMIN"!==a.user.role)throw Error("Unauthorized");return a}a.s(["requireAdmin",()=>c])}];

//# sourceMappingURL=packages_core_src_lib_admin-auth_ts_5b25b2d0._.js.map