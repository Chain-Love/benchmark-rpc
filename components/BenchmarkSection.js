// components/BenchmarkSection.js

import Grid from "./Grid";
import styles from "../styles/BenchmarkSection.module.css";

const BenchmarkSection = ({ title, benchmarkData }) => {
  return (
    <div className={styles.section}>
      <h2 className="title is-3">{title}</h2>
      <Grid data={benchmarkData} />
    </div>
  );
};

export default BenchmarkSection;
