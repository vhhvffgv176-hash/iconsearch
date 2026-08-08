import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const extensionRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(extensionRoot, "..");
const sharedPublicRoot = resolve(repositoryRoot, "public");
const marketplaceRoot = resolve(extensionRoot, "marketplace");
const extensionPublicRoot = resolve(extensionRoot, "public");

await Promise.all([
  mkdir(marketplaceRoot, { recursive: true }),
  mkdir(extensionPublicRoot, { recursive: true }),
]);

// Every Webflow surface uses the same approved IconSearch “IS” logomark.
// The shared files are the canonical masters used by the website and other apps.
await Promise.all([
  copyFile(
    resolve(sharedPublicRoot, "iconsearch-logo-128.png"),
    resolve(extensionPublicRoot, "iconsearch-logo.png")
  ),
  copyFile(
    resolve(sharedPublicRoot, "iconsearch-logomark-512.png"),
    resolve(marketplaceRoot, "icon-512.png")
  ),
  copyFile(
    resolve(sharedPublicRoot, "iconsearch-logomark-900.png"),
    resolve(marketplaceRoot, "icon-900.png")
  ),
]);

console.log("Synced canonical IconSearch branding for Webflow.");
