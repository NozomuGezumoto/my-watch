/**
 * コレクション詳細の「自分の写真」を端末内に保存。
 * スロット: 0 = 大きい1枚, 1,2,3 = 小さい3枚。値は data URL (base64)。
 */
const STORAGE_KEY = "project-watch-collection-photos";

export type CollectionPhotos = Record<string, string | undefined>;

function loadForCollection(collectionId: string): (string | undefined)[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, CollectionPhotos> = raw ? JSON.parse(raw) : {};
    const slots = all[collectionId];
    if (!slots || typeof slots !== "object") return [undefined, undefined, undefined, undefined];
    return [
      slots["0"],
      slots["1"],
      slots["2"],
      slots["3"],
    ];
  } catch {
    return [undefined, undefined, undefined, undefined];
  }
}

function saveSlot(collectionId: string, slotIndex: number, dataUrl: string | null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: Record<string, CollectionPhotos> = raw ? JSON.parse(raw) : {};
    if (!all[collectionId]) all[collectionId] = {};
    if (dataUrl) all[collectionId][String(slotIndex)] = dataUrl;
    else delete all[collectionId][String(slotIndex)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getCollectionPhotos(collectionId: string): (string | undefined)[] {
  return loadForCollection(collectionId);
}

export function setCollectionPhoto(
  collectionId: string,
  slotIndex: number,
  dataUrl: string | null
): void {
  saveSlot(collectionId, slotIndex, dataUrl);
}
