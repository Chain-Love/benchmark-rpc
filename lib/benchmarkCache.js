import { fetchBenchmarkData } from "./rpcBenchmark";

const BENCHMARK_INTERVAL_MS = Number(
  process.env.BENCHMARK_INTERVAL_MS ?? 60_000
);

const BENCHMARK_SAMPLES_MIN = Number(
  process.env.BENCHMARK_SAMPLES_MIN ?? 720
);

const BENCHMARK_SAMPLES_MAX = Number(
  process.env.BENCHMARK_SAMPLES_MAX ?? 1440
);

let cache = {
  samples: [],
  data: null,
  fetchedAt: null,
  error: null,
  running: false,
  initialized: false,
};

const averageSamples = (samples) => {
  if (!samples.length) return [];

  const endpointMap = new Map();

  for (const sample of samples) {
    for (const rpc of sample) {
      if (!endpointMap.has(rpc.rpcUrl)) {
        endpointMap.set(rpc.rpcUrl, {
          rpcUrl: rpc.rpcUrl,
          rpcTitle: rpc.rpcTitle,
          methods: new Map(),
        });
      }

      const endpoint = endpointMap.get(rpc.rpcUrl);

      for (const response of rpc.responses) {
        if (!endpoint.methods.has(response.method)) {
          endpoint.methods.set(response.method, {
            method: response.method,
            successCount: 0,
            errorCount: 0,
            totalTime: 0,
            lastResult: null,
            lastErrorMessage: "",
          });
        }

        const methodStats = endpoint.methods.get(response.method);

        if (response.error) {
          methodStats.errorCount += 1;
          methodStats.lastErrorMessage = response.errorMessage;
          continue;
        }

        methodStats.successCount += 1;
        methodStats.totalTime += response.time;
        methodStats.lastResult = response.result;
      }
    }
  }

  return Array.from(endpointMap.values()).map((endpoint) => ({
    rpcUrl: endpoint.rpcUrl,
    rpcTitle: endpoint.rpcTitle,
    responses: Array.from(endpoint.methods.values()).map((methodStats) => {
      const totalCount = methodStats.successCount + methodStats.errorCount;

      if (methodStats.successCount === 0) {
        return {
          method: methodStats.method,
          time: 0,
          samples: totalCount,
          successCount: methodStats.successCount,
          errorCount: methodStats.errorCount,
          result: null,
          error: true,
          errorMessage:
            methodStats.lastErrorMessage || "All samples failed",
        };
      }

      return {
        method: methodStats.method,
        time: methodStats.totalTime / methodStats.successCount,
        samples: totalCount,
        successCount: methodStats.successCount,
        errorCount: methodStats.errorCount,
        result: methodStats.lastResult,
        error: false,
        errorMessage: methodStats.errorCount
          ? `${methodStats.errorCount}/${totalCount} samples failed`
          : "",
      };
    }),
  }));
};

const runBenchmark = async () => {
  if (cache.running) return;

  cache.running = true;

  try {
    const sample = await fetchBenchmarkData();

    const samples = [...cache.samples, sample];

    while (samples.length > BENCHMARK_SAMPLES_MAX) {
      samples.shift();
    }

    cache = {
      ...cache,
      samples,
      data: averageSamples(samples),
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

  // On cold start, wait for the first sample instead of serving empty state.
  if (!cache.samples.length && !cache.running) {
    await runBenchmark();
  }

  const sampleCount = cache.samples.length;

  return {
    data: cache.data,
    fetchedAt: cache.fetchedAt,
    error: cache.error,
    running: cache.running,
    intervalMs: BENCHMARK_INTERVAL_MS,
    sampleCount,
    minSamples: BENCHMARK_SAMPLES_MIN,
    maxSamples: BENCHMARK_SAMPLES_MAX,
    ready: sampleCount >= BENCHMARK_SAMPLES_MIN,

    // User-facing approximation: N samples collected every interval.
    collectionDurationMs: sampleCount * BENCHMARK_INTERVAL_MS,

    // Technical wall-clock span between oldest and newest retained samples.
    collectionWindowMs:
      sampleCount > 1 ? (sampleCount - 1) * BENCHMARK_INTERVAL_MS : 0,
  };
};
