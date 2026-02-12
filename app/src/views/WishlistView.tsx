import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import type { SeedData } from "../types";
import { getWishlist, removeFromWishlist, type MyWatchEntry } from "../myWatches";
import styles from "./MyWatchesView.module.css";

export function WishlistView({ seed }: { seed: SeedData }) {
  const [items, setItems] = useState<MyWatchEntry[]>([]);

  useEffect(() => {
    setItems(getWishlist());
  }, []);

  const remove = (id: string) => {
    removeFromWishlist(id);
    setItems(getWishlist());
  };

  const getCollection = (id: string) => seed.collections.find((c) => c.id === id);
  const getBrand = (brandId: string) => seed.brands.find((b) => b.id === brandId);
  const getMilestone = (id: string | null) =>
    id ? (seed.milestones ?? []).find((m) => m.id === id) : null;
  const getRefGroup = (id: string | null) =>
    id ? (seed.refGroups ?? []).find((rg) => rg.id === id) : null;

  const variantMetaSummary = (meta: Record<string, (string | number)[] | undefined> | null | undefined): string => {
    if (!meta || typeof meta !== "object") return "";
    const parts = Object.entries(meta)
      .filter(([, v]) => Array.isArray(v) && v.length > 0)
      .map(([, v]) => (v as (string | number)[]).join(", "));
    return parts.length > 0 ? parts.join(" / ") : "";
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>欲しい時計</h1>
      <p className={styles.lead}>
        欲しいと思っている時計をコレクション・進化点・型番に紐づけておけます。
      </p>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>まだ登録されていません。</p>
          <Link to="/brands" className={styles.cta}>ブランドから選んで追加</Link>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((w) => {
            const coll = getCollection(w.collectionId);
            const brand = coll ? getBrand(coll.brandId) : null;
            const milestone = getMilestone(w.milestoneId ?? null);
            const refGroup = getRefGroup(w.refGroupId ?? null);
            const metaSummary = variantMetaSummary(w.variantMeta ?? null);
            return (
              <li key={w.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <span className={styles.brand}>{brand?.name}</span>
                  <Link to={`/collection/${coll?.slug}`} className={styles.name}>
                    {coll?.name ?? w.collectionId}
                  </Link>
                  {milestone && (
                    <span className={styles.milestoneLabel}>{milestone.label}</span>
                  )}
                  {refGroup && (
                    <span className={styles.refGroupLabel}>{refGroup.label}</span>
                  )}
                  {metaSummary && (
                    <span className={styles.variantMeta}>{metaSummary}</span>
                  )}
                  {w.customName && <span className={styles.custom}>{w.customName}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(w.id)}
                  className={styles.removeBtn}
                  title="削除"
                >
                  削除
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
