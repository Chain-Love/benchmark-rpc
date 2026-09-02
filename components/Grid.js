import { Fragment, useEffect, useState } from "react";
import styles from "../styles/Grid.module.css";

const CLIENT_VERSION_METHOD = "web3_clientVersion";
const REFERENCE_TITLE = "Ethereum";
const COMPARISON_RATIO_THRESHOLD = 1.5;

const getResponse = (rpc, method) =>
  rpc?.responses.find((response) => response.method === method);

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
      return styles.slowCell;
    }

    if (response.time > referenceResponse.time * 1.25) {
      return styles.warningCell;
    }

    return styles.fastCell;
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

    const comparisonRatio =
      percentage > 0
        ? response.time / comparisonResponse.time
        : comparisonResponse.time / response.time;

    if (comparisonRatio >= COMPARISON_RATIO_THRESHOLD) {
      return `${comparisonRatio.toLocaleString("en-US", {
        maximumFractionDigits: 1,
      })} times ${
        percentage > 0 ? "slower" : "faster"
      } than ${comparisonTitle}`;
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

  const filecoinClients = data.filter(
    (rpc) => rpc.rpcTitle !== REFERENCE_TITLE
  );
  const clientWinCounts = new Map(
    filecoinClients.map((rpc) => [rpc.rpcTitle, 0])
  );
  let tiedOrUnavailableCount = 0;

  for (const method of allMethods) {
    const successfulClients = filecoinClients
      .map((rpc) => ({
        title: rpc.rpcTitle,
        response: getResponse(rpc, method),
      }))
      .filter(({ response }) => response && !response.error);

    if (successfulClients.length !== filecoinClients.length) {
      tiedOrUnavailableCount += 1;
      continue;
    }

    const fastestTime = Math.min(
      ...successfulClients.map(({ response }) => response.time)
    );
    const fastestClients = successfulClients.filter(
      ({ response }) => response.time === fastestTime
    );

    if (fastestClients.length !== 1) {
      tiedOrUnavailableCount += 1;
      continue;
    }

    const fastestTitle = fastestClients[0].title;
    clientWinCounts.set(fastestTitle, clientWinCounts.get(fastestTitle) + 1);
  }

  const percentageOfMethods = (count) =>
    allMethods.length ? Math.round((count / allMethods.length) * 100) : 0;
  const regressionPercentage = percentageOfMethods(
    allMethods.filter(hasRegression).length
  );

  return (
    <>
      {allMethods.length > 0 && (
        <p className={styles.summary}>
          <strong>Across all methods:</strong>{" "}
          {filecoinClients.map((rpc) => (
            <span key={rpc.rpcUrl}>
              {rpc.rpcTitle} fastest: {percentageOfMethods(
                clientWinCounts.get(rpc.rpcTitle)
              )}%
            </span>
          ))}
          {tiedOrUnavailableCount > 0 && (
            <span>
              Tied or unavailable: {percentageOfMethods(tiedOrUnavailableCount)}%
            </span>
          )}
          <span>
            Methods &gt;25% slower than Ethereum: {regressionPercentage}%
          </span>
        </p>
      )}

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
            Filter methods
          </label>
          <div className="control">
            <div className="select is-fullwidth">
              <select
                id="method-filter"
                value={tableFilter}
                onChange={(event) => setTableFilter(event.target.value)}
              >
                <option value="all">All methods</option>
                <option value="regressions">Over 25% slower vs Ethereum</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`tags are-medium ${styles.legend}`}
        aria-label="Table legend"
      >
        <span className={`tag ${styles.referenceLegend}`}>
          Reference value
        </span>
        <span className={`tag ${styles.fastLegend}`}>
          ≤25% slower
        </span>
        <span className={`tag ${styles.warningLegend}`}>
          25–100% slower
        </span>
        <span className={`tag ${styles.slowLegend}`}>
          &gt;100% slower
        </span>
        <span className={`tag ${styles.trophyLegend}`}>
          🏆 Faster Filecoin client
        </span>
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
              <th scope="col">
                <span className={styles.columnTitle}>Method</span>
              </th>
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
                  <span className={styles.columnTitle}>{rpc.rpcTitle}</span>
                  {rpc.rpcTitle === REFERENCE_TITLE && (
                    <span className={styles.columnNote}>Reference value</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {methods.map((method, methodIndex) => {
              const referenceResponse = getReferenceResponse(method);
              const filecoinResults = data
                .filter((rpc) => rpc.rpcTitle !== REFERENCE_TITLE)
                .map((rpc) => ({
                  title: rpc.rpcTitle,
                  response: getResponse(rpc, method),
                }))
                .filter(({ response }) => response && !response.error);
              const fastestClientTime =
                filecoinResults.length > 1
                  ? Math.min(
                      ...filecoinResults.map(({ response }) => response.time)
                    )
                  : null;
              let clientComparison = null;

              if (filecoinResults.length === 2) {
                const [fasterClient, slowerClient] = [...filecoinResults].sort(
                  (first, second) => first.response.time - second.response.time
                );

                clientComparison =
                  fasterClient.response.time === slowerClient.response.time
                    ? `${fasterClient.title} and ${slowerClient.title} tied`
                    : `${fasterClient.title} ${formatComparison(
                        fasterClient.response,
                        slowerClient.response,
                        slowerClient.title
                      )}`;
              }

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
                        <span>
                          <span className={styles.methodName}>{method}</span>
                          {clientComparison && (
                            <span className={styles.rowComparison}>
                              {clientComparison}
                            </span>
                          )}
                        </span>
                        <span className={styles.requestToggleLabel}>
                          {selectedMethod === method
                            ? "Hide request"
                            : "View request"}{" "}
                          <span aria-hidden="true">
                            {selectedMethod === method ? "▾" : "▸"}
                          </span>
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
                                <strong>{clientLabel}</strong>
                                <div className={styles.requestCode}>
                                  <button
                                    type="button"
                                    className={`button is-small is-light ${styles.copyButton}`}
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
                                  <pre>
                                    {JSON.stringify(group.request, null, 2)}
                                  </pre>
                                </div>
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

export const TestEnvironment = ({ data }) => (
  <section className={styles.environment} aria-labelledby="environment-title">
    <h2 id="environment-title" className="title is-3">
      Test environment
    </h2>
    <div
      className={`${styles.tableContainer} ${styles.environmentTableContainer}`}
    >
      <table
        className={`table is-bordered is-narrow ${styles.environmentTable}`}
      >
        <caption className={styles.visuallyHidden}>
          Client versions used by the benchmark
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className={styles.columnTitle}>Client</span>
            </th>
            <th scope="col">
              <span className={styles.columnTitle}>Version</span>
            </th>
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
);

export default Grid;
