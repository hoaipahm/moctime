/// <reference types="vite/client" />
import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./style.css";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Moc rendering error", error.name, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <div className="boot">
        <h1>Mốc</h1>
        <p>Không thể mở trang / Could not open this page</p>
        <button className="button" onClick={() => location.reload()}>
          Thử lại / Retry
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
if (import.meta.env.PROD && "serviceWorker" in navigator && !window.MocNative) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* The app still works online when offline caching is unavailable. */
    });
  });
}
