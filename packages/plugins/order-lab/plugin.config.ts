import { definePlugin } from "@wse/sdk/plugins/types";
import type { PluginApiContext } from "@wse/sdk/plugins/types";
import { OrderLabAdminScreen } from "./admin/OrderLabAdminScreen";

export const orderLab = definePlugin({
  manifest: {
    id: "order-lab",
    name: "Order Lab",
    version: "1.0.0",
    description:
      "Foxpost sandbox rendeléskezelés külön gyűjteményben — seed, csomag/címke teszt, kapcsolat ellenőrzés.",
    requiresShop: true,
    featureFlagKey: "pluginOrderLab",
  },
  admin: {
    navItems: [
      { label: "Áttekintés", segment: "" },
      { label: "Sandbox rendelések", segment: "orders" },
      { label: "Beállítások", segment: "settings" },
    ],
    Screen: OrderLabAdminScreen,
  },
  api: {
    handle: (context: PluginApiContext) =>
      import("./api/handlers").then((m) => m.handleOrderLabApi(context)),
  },
});
