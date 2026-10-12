export const APP_NAME = "PeopleBook";
export const ADMIN_ROLE = "admin"; // value of app_metadata.role for administrators
export const APP_TAGLINE = "Simple. Secure. Organized.";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/people", label: "People", icon: "Users" },
  { href: "/records", label: "Records", icon: "FileText" },
  { href: "/payments", label: "Payments", icon: "IndianRupee" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/messages", label: "Messages", icon: "MessageSquare" },
] as const;

export const PROTECTED_PREFIXES = [
  "/dashboard", "/people", "/records", "/payments", "/reports", "/messages", "/settings",
];
