import { useParams, Link } from "react-router-dom";
import type { SeedData } from "../types";
import styles from "./BrandsView.module.css";

export function BrandsView({ seed }: { seed: SeedData }) {
  const { brandSlug } = useParams();
  const brands = [...seed.brands].sort((a, b) => a.sortOrder - b.sortOrder);

  if (brandSlug) {
    const brand = seed.brands.find((b) => b.slug === brandSlug);
    if (!brand) return <div className={styles.empty}>ブランドが見つかりません。</div>;
    const collections = seed.collections
      .filter((c) => c.brandId === brand.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return (
      <div className={styles.page}>
        <Link to="/brands" className={styles.back}>← ブランド一覧</Link>
        <h1 className={styles.title}>{brand.name}</h1>
        {brand.countryNameEn && <p className={styles.meta}>{brand.countryNameEn}</p>}
        <ul className={styles.collectionList}>
          {collections.map((c) => (
            <li key={c.id}>
              <Link to={`/collection/${c.slug}`} className={styles.collectionCard}>
                <span className={styles.collName}>{c.name}</span>
                {c.type && <span className={styles.collType}>{c.type}</span>}
                {c.introducedYear != null && (
                  <span className={styles.collYear}>{c.introducedYear}年〜</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ブランドから選ぶ</h1>
      <p className={styles.lead}>ブランド → モデル → 進化の歴史 の順でたどれます。</p>
      <ul className={styles.brandList}>
        {brands.map((b) => (
          <li key={b.id}>
            <Link to={`/brands/${b.slug}`} className={styles.brandCard}>
              <span className={styles.brandName}>{b.name}</span>
              {b.countryNameEn && <span className={styles.brandMeta}>{b.countryNameEn}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
