// pages/index.js

import BenchmarkSection from "../components/BenchmarkSection";
import styles from "../styles/Home.module.css";
import { getBenchmarkSnapshot } from "../lib/benchmarkCache";
import { rpcMethods } from "../lib/rpcBenchmark";

const Home = ({ benchmarkData, fetchedAt, benchmarkError }) => {
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
          The results are displayed in a table where each row represents an RPC
          method and each column represents an RPC URL. Yellow cells indicate
          response times greater than 200 ms, while red cells indicate response
          times greater than 500 ms.
        </p>

        <p>
          The summary rows at the bottom show the average and median response
          times for each RPC method across all URLs.
        </p>

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

      <BenchmarkSection
        title="Filecoin ETH RPC Benchmark"
        rpcMethods={rpcMethods}
        benchmarkData={benchmarkData}
      />
    </div>
  );
};

export const getServerSideProps = async () => {
  const snapshot = await getBenchmarkSnapshot();

  return {
    props: {
      benchmarkData: snapshot.data ?? [],
      fetchedAt: snapshot.fetchedAt,
      benchmarkError: snapshot.error,
    },
  };
};

export default Home;
