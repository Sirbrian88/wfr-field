"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useOfflineTriage — manages the offline Transformers.js Web Worker.
 *
 * Returns:
 *   runOffline(notes: string) → Promise<triageJSON>
 *   isLoading: bool
 *   isReady: bool
 *   progress: { stage: string, percent: number }
 */
export function useOfflineTriage() {
  const workerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState({ stage: "", percent: 0 });

  // Pending promise resolvers — keyed by message type
  const pendingRef = useRef(null);

  useEffect(() => {
    // Only create worker on client
    if (typeof window === "undefined") return;

    let worker;
    try {
      worker = new Worker(
        new URL("../workers/offlineTriage.worker.js", import.meta.url),
        { type: "module" }
      );
    } catch (err) {
      console.warn("Could not create offline triage worker:", err);
      return;
    }

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const { type, ...rest } = event.data;

      if (type === "progress") {
        setProgress({ stage: rest.stage, percent: rest.percent });
        if (rest.percent < 100) setIsLoading(true);
      } else if (type === "ready") {
        setIsLoading(false);
        setIsReady(true);
        setProgress({ stage: "Model ready", percent: 100 });
      } else if (type === "result") {
        setIsLoading(false);
        if (pendingRef.current) {
          pendingRef.current.resolve(rest.triage);
          pendingRef.current = null;
        }
      } else if (type === "error") {
        setIsLoading(false);
        if (pendingRef.current) {
          pendingRef.current.reject(new Error(rest.message));
          pendingRef.current = null;
        }
      }
    };

    worker.onerror = (err) => {
      setIsLoading(false);
      if (pendingRef.current) {
        pendingRef.current.reject(new Error("Worker error: " + err.message));
        pendingRef.current = null;
      }
    };

    // Kick off model loading immediately
    setIsLoading(true);
    worker.postMessage({ type: "init" });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const runOffline = useCallback((notes) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error("Offline worker not available"));
        return;
      }
      pendingRef.current = { resolve, reject };
      setIsLoading(true);
      workerRef.current.postMessage({ type: "triage", payload: { notes } });
    });
  }, []);

  return { runOffline, isLoading, isReady, progress };
}
