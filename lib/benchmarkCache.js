// lib/benchmarkCache.js

import { fetchBenchmarkData } from "./rpcBenchmark";

const BENCHMARK_INTERVAL_MS = 60_000;

let cache = {
  data: null,
  fetchedAt: null,
  error: null,
  running: false,
  initialized: false,
};

const runBenchmark = async () => {
  if (cache.running) return;

  cache.running = true;

  try {
    const data = await fetchBenchmarkData();

    cache = {
      ...cache,
      data,
      fetchedAt: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    cache = {
      ...cache,
      error: error.message,
    };
  } finally {
    cache.running = false;
  }
};

export const initBenchmarkCache = () => {
  if (cache.initialized) return;

  cache.initialized = true;

  // Fetch immediately on first server-side request.
  void runBenchmark();

  // Then refresh at equal intervals.
  setInterval(() => {
    void runBenchmark();
  }, BENCHMARK_INTERVAL_MS);
};

export const getBenchmarkSnapshot = async () => {
  initBenchmarkCache();

  // On cold start, wait for the first result instead of serving empty data.
  if (!cache.data && !cache.running) {
    await runBenchmark();
  }

  return {
    data: cache.data,
    fetchedAt: cache.fetchedAt,
    error: cache.error,
    running: cache.running,
    intervalMs: BENCHMARK_INTERVAL_MS,
  };
};
