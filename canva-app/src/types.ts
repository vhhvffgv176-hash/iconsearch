export type IconSearchIcon = {
  id: string;
  name: string;
  displayName: string;
  library: string;
  libraryName: string;
  license?: string;
  legalSafe: boolean;
  svgUrl: string;
  previewUrls: string[];
  tags: string[];
};

export type SearchResult = {
  icons: IconSearchIcon[];
  total: number;
  iconifySets?: string[];
};

export type AccountAccess = {
  email: string;
  product: string;
  tier: string;
  status: string;
  founderNumber?: number;
  expiresAt?: string;
};
