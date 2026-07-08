export const GLS_FIXED_SHIPPING_METHOD_ID = "gls_fixed";
export const GLS_WIDGET_SCRIPT_ID = "gls-dpm-widget-script";
export const GLS_WIDGET_SCRIPT_URL = "https://map.gls-hungary.com/widget/gls-dpm.js";

export type GlsParcelPoint = {
  id: string;
  name: string;
  contact?: {
    countryCode?: string;
    postalCode?: string;
    city?: string;
    address?: string;
    name?: string;
    email?: string;
  };
};
