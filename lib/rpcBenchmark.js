// lib/rpcBenchmark.js

const filecoinRpcEndpoints = [
  {
    title: "Forest",
    url: "http://192.168.135.118:2346/rpc/v1",
  },
  {
    title: "Lotus",
    url: "http://192.168.135.102:2346/rpc/v1",
  },
  {
    title: "Ethereum",
    url: "http://192.168.0.113:8545",
  },
];

const rpcMethods = [
  "eth_blockNumber",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
  "eth_getBlockTransactionCountByNumber",
  "eth_getBlockTransactionCountByHash",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_call",
  "eth_getLogs",
  "eth_getBalance",
  "eth_gasPrice",
];

const methodParams = (latestBlockNumber, latestBlockHash, latestTransactionHash) => ({
  eth_blockNumber: [],
  eth_getBlockByNumber: [latestBlockNumber, true],
  eth_getBlockByHash: [latestBlockHash, true],
  eth_getBlockTransactionCountByNumber: [latestBlockNumber],
  eth_getBlockTransactionCountByHash: [latestBlockHash],
  eth_getTransactionByHash: [latestTransactionHash],
  eth_getTransactionReceipt: [latestTransactionHash],
  eth_call: [
    {
      to: "0x7B90337f65fAA2B2B8ed583ba1Ba6EB0C9D7eA44",
      data: "0x70a082310000000000000000000000007B90337f65fAA2B2B8ed583ba1Ba6EB0C9D7eA44",
    },
    "latest",
  ],
  eth_getLogs: [
    {
      fromBlock: "latest",
      address: "0x0000000000000000000000000000000000000000",
    },
  ],
  eth_getBalance: ["0x0000000000000000000000000000000000000000", "latest"],
  eth_gasPrice: [],
});

const benchmarkRpc = async (rpcUrl, method, params) => {
  const requestData = {
    jsonrpc: "2.0",
    method,
    params,
    id: 1,
  };

  const startTime = performance.now();

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    const result = await response.json();
    const endTime = performance.now();

    if (!response.ok) {
      const errorMessage = result.error
        ? result.error.message
        : `HTTP error! status: ${response.status}`;

      throw new Error(errorMessage);
    }

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      time: endTime - startTime,
      result: result.result,
      error: false,
      errorMessage: "",
    };
  } catch (error) {
    const endTime = performance.now();

    return {
      time: endTime - startTime,
      error: true,
      errorMessage: `${error.message} (${(endTime - startTime).toFixed(2)} ms)`,
    };
  }
};

const fetchLatestBlockInfo = async (rpcUrl) => {
  const blockNumberResult = await benchmarkRpc(rpcUrl, "eth_blockNumber", []);

  if (blockNumberResult.error) {
    throw new Error(blockNumberResult.errorMessage);
  }

  const latestBlockNumber = blockNumberResult.result;

  const blockResult = await benchmarkRpc(rpcUrl, "eth_getBlockByNumber", [
    latestBlockNumber,
    true,
  ]);

  if (blockResult.error) {
    throw new Error(blockResult.errorMessage);
  }

  const latestBlockHash = blockResult.result.hash;
  const latestTransactionHash =
    blockResult.result.transactions.length > 0
      ? blockResult.result.transactions[0].hash
      : null;

  return {
    latestBlockNumber,
    latestBlockHash,
    latestTransactionHash,
  };
};

export const fetchBenchmarkData = async () => {
  const results = [];

  for (const endpoint of filecoinRpcEndpoints) {
    const { title, url } = endpoint;

    try {
      const { latestBlockNumber, latestBlockHash, latestTransactionHash } =
        await fetchLatestBlockInfo(url);

      const params = methodParams(
        latestBlockNumber,
        latestBlockHash,
        latestTransactionHash
      );

      const responses = [];

      for (const method of rpcMethods) {
        const param = params[method];

        if (param.some((value) => value === null)) {
          responses.push({
            method,
            time: 0,
            error: true,
            errorMessage: "No transaction hash available",
          });

          continue;
        }

        const result = await benchmarkRpc(url, method, param);
        responses.push({ method, ...result });
      }

      results.push({
        rpcUrl: url,
        rpcTitle: title,
        responses,
      });
    } catch (error) {
      results.push({
        rpcUrl: url,
        rpcTitle: title,
        responses: rpcMethods.map((method) => ({
          method,
          time: 0,
          error: true,
          errorMessage: error.message,
        })),
      });
    }
  }

  return results;
};

export { filecoinRpcEndpoints, rpcMethods };
