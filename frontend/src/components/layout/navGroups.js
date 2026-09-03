/**
 * Admin navigation map — consumed by Sidebar and CommandPalette.
 * Lives outside Sidebar.jsx because sharing non-component exports from a
 * component file breaks react-refresh fast refresh.
 */
import {
  HomeIcon,
  GridIcon,
  BagIcon,
  ImageIcon,
  ClipboardIcon,
  TagIcon,
  StarIcon,
  UsersIcon,
  HeartIcon,
  CartIcon,
} from "../common/Icon";

export const NAV_GROUPS = [
  {
    title: "Overview",
    links: [{ path: "/dashboard", label: "Dashboard", Icon: HomeIcon }],
  },
  {
    title: "Catalog",
    links: [
      { path: "/categories", label: "Categories", Icon: GridIcon },
      { path: "/products", label: "Products", Icon: BagIcon },
      { path: "/banners", label: "Banners", Icon: ImageIcon },
    ],
  },
  {
    title: "Sales",
    links: [
      {
        path: "/orders",
        label: "Orders",
        Icon: ClipboardIcon,
        badge: "openOrders",
      },
      { path: "/coupons", label: "Coupons", Icon: TagIcon },
      { path: "/reviews", label: "Reviews", Icon: StarIcon },
    ],
  },
  {
    title: "Customers",
    links: [
      { path: "/users", label: "Customers", Icon: UsersIcon },
      { path: "/wishlists", label: "Wishlists", Icon: HeartIcon },
      { path: "/carts", label: "Carts", Icon: CartIcon },
    ],
  },
];