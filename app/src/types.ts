export interface Brand {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  foundedYear: number | null;
  country: string | null;
  countryNameEn: string | null;
  wikipediaUrlEn: string | null;
  sortOrder: number;
}

export interface Collection {
  id: string;
  brandId: string;
  slug: string;
  name: string;
  nameEn: string | null;
  type: string | null;
  introducedYear: number | null;
  discontinuedYear: number | null;
  wikipediaUrlEn: string | null;
  variantOptions?: {
    materials: string[];
    caseSizesMm: number[];
    movementTypes: string[];
    braceletStrap: string[];
  };
  sortOrder: number;
}

export interface Era {
  id: string;
  collectionId: string;
  slug: string;
  name: string;
  nameEn: string | null;
  startYear: number;
  endYear: number | null;
  summary: string | null;
  keyFacts: string[];
  events: { year: number; label: string }[];
  sortOrder: number;
}

/** 進化点の刻み（Release）。Era の下の小分類。 */
export interface Milestone {
  id: string;
  collectionId: string;
  eraId: string | null;
  yearFrom: number;
  yearTo: number | null;
  label: string;
  whyItMatters: string;
  /** ヒーロー用サブライン（時代ラベルではなく Wikipedia/一般情報の一行）。whyItMatters と重複しない。 */
  heroSubline?: string | null;
  delta: {
    added: string[];
    changed: string[];
    removed: string[];
  };
  howToSpot: string[];
  industryContext: string[];
  specSnapshot?: {
    movementType?: string;
    caliber?: string | null;
    caseSizeMmRange?: [number, number] | null;
    waterResistanceM?: number | null;
    materials?: string[];
    bezels?: string[];
    bracelets?: string[];
    dialTags?: string[];
  } | null;
  variantMap?: {
    materials?: string[];
    bezels?: string[];
    dials?: string[];
    bracelets?: string[];
    sizes?: number[];
  } | null;
  sources?: { type: "wikidata" | "wikipedia_en" | "other"; url: string; accessedAt: string; note?: string }[];
}

/** Milestone のさらに細かい刻み（年単位のロット・小変更）。 */
export interface Release {
  id: string;
  milestoneId: string;
  yearFrom: number;
  yearTo: number | null;
  label: string;
  whyItMatters: string | null;
  /** ヒーロー用サブライン（時代ラベルではなく Wikipedia/一般情報の一行）。whyItMatters と重複しない。 */
  heroSubline?: string | null;
  delta: { added: string[]; changed: string[]; removed: string[] } | null;
  sortOrder: number;
  /** 時計史全体の動き（このリリースの表示年に沿った内容。enrich で付与） */
  industryContext?: string[];
}

/** リリース内の型番グループ（同年に並ぶ兄弟モデル）。variantMap は RefGroup にぶら下げる。 */
export interface RefGroup {
  id: string;
  releaseId: string;
  refCode: string;
  label: string;
  /** このRefの特徴（1行）。未設定なら表示しない */
  tagline?: string | null;
  sortOrder: number;
  variantMap?: {
    materials?: string[];
    bezels?: string[];
    dials?: string[];
    bracelets?: string[];
    sizes?: number[];
  } | null;
}

export interface Variant {
  id: string;
  eraId: string;
  slug: string;
  name: string;
  nameEn: string | null;
  sortOrder: number;
  movementType?: string | null;
  caliber?: string | null;
  caseSizeMm?: number | null;
  caseMaterial?: string | null;
  waterResistanceM?: number | null;
  crystal?: string | null;
  bezel?: string | null;
  braceletStrap?: string[] | null;
  dialColor?: string | null;
  keyFacts?: string[];
}

export interface UserOwnedWatch {
  id: string;
  userId: string;
  collectionId: string;
  eraId: string | null;
  variantId: string | null;
  milestoneId?: string | null;
  variantMeta?: Record<string, string[] | number[] | undefined> | null;
  customName: string | null;
  acquiredYear: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeedData {
  version: string;
  brands: Brand[];
  collections: Collection[];
  eras: Era[];
  milestones?: Milestone[];
  releases?: Release[];
  refGroups?: RefGroup[];
  variants: Variant[];
  userOwnedWatches?: UserOwnedWatch[];
}
