# Benchmark RPC

This is a Next.js app for benchmarking multiple Ethereum RPC APIs on several common endpoints. 

## Getting Started

1. Clone the repository
2. Install the dependencies
3. Update the `/config/rpc-urls.json` file with your RPC URLs
4. Run the development server

```bash
npm install
npm run dev
```

## Configuration

Set `BENCHMARK_WORKERS` to control the maximum number of concurrent RPC
requests. It must be a positive integer and defaults to `4`.

