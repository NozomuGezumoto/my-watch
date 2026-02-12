import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./App.module.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback ?? (
        <div className={styles.center} style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--text)", marginBottom: "0.5rem" }}>表示中にエラーが発生しました。</p>
          <pre style={{ fontSize: "0.85rem", color: "var(--muted)", overflow: "auto" }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
