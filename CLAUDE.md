# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A decentralized crowdfunding dApp ("Fund Seed") built with Next.js 13 and Solidity. Users can create campaigns and donate ETH via MetaMask. Deployed on the Ethereum Sepolia testnet.

## Repository Structure

- `client/` — Next.js 13 frontend (App Router)
- `smart-contract/` — Hardhat project with the Solidity contract and tests

## Commands

### Client (run from `client/`)
```shell
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # ESLint
```

### Smart Contract (run from `smart-contract/`)
```shell
npx hardhat test                                         # Run all contract tests
npx hardhat test --grep "should donate"                  # Run a single test by name
npx hardhat run scripts/deploy.js --network sepolia      # Deploy to Sepolia
npx hardhat compile                                      # Compile contracts
```

## Environment Variables

### `client/.env.local`
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_PROVIDER_URL=<Alchemy RPC URL with API key>
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed contract address>
NEXT_PUBLIC_PRIVATE_KEY=<MetaMask private key (server-side API routes only)>
```

### `smart-contract/.env`
```
ACCOUNT_PRIVATE_KEY=<MetaMask private key>
PROJECT_ID=<Alchemy API key>
```

## Architecture

### Dual Blockchain Connection Pattern

There are two distinct ways the app connects to the blockchain:

1. **Server-side (API routes)** — `client/src/utils/connectBlockchain.js` uses `ethers.JsonRpcProvider` with a private key from env vars to sign transactions server-side (creating campaigns, closing them). Used only in `app/api/` route handlers.

2. **Client-side (browser)** — `client/src/contexts/EthersContext.jsx` uses `ethers.BrowserProvider` with MetaMask (`window.ethereum`) for user-signed transactions (donating, withdrawing). Exposed app-wide via React context.

### Data Flow

- **Campaign reads**: Next.js API route (`GET /api/campaigns`) calls `contract.getCampaigns()` via server-side provider, parses BigInt values with `ethers.formatEther`, and returns JSON. Pages fetch from this API.
- **Donations/withdrawals**: Done directly from the browser via the `EthersContext` contract instance (MetaMask-signed), bypassing the API layer.
- **Campaign creation**: POSTed to the API route which signs/sends the transaction server-side.
- **Campaign details navigation**: The selected campaign object is passed through React context (`setSelectedCampaign`) rather than URL params. The `[title]/page.jsx` reads from `selectedCampaign` in context and redirects back if it's null (e.g., on hard refresh).

### Contract ABI Import

Both `connectBlockchain.js` and `EthersContext.jsx` import the ABI directly from the Hardhat build artifact:
```js
import SmartContract from "../../../smart-contract/artifacts/contracts/CrowdFunding.sol/CrowdFunding.json";
```
This means **you must run `npx hardhat compile` before running the client** if the contract has changed.

### Wallet Auth

Wallet connection state is persisted via a `js-cookie` `isAllowed` cookie. On app init, if the cookie exists, `connectWallet()` is called automatically.

### Smart Contract

`CrowdFunding.sol` is a single-contract system with:
- `createCampaign` / `closeCampaign` (sets deadline to `block.timestamp`)
- `donate` (payable) / `withdraw` (owner only, partial withdrawals allowed via `withdrawedAmount` tracking)
- `getCampaigns` returns all campaigns as an array; individual campaign access via `campaigns(id)` mapping
