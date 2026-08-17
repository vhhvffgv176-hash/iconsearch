export type RecentItem = {
  label: string;
  href: string;
  date: string; // ISO date format YYYY-MM-DD
};

export const staticPages: RecentItem[] = [
  {
    label: "Free SVG Logo Maker & App Icon Generator",
    href: "/logo-maker",
    date: "2026-08-17"
  },
  {
    label: "IconSearch Framer Plugin",
    href: "/framer-plugin",
    date: "2026-06-28"
  },
  {
    label: "IconSearch Chrome Extension",
    href: "/chrome-extension",
    date: "2026-06-28"
  },
  {
    label: "IconSearch VS Code Extension",
    href: "/vscode-extension",
    date: "2026-06-28"
  },
  {
    label: "Icon Library License Guide — MIT, Apache, ISC Explained",
    href: "/licenses",
    date: "2026-05-20"
  },
  {
    label: "Interactive Icon Stats & Size Comparisons",
    href: "/stats",
    date: "2026-05-18"
  }
];
