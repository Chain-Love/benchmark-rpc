// pages/index.js

import BenchmarkSection from "../components/BenchmarkSection";
import styles from "../styles/Home.module.css";
import { getBenchmarkSnapshot } from "../lib/benchmarkCache";

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
  workerCount,
  collectionWindowMs,
  estimatedReadyAt,
}) => {
  let resultsSubtitle =
    sampleCount === 1
      ? "Based on the latest sample"
      : `Average of ${sampleCount} samples collected over ${formatDuration(
          collectionWindowMs
        )}`;

  if (fetchedAt) {
    resultsSubtitle += ` · Last updated ${new Date(fetchedAt).toLocaleString()}`;
  }

  return (
    <div className={styles.container}>
      <h1 className={`${styles.hero} title is-1`}>RPC Benchmark</h1>
      <p className={styles.intro}>
        Compare Forest and Lotus response times with an Ethereum reference node.
      </p>

      {benchmarkError && (
        <p className="has-text-danger">
          Last benchmark error: {benchmarkError}
        </p>
      )}

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
          title="Results"
          subtitle={resultsSubtitle}
          benchmarkData={benchmarkData}
        />
      )}

      <div className={`content ${styles.content}`}>
        <section
          className={styles.methodology}
          aria-labelledby="methodology-title"
        >
          <h2 id="methodology-title" className="title is-3">
            How this benchmark works
          </h2>
          <ul>
            <li>
              Every <strong>{formatDuration(intervalMs)}</strong>, we send the
              same types of Ethereum JSON-RPC requests to Forest, Lotus, and an
              Ethereum node used as a reference.
            </li>
            <li>
              We run up to <strong>{workerCount}</strong> requests in parallel.
            </li>
            <li>
              Each client uses its own latest block and transaction, so the
              exact data may differ.
            </li>
            <li>
              The table shows the average response time for the period displayed
              above it.
            </li>
            <li>
              You can review the benchmark&apos;s source code on{" "}
              <a
                href="https://github.com/Chain-Love/benchmark-rpc"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              .
            </li>
          </ul>
        </section>
      </div>
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
      workerCount: snapshot.workerCount,
      collectionWindowMs: snapshot.collectionWindowMs,
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
