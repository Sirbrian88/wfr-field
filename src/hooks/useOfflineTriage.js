"use client";
import { useRef, useCallback, useState, useEffect } from "react";

/**
 * Hook for offline triage via Web Worker loaded from /public/workers/.
 * The worker uses Transformers.js loaded from CDN — no bundling needed.
 */
export function useOfflineTriage() {
  const workerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ stage: "", percent: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const worker = new Worker("/workers/offlineTriage.worker.js");
    workerRef.current = worker;
    worker.onmessage = (e) => {
      const { type, stage, percent } = e.data;
      if (type === "progress") setProgress({ stage: stage || "", percent: percent || 0 });
      if (type === "ready") { setIsReady(true); setIsLoading(false); }
      if (type === "error") setIsLoading(false);
    };
    worker.postMessage({ type: "init" });
    setIsLoading(true);
    return () => { worker.terminate(); workerRef.current = null; };
  }, []);

  const runOffline = useCallback((notes) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) return reject(new Error("Worker not available"));
      const handler = (e) => {
        const { type } = e.data;
        if (type === "result") { workerRef.current.removeEventListener("message", handler); resolve(e.data.triage); }
        if (type === "error") { workerRef.current.removeEventListener("message", handler); reject(new Error(e.data.message)); }
      };
      workerRef.current.addEventListener("message", handler);
      workerRef.current.postMessage({ type: "triage", payload: { notes } });
    });
  }, []);

  return { runOffline, isLoading, isReady, progress };
}
