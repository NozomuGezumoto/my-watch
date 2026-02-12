export const MY_WATCHES_KEY = "project-watch-mine";
export const WISHLIST_KEY = "project-watch-wishlist";

export interface MyWatchEntry {
  id: string;
  collectionId: string;
  eraId: string | null;
  variantId: string | null;
  milestoneId: string | null;
  refGroupId: string | null;
  variantMeta: Record<string, (string | number)[] | undefined> | null;
  customName: string | null;
  acquiredYear: number | null;
  addedAt: string;
}

function load(): MyWatchEntry[] {
  try {
    const s = localStorage.getItem(MY_WATCHES_KEY);
    const raw = s ? JSON.parse(s) : [];
    return Array.isArray(raw)
      ? raw.map((w: Partial<MyWatchEntry>) => ({
          id: w.id!,
          collectionId: w.collectionId!,
          eraId: w.eraId ?? null,
          variantId: w.variantId ?? null,
          milestoneId: w.milestoneId ?? null,
          refGroupId: w.refGroupId ?? null,
          variantMeta: w.variantMeta ?? null,
          customName: w.customName ?? null,
          acquiredYear: w.acquiredYear ?? null,
          addedAt: w.addedAt!,
        }))
      : [];
  } catch {
    return [];
  }
}

function save(items: MyWatchEntry[]) {
  localStorage.setItem(MY_WATCHES_KEY, JSON.stringify(items));
}

export function getMyWatches(): MyWatchEntry[] {
  return load();
}

export function addMyWatch(entry: {
  collectionId: string;
  eraId: string | null;
  variantId: string | null;
  milestoneId?: string | null;
  refGroupId?: string | null;
  variantMeta?: Record<string, (string | number)[] | undefined> | null;
  customName: string | null;
  acquiredYear: number | null;
}) {
  const items = load();
  const newOne: MyWatchEntry = {
    ...entry,
    milestoneId: entry.milestoneId ?? null,
    refGroupId: entry.refGroupId ?? null,
    variantMeta: entry.variantMeta ?? null,
    id: `mine-${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  items.push(newOne);
  save(items);
  return newOne;
}

export function removeMyWatch(id: string) {
  const items = load().filter((w) => w.id !== id);
  save(items);
}

function loadWishlist(): MyWatchEntry[] {
  try {
    const s = localStorage.getItem(WISHLIST_KEY);
    const raw = s ? JSON.parse(s) : [];
    return Array.isArray(raw)
      ? raw.map((w: Partial<MyWatchEntry>) => ({
          id: w.id!,
          collectionId: w.collectionId!,
          eraId: w.eraId ?? null,
          variantId: w.variantId ?? null,
          milestoneId: w.milestoneId ?? null,
          refGroupId: w.refGroupId ?? null,
          variantMeta: w.variantMeta ?? null,
          customName: w.customName ?? null,
          acquiredYear: w.acquiredYear ?? null,
          addedAt: w.addedAt!,
        }))
      : [];
  } catch {
    return [];
  }
}

function saveWishlist(items: MyWatchEntry[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

export function getWishlist(): MyWatchEntry[] {
  return loadWishlist();
}

export function addToWishlist(entry: {
  collectionId: string;
  eraId: string | null;
  variantId: string | null;
  milestoneId?: string | null;
  refGroupId?: string | null;
  variantMeta?: Record<string, (string | number)[] | undefined> | null;
  customName: string | null;
  acquiredYear: number | null;
}) {
  const items = loadWishlist();
  const newOne: MyWatchEntry = {
    ...entry,
    milestoneId: entry.milestoneId ?? null,
    refGroupId: entry.refGroupId ?? null,
    variantMeta: entry.variantMeta ?? null,
    id: `wish-${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  items.push(newOne);
  saveWishlist(items);
  return newOne;
}

export function removeFromWishlist(id: string) {
  const items = loadWishlist().filter((w) => w.id !== id);
  saveWishlist(items);
}
