// components/BenchmarkSection.js

import Grid from "./Grid";
import styles from "../styles/BenchmarkSection.module.css";

const BenchmarkSection = ({ title, subtitle, benchmarkData }) => {
  return (
    <div className={styles.section}>
      <h2 className={`${styles.title} title is-3`}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
      <Grid data={benchmarkData} />
    </div>
  );
};

export default BenchmarkSection;
