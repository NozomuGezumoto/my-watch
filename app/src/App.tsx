import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useSeed } from "./useSeed";
import { ErrorBoundary } from "./ErrorBoundary";
import { TimelineView } from "./views/TimelineView";
import { BrandsView } from "./views/BrandsView";
import { CollectionView } from "./views/CollectionView";
import { MyWatchesView } from "./views/MyWatchesView";
import { WishlistView } from "./views/WishlistView";
import styles from "./App.module.css";

function App() {
  const { seed, loading, error } = useSeed();
  const location = useLocation();

  if (loading) return <div className={styles.center}>読み込み中…</div>;
  if (error) return <div className={styles.center}>データの読み込みに失敗しました。</div>;
  if (!seed) return <div className={styles.center}>データがありません。seed.json を確認してください。</div>;

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>Project Watch</Link>
        <nav className={styles.nav}>
          <Link to="/" className={location.pathname === "/" || location.pathname.startsWith("/brands") ? styles.navActive : ""}>ブランド</Link>
          <Link to="/timeline" className={location.pathname === "/timeline" ? styles.navActive : ""}>年代</Link>
          <Link to="/mine" className={location.pathname === "/mine" ? styles.navActive : ""}>マイ時計</Link>
          <Link to="/wishlist" className={location.pathname === "/wishlist" ? styles.navActive : ""}>欲しい時計</Link>
        </nav>
      </header>
      <main className={styles.main}>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<BrandsView seed={seed} />} />
            <Route path="/brands" element={<BrandsView seed={seed} />} />
            <Route path="/brands/:brandSlug" element={<BrandsView seed={seed} />} />
            <Route path="/timeline" element={<TimelineView seed={seed} />} />
            <Route path="/collection/:collectionSlug" element={<CollectionView key={location.pathname} seed={seed} />} />
            <Route path="/mine" element={<MyWatchesView seed={seed} />} />
            <Route path="/wishlist" element={<WishlistView seed={seed} />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
