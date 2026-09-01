// components/BenchmarkSection.js

import Grid, { TestEnvironment } from "./Grid";
import styles from "../styles/BenchmarkSection.module.css";

const BenchmarkSection = ({ title, subtitle, benchmarkData }) => {
  return (
    <>
      <section className={styles.section} aria-labelledby="results-title">
        <h2 id="results-title" className={`${styles.title} title is-3`}>
          {title}
        </h2>
        <p className={styles.subtitle}>{subtitle}</p>
        <Grid data={benchmarkData} />
      </section>
      <TestEnvironment data={benchmarkData} />
    </>
  );
};

export default BenchmarkSection;
