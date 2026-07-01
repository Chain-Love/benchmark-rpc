// pages/index.js

import BenchmarkSection from "../components/BenchmarkSection";
import styles from "../styles/Home.module.css";
import { getBenchmarkSnapshot } from "../lib/benchmarkCache";
import { rpcMethods } from "../lib/rpcBenchmark";

const formatDuration = (ms) => {
  const totalSeconds = Math.round(ms / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

const Home = ({
  benchmarkData,
  fetchedAt,
  benchmarkError,
  sampleCount,
  minSamples,
  maxSamples,
  benchmarkReady,
  intervalMs,
  collectionDurationMs,
  collectionWindowMs,
}) => {
  return (
    <div className={styles.container}>
      <h1 className="title is-1">RPC Benchmark</h1>

      <div className="content">
        <p>
          This application benchmarks various Ethereum JSON-RPC endpoints. It
          performs multiple tasks such as fetching block numbers, block details,
          transaction details, and more.
        </p>

        <p>
          Samples are collected every <strong>{formatDuration(intervalMs)}</strong>.
          The cache keeps at most <strong>{maxSamples}</strong> samples. Yellow
          cells indicate average response times greater than 200 ms, while red
          cells indicate average response times greater than 500 ms.
        </p>

        {benchmarkReady && (
          <>
            <p>
              The results are displayed as an average over the latest{" "}
              <strong>{sampleCount}</strong> samples. The current average
              represents approximately{" "}
              <strong>{formatDuration(collectionDurationMs)}</strong> of
              benchmark collection time.
            </p>

            {sampleCount > 1 && (
              <p>
                The retained sample window spans approximately{" "}
                <strong>{formatDuration(collectionWindowMs)}</strong> between
                the oldest and newest sample.
              </p>
            )}
          </>
        )}

        {fetchedAt && (
          <p>
            Last server-side benchmark:{" "}
            <strong>{new Date(fetchedAt).toLocaleString()}</strong>
          </p>
        )}

        {benchmarkError && (
          <p className="has-text-danger">
            Last benchmark error: {benchmarkError}
          </p>
        )}

        <p>
          Source code available on{" "}
          <a
            href="https://github.com/snissn/benchmark-rpc"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </div>

      {!benchmarkReady ? (
        <div className="notification is-info is-light">
          Waiting for <strong>{minSamples}</strong> samples to accumulate,
          current number is <strong>{sampleCount}</strong>. Samples are
          collected every <strong>{formatDuration(intervalMs)}</strong>; this
          usually takes about{" "}
          <strong>{formatDuration(minSamples * intervalMs)}</strong>.
        </div>
      ) : (
        <BenchmarkSection
          title={`Filecoin ETH RPC Benchmark — average over ${sampleCount} samples`}
          rpcMethods={rpcMethods}
          benchmarkData={benchmarkData}
        />
      )}
    </div>
  );
};

export const getServerSideProps = async () => {
  const snapshot = await getBenchmarkSnapshot();

  return {
    props: {
      benchmarkData: snapshot.ready ? snapshot.data ?? [] : [],
      fetchedAt: snapshot.fetchedAt,
      benchmarkError: snapshot.error,
      sampleCount: snapshot.sampleCount,
      minSamples: snapshot.minSamples,
      maxSamples: snapshot.maxSamples,
      benchmarkReady: snapshot.ready,
      intervalMs: snapshot.intervalMs,
      collectionDurationMs: snapshot.collectionDurationMs,
      collectionWindowMs: snapshot.collectionWindowMs,
    },
  };
};

export default Home;
