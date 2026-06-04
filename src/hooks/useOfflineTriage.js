"use client";
import { useRef, useCallback, useState, useEffect } from "react";

/**
 * Hook for offline triage via Web Worker.
 * Fails gracefully if Worker unavailable — cloud tier is the primary path.
 */
export function useOfflineTriage() {
  const workerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ stage: "", percent: 0 });

  useEffect(() => {
    if (typeof window === "undefined" || typeof Worker === "undefined") return;
    try {
      const worker = new Worker("/workers/offlineTriage.worker.js");
      workerRef.current = worker;
      worker.onmessage = (e) => {
        const { type, stage, percent } = e.data || {};
        if (type === "progress") setProgress({ stage: stage || "", percent: percent || 0 });
        if (type === "ready") { setIsReady(true); setIsLoading(false); }
        if (type === "error") { setIsLoading(false); }
      };
      worker.onerror = () => {
        // Worker failed to load (e.g. CDN model unavailable) — fail silently
        setIsLoading(false);
        workerRef.current = null;
      };
      // Don't auto-init — only load model when actually needed offline
    } catch {
      // Worker not supported in this environment — online mode only
    }
    return () => {
      if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    };
  }, []);

  const runOffline = useCallback((notes) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        return reject(new Error("Offline model unavailable — use online mode"));
      }
      setIsLoading(true);
      const handler = (e) => {
        const { type } = e.data || {};
        if (type === "result") {
          workerRef.current?.removeEventListener("message", handler);
          setIsLoading(false);
          resolve(e.data.triage);
        }
        if (type === "error") {
          workerRef.current?.removeEventListener("message", handler);
          setIsLoading(false);
          reject(new Error(e.data?.message || "Offline inference failed"));
        }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "triage", payload: { notes } });
    });
  }, []);

  return { runOffline, isLoading, isReady, progress };
}
