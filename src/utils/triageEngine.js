/**
 * triageEngine.js — provider abstraction layer for the two-tier hybrid AI triage system.
 *
 * Online  → Gemini 1.5 Flash via /api/triage/cloud
 * Offline → Transformers.js Web Worker via useOfflineTriage hook
 *
 * This module exports a factory that, given a runOffline function from the hook,
 * returns the unified runTriage(notes) → Promise<triageJSON>.
 */

/**
 * Call the cloud Gemini route.
 * @param {string} notes
 * @returns {Promise<object>} triage JSON
 */
async function runCloud(notes) {
  const res = await fetch("/api/triage/cloud", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });

  if (!res.ok) {
    let msg = `Cloud triage error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  if (!data?.ok || !data?.triage) {
    throw new Error("Unexpected cloud response format");
  }
  return data.triage;
}

/**
 * Create the runTriage function bound to the offline runner from the hook.
 *
 * @param {Function} runOfflineFn — from useOfflineTriage().runOffline
 * @returns {{ runTriage: (notes: string) => Promise<object>, mode: string }}
 */
export function createTriageRunner(runOfflineFn) {
  const isOnline =
    typeof navigator !== "undefined" ? navigator.onLine : true;

  const mode = isOnline ? "cloud" : "offline";

  async function runTriage(notes) {
    if (!notes?.trim()) {
      throw new Error("Please enter field notes to process.");
    }

    if (isOnline) {
      try {
        return await runCloud(notes);
      } catch (cloudErr) {
        console.warn(
          "Cloud triage failed, falling back to offline:",
          cloudErr.message
        );
        // Fall through to offline
        if (typeof runOfflineFn === "function") {
          return await runOfflineFn(notes);
        }
        throw cloudErr;
      }
    } else {
      if (typeof runOfflineFn !== "function") {
        throw new Error("Offline triage not available");
      }
      return await runOfflineFn(notes);
    }
  }

  return { runTriage, mode };
}
