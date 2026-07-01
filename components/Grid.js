// components/Grid.js
import styles from "../styles/Grid.module.css";

const CLIENT_VERSION_METHOD = "web3_clientVersion";

const Grid = ({ data }) => {
  const getColorClass = (response) => {
    if (response.error || response.method === CLIENT_VERSION_METHOD) {
      return "";
    }

    if (response.time > 500) {
      return "has-background-danger has-text-light";
    }

    if (response.time > 200) {
      return "has-background-warning has-text-dark";
    }

    return "has-background-success has-text-light";
  };

  const formatCellValue = (response) => {
    if (!response) {
      return "N/A";
    }

    if (response.error) {
      return response.errorMessage;
    }

    if (response.method === CLIENT_VERSION_METHOD) {
      return response.result;
    }

    const suffix =
      response.errorCount > 0
        ? ` (${response.errorCount}/${response.samples} failed)`
        : "";

    return `${response.time.toFixed(2)} ms${suffix}`;
  };

  const methods = data[0]?.responses.map((response) => response.method) ?? [];

  return (
    <div className={styles.grid}>
      <table className="table is-bordered is-striped is-hoverable is-fullwidth">
        <thead>
          <tr>
            <th>Method</th>

            {data.map((rpc) => (
              <th key={rpc.rpcUrl}>{rpc.rpcTitle}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {methods.map((method) => (
            <tr key={method}>
              <td>{method}</td>

              {data.map((rpc) => {
                const response = rpc.responses.find(
                  (item) => item.method === method
                );

                return (
                  <td
                    key={`${rpc.rpcUrl}-${method}`}
                    className={response ? getColorClass(response) : ""}
                    title={response?.errorMessage ?? ""}
                  >
                    {formatCellValue(response)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Grid;
