import type { NextConfig } from "next";
import allLibrariesData from "./data/all-libraries.json";

type LibraryRoute = {
  id: string;
  slug: string;
};

const libraryAliasRedirects = (allLibrariesData as LibraryRoute[])
  .filter((library) => library.id !== library.slug)
  .map((library) => ({
    source: `/icons/${library.id}`,
    destination: `/icons/${library.slug}`,
    permanent: true,
  }));

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/icons/icon-sitemap-index.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/icons/sitemap-index.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/icons/sitemap.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/icons/icon-sitemap-:id(\\d+)\\.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/icons/icon-sitemaps/:page",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/icon-sitemaps/:page",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/icons/page-sitemaps/sitemap/:id",
        destination: "/sitemap.xml",
        permanent: true,
      },
      ...libraryAliasRedirects,
      {
        source: "/icons/react-icons",
        destination: "/react-icons",
        permanent: true,
      },
      {
        source: "/icons/material-icons",
        destination: "/icons/material-symbols",
        permanent: true,
      },
      {
        source: "/icons/font-awesome",
        destination: "/icons/fa7-solid",
        permanent: true,
      },
      {
        source: "/blog/lucide-icons-complete-guide-2026",
        destination: "/icons/lucide-icons",
        permanent: true,
      },
      {
        source: "/blog/how-to-use-svg-icons-in-react",
        destination: "/react-icons",
        permanent: true,
      },
      {
        source: "/blog/react-icons-vs-lucide-react-2026",
        destination: "/react-icons",
        permanent: true,
      },
      {
        source: "/blog/how-to-choose-right-icons-for-ui",
        destination: "/free-svg-icons",
        permanent: true,
      },
      {
        source: "/best-for-you",
        destination: "/free-svg-icons",
        permanent: true,
      },
      {
        source: "/blog/tailwind-css-v4-icons-complete-guide-2026",
        destination: "/tailwind-icons",
        permanent: true,
      },
      {
        source: "/blog/svg-icons-dark-mode-react-nextjs-2026",
        destination: "/tailwind-icons",
        permanent: true,
      },
      {
        source: "/use-cases/:slug*",
        destination: "/free-svg-icons",
        permanent: true,
      },
      {
        source: "/use-cases",
        destination: "/free-svg-icons",
        permanent: true,
      },
      {
        source: "/icons/category/:slug*",
        destination: "/free-svg-icons",
        permanent: true,
      },
      {
        source: "/icons/category",
        destination: "/free-svg-icons",
        permanent: true,
      },
      {
        source: "/icons/collection/:slug*",
        destination: "/free-svg-icons",
        permanent: true,
      },
      {
        source: "/icons/collection",
        destination: "/free-svg-icons",
        permanent: true,
      },
      {
        source: "/blog/icon-library-pricing-comparison-2026",
        destination: "/free-svg-icons",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/penpot/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Cache-Control", value: "public, max-age=300, must-revalidate" },
        ],
      },
      {
        source: "/penpot/index.html",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' https://iconsearch.info https://www.iconsearch.info https://cdn.iconsearch.info data:; connect-src https://iconsearch.info https://www.iconsearch.info; base-uri 'none'; object-src 'none'; form-action 'none'; frame-ancestors *",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
