import { Fragment, useEffect, useState } from "react";
import styles from "../styles/Grid.module.css";

const CLIENT_VERSION_METHOD = "web3_clientVersion";
const REFERENCE_TITLE = "Ethereum";

const Grid = ({ data }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [copiedRequestKey, setCopiedRequestKey] = useState(null);
  const [copyErrorKey, setCopyErrorKey] = useState(null);
  const [methodQuery, setMethodQuery] = useState("");
  const [tableFilter, setTableFilter] = useState("all");

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedMethod(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const getResponse = (rpc, method) =>
    rpc?.responses.find((response) => response.method === method);

  const getReferenceResponse = (method) =>
    getResponse(
      data.find((rpc) => rpc.rpcTitle === REFERENCE_TITLE),
      method
    );

  const toggleRequest = (method) => {
    setSelectedMethod((currentMethod) =>
      currentMethod === method ? null : method
    );
    setCopiedRequestKey(null);
    setCopyErrorKey(null);
  };

  const copyRequest = async (requestKey, request) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(request, null, 2));
      setCopiedRequestKey(requestKey);
      setCopyErrorKey(null);
    } catch {
      setCopiedRequestKey(null);
      setCopyErrorKey(requestKey);
    }
  };

  const getColorClass = (rpc, response, referenceResponse) => {
    if (rpc.rpcTitle === REFERENCE_TITLE) {
      return styles.referenceCell;
    }

    if (
      response.error ||
      !referenceResponse ||
      referenceResponse.error ||
      referenceResponse.time <= 0
    ) {
      return "";
    }

    if (response.time > referenceResponse.time * 2) {
      return "has-background-danger has-text-light";
    }

    if (response.time > referenceResponse.time * 1.25) {
      return "has-background-warning has-text-dark";
    }

    return "has-background-success has-text-light";
  };

  const formatComparison = (response, comparisonResponse, comparisonTitle) => {
    if (
      !response ||
      response.error ||
      !comparisonResponse ||
      comparisonResponse.error ||
      comparisonResponse.time <= 0
    ) {
      return null;
    }

    const percentage =
      ((response.time - comparisonResponse.time) / comparisonResponse.time) *
      100;

    if (percentage === 0) {
      return `Same as ${comparisonTitle}`;
    }

    const amount =
      Math.abs(percentage) < 0.05
        ? "<0.1%"
        : `${Math.abs(percentage).toFixed(1)}%`;

    return `${amount} ${
      percentage > 0 ? "slower" : "faster"
    } than ${comparisonTitle}`;
  };

  const allMethods =
    data[0]?.responses
      .map((response) => response.method)
      .filter((method) => method !== CLIENT_VERSION_METHOD) ?? [];

  const hasRegression = (method) => {
    const referenceResponse = getReferenceResponse(method);

    if (!referenceResponse || referenceResponse.error) {
      return false;
    }

    return data.some((rpc) => {
      const response = getResponse(rpc, method);
      return (
        rpc.rpcTitle !== REFERENCE_TITLE &&
        response &&
        !response.error &&
        response.time > referenceResponse.time * 1.25
      );
    });
  };

  const normalizedQuery = methodQuery.trim().toLowerCase();
  const methods = allMethods.filter((method) => {
    if (!method.toLowerCase().includes(normalizedQuery)) {
      return false;
    }

    if (tableFilter === "regressions") {
      return hasRegression(method);
    }

    return true;
  });

  return (
    <>
      <section className={styles.environment} aria-labelledby="environment-title">
        <h3 id="environment-title" className="title is-5">
          Test environment
        </h3>
        <div
          className={`${styles.tableContainer} ${styles.environmentTableContainer}`}
        >
          <table className={`table is-bordered is-narrow ${styles.environmentTable}`}>
            <caption className={styles.visuallyHidden}>
              Client versions used by the benchmark
            </caption>
            <thead>
              <tr>
                <th scope="col">Endpoint</th>
                <th scope="col">Client version</th>
              </tr>
            </thead>
            <tbody>
              {data.map((rpc) => {
                const versionResponse = getResponse(rpc, CLIENT_VERSION_METHOD);

                return (
                  <tr key={rpc.rpcUrl}>
                    <th scope="row">{rpc.rpcTitle}</th>
                    <td>
                      {versionResponse?.error
                        ? "Unavailable"
                        : versionResponse?.result ?? "N/A"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className={styles.controls}>
        <div className="field">
          <label className="label" htmlFor="method-search">
            Find a method
          </label>
          <div className="control">
            <input
              id="method-search"
              className="input"
              type="search"
              placeholder="e.g. eth_getBlock"
              value={methodQuery}
              onChange={(event) => setMethodQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="method-filter">
            Show
          </label>
          <div className="control select is-fullwidth">
            <select
              id="method-filter"
              value={tableFilter}
              onChange={(event) => setTableFilter(event.target.value)}
            >
              <option value="all">All methods</option>
              <option value="regressions">Methods over 25% slower</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className={`tags are-medium ${styles.legend}`}
        aria-label="Table legend"
      >
        <span className="tag has-background-light has-text-dark">
          Reference
        </span>
        <span className="tag has-background-success has-text-light">
          ≤25% slower
        </span>
        <span className="tag has-background-warning has-text-dark">
          25–100% slower
        </span>
        <span className="tag has-background-danger has-text-light">
          &gt;100% slower
        </span>
        <span className="tag">🏆 Fastest client</span>
      </div>

      <div className={styles.tableContainer}>
        <table
          className={`table is-bordered is-hoverable is-fullwidth ${styles.benchmarkTable}`}
        >
          <caption className={styles.visuallyHidden}>
            Average JSON-RPC latency by method and endpoint
          </caption>
          <thead>
            <tr>
              <th scope="col">Method</th>
              {data.map((rpc) => (
                <th
                  key={rpc.rpcUrl}
                  scope="col"
                  className={
                    rpc.rpcTitle === REFERENCE_TITLE
                      ? styles.referenceHeader
                      : undefined
                  }
                >
                  {rpc.rpcTitle}
                  {rpc.rpcTitle === REFERENCE_TITLE && (
                    <span className={styles.columnNote}>Reference</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {methods.map((method, methodIndex) => {
              const referenceResponse = getReferenceResponse(method);
              const clientTimes = data
                .filter((rpc) => rpc.rpcTitle !== REFERENCE_TITLE)
                .map((rpc) => getResponse(rpc, method))
                .filter((response) => response && !response.error)
                .map((response) => response.time);
              const fastestClientTime =
                clientTimes.length > 1 ? Math.min(...clientTimes) : null;
              const detailsId = `request-details-${method}`;
              const requestGroups = [];

              for (const rpc of data) {
                const request = getResponse(rpc, method)?.request;

                if (!request) {
                  continue;
                }

                const requestJson = JSON.stringify(request);
                const matchingGroup = requestGroups.find(
                  (group) => group.requestJson === requestJson
                );

                if (matchingGroup) {
                  matchingGroup.clientNames.push(rpc.rpcTitle);
                } else {
                  requestGroups.push({
                    request,
                    requestJson,
                    clientNames: [rpc.rpcTitle],
                  });
                }
              }

              return (
                <Fragment key={method}>
                  <tr className={methodIndex % 2 ? styles.stripedRow : ""}>
                    <th scope="row" className={styles.methodCell}>
                      <button
                        type="button"
                        className={styles.methodButton}
                        aria-expanded={selectedMethod === method}
                        aria-controls={detailsId}
                        onClick={() => toggleRequest(method)}
                      >
                        <span>{method}</span>
                        <span aria-hidden="true">
                          {selectedMethod === method ? "▾" : "▸"}
                        </span>
                      </button>
                    </th>

                    {data.map((rpc) => {
                      const response = getResponse(rpc, method);
                      const isReference = rpc.rpcTitle === REFERENCE_TITLE;
                      const referenceDifference = isReference
                        ? null
                        : formatComparison(
                            response,
                            referenceResponse,
                            REFERENCE_TITLE
                          );
                      const otherClient = isReference
                        ? null
                        : data.find(
                            (candidate) =>
                              candidate.rpcTitle !== REFERENCE_TITLE &&
                              candidate.rpcUrl !== rpc.rpcUrl
                          );
                      const clientDifference = otherClient
                        ? formatComparison(
                            response,
                            getResponse(otherClient, method),
                            otherClient.rpcTitle
                          )
                        : null;
                      const isFastestClient =
                        !isReference &&
                        response &&
                        !response.error &&
                        response.time === fastestClientTime;

                      return (
                        <td
                          key={rpc.rpcUrl}
                          className={[
                            styles.metricCell,
                            response
                              ? getColorClass(rpc, response, referenceResponse)
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <span className={styles.primaryMetric}>
                            {!response
                              ? "N/A"
                              : response.error
                              ? "N/A"
                              : `${response.time.toFixed(1)} ms`}
                            {isFastestClient && (
                              <span
                                role="img"
                                aria-label="Fastest Filecoin client"
                                title="Fastest Filecoin client"
                              >
                                {" "}🏆
                              </span>
                            )}
                          </span>
                          {referenceDifference && (
                            <span className={styles.secondaryMetric}>
                              {referenceDifference}
                            </span>
                          )}
                          {clientDifference && (
                            <span className={styles.secondaryMetric}>
                              {clientDifference}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {selectedMethod === method && (
                    <tr id={detailsId}>
                      <td
                        colSpan={data.length + 1}
                        className={styles.requestDetailsCell}
                      >
                        <div className={styles.requestGrid}>
                          {requestGroups.map((group) => {
                            const requestKey = `${method}-${group.requestJson}`;
                            const clientLabel =
                              group.clientNames.length === data.length
                                ? "All clients"
                                : group.clientNames.join(", ");

                            return (
                              <section
                                key={group.requestJson}
                                className={styles.clientRequest}
                                aria-label={`${clientLabel} request`}
                              >
                                <div className={styles.clientRequestHeader}>
                                  <strong>{clientLabel}</strong>
                                  <button
                                    type="button"
                                    className="button is-small is-light"
                                    onClick={() =>
                                      copyRequest(requestKey, group.request)
                                    }
                                  >
                                    {copiedRequestKey === requestKey
                                      ? "Copied"
                                      : copyErrorKey === requestKey
                                      ? "Copy failed"
                                      : "Copy JSON"}
                                  </button>
                                </div>
                                <pre>
                                  {JSON.stringify(group.request, null, 2)}
                                </pre>
                              </section>
                            );
                          })}

                          {requestGroups.length === 0 && (
                            <span>Request unavailable</span>
                          )}
                        </div>
                        <span className={styles.visuallyHidden} aria-live="polite">
                          {copiedRequestKey
                            ? "Request copied to clipboard"
                            : copyErrorKey
                            ? "Request could not be copied"
                            : ""}
                        </span>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {methods.length === 0 && (
              <tr>
                <td colSpan={data.length + 1} className={styles.emptyState}>
                  No methods match the current search and filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Grid;
