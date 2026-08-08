import libraryCatalog from "../../data/all-libraries.json";
import type { LibraryOption } from "./types";

export const FALLBACK_LIBRARY_OPTIONS: LibraryOption[] = libraryCatalog
  .map(({ id, name }) => ({ id, name }))
  .sort((left, right) => left.name.localeCompare(right.name));
