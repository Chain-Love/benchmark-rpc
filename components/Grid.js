// components/Grid.js
import styles from "../styles/Grid.module.css";

const CLIENT_VERSION_METHOD = "web3_clientVersion";
const REFERENCE_TITLE = "Ethereum";

const Grid = ({ data }) => {
  const getColorClass = (rpc, response, referenceResponse) => {
    if (rpc.rpcTitle === REFERENCE_TITLE) {
      return "has-background-light has-text-dark";
    }

    if (
      response.error ||
      response.method === CLIENT_VERSION_METHOD ||
      !referenceResponse ||
      referenceResponse.error ||
      referenceResponse.time <= 0
    ) {
      return "";
    }

    let colorClass = "has-background-success has-text-light";

    if (response.time > referenceResponse.time * 2) {
      colorClass = "has-background-danger has-text-light";
    } else if (response.time > referenceResponse.time * 1.25) {
      colorClass = "has-background-warning has-text-dark";
    }

    return colorClass;
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

    return `${response.time.toFixed(2)} ms`;
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
          {methods.map((method) => {
            const referenceResponse = data
              .find((rpc) => rpc.rpcTitle === REFERENCE_TITLE)
              ?.responses.find((response) => response.method === method);
            const requestTooltip = data
              .map((rpc) => {
                const request = rpc.responses.find(
                  (response) => response.method === method
                )?.request;

                return request
                  ? `${rpc.rpcTitle}:\n${JSON.stringify(request, null, 2)}`
                  : `${rpc.rpcTitle}: request not sent`;
              })
              .join("\n\n");
            const clientTimes = data
              .filter((rpc) => rpc.rpcTitle !== REFERENCE_TITLE)
              .map((rpc) =>
                rpc.responses.find((response) => response.method === method)
              )
              .filter(
                (response) =>
                  response &&
                  !response.error &&
                  response.method !== CLIENT_VERSION_METHOD
              )
              .map((response) => response.time);
            const fastestClientTime =
              clientTimes.length > 1 ? Math.min(...clientTimes) : null;

            return (
              <tr key={method}>
                <td className={styles.methodName} title={requestTooltip}>
                  {method}
                </td>

                {data.map((rpc) => {
                  const response = rpc.responses.find(
                    (item) => item.method === method
                  );
                  const isFastestClient =
                    rpc.rpcTitle !== REFERENCE_TITLE &&
                    response &&
                    !response.error &&
                    response.method !== CLIENT_VERSION_METHOD &&
                    response.time === fastestClientTime;

                  return (
                    <td
                      key={`${rpc.rpcUrl}-${method}`}
                      className={
                        response
                          ? getColorClass(
                              rpc,
                              response,
                              referenceResponse
                            )
                          : ""
                      }
                      title={response?.error ? response.errorMessage : ""}
                    >
                      {formatCellValue(response)}
                      {isFastestClient && (
                        <span
                          role="img"
                          aria-label="Faster client"
                          title="Faster client"
                        >
                          {" "}🏆
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Grid;
