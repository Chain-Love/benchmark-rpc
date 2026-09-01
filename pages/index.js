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
  benchmarkReady,
  intervalMs,
  collectionDurationMs,
  estimatedReadyAt,
}) => {
  return (
    <div className={styles.container}>
      <h1 className="title is-1">RPC Benchmark</h1>

      <div className="content">
        <p>
          We send the same types of Ethereum JSON-RPC requests to Forest, Lotus,
          and an Ethereum node used as a reference every{" "}
          <strong>{formatDuration(intervalMs)}</strong>.
        </p>

        <div className="tags are-medium" aria-label="Table legend">
          <span className="tag has-background-light has-text-dark">
            Reference value
          </span>
          <span className="tag has-background-success has-text-light">
            No more than 25% slower
          </span>
          <span className="tag has-background-warning has-text-dark">
            Up to 2× slower
          </span>
          <span className="tag has-background-danger has-text-light">
            Over 2× slower
          </span>
          <span className="tag">🏆 Faster client</span>
        </div>

        {fetchedAt && (
          <p>
            Last probe:{" "}
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
          current number is <strong>{sampleCount}</strong>.
          {estimatedReadyAt ? (
            <>
              {" "}Expected to be ready by{" "}
              <strong>{new Date(estimatedReadyAt).toLocaleString()}</strong>.
            </>
          ) : (
            <> Collecting the first sample…</>
          )}
        </div>
      ) : (
        <BenchmarkSection
          title={`Filecoin ETH RPC Benchmark — average over ${formatDuration(
            collectionDurationMs
          )}`}
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
      benchmarkReady: snapshot.ready,
      intervalMs: snapshot.intervalMs,
      collectionDurationMs: snapshot.collectionDurationMs,
      estimatedReadyAt: snapshot.firstSampleAt
        ? new Date(
            new Date(snapshot.firstSampleAt).getTime() +
              (snapshot.minSamples - 1) * snapshot.intervalMs
          ).toISOString()
        : null,
    },
  };
};

export default Home;
