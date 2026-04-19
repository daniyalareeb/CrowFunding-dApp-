# 📡 API Reference — CrowdFunding dApp

> Base URL (local): `http://localhost:3000/api`  
> Base URL (env): `NEXT_PUBLIC_API_BASE_URL`  
> All responses are JSON. All blockchain values are returned as ETH strings (via `ethers.formatEther`).

---

## Table of Contents

- [GET /campaigns](#get-campaigns)
- [POST /campaigns](#post-campaigns)
- [PUT /campaigns/:id](#put-campaignsid)
- [GET /total](#get-total)

---

## GET /campaigns

Returns all campaigns stored in the smart contract, optionally filtered by owner address.

### Query Parameters

| Parameter | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| `owner`   | string | No       | Filter campaigns by owner wallet address |

### Response — 200 OK

```json
{
  "campaigns": [
    {
      "id": 0,
      "owner": "0xAbC...",
      "title": "Build a community centre",
      "description": "We want to build...",
      "imageUrl": "https://example.com/image.jpg",
      "category": "Community",
      "target": "1.0",
      "deadline": 1750000000,
      "collectedAmount": "0.5",
      "withdrawedAmount": "0.0",
      "donations": [
        {
          "donator": "0xDeF...",
          "amount": "0.5"
        }
      ]
    }
  ]
}
```

| Field             | Type     | Description                                  |
|-------------------|----------|----------------------------------------------|
| `id`              | number   | Campaign index (position in contract mapping) |
| `owner`           | string   | Wallet address of the campaign creator       |
| `title`           | string   | Campaign title                               |
| `description`     | string   | Campaign description / story                 |
| `imageUrl`        | string   | Cover image URL                              |
| `category`        | string   | One of: General, Tech, Health, Education, Environment, Community |
| `target`          | string   | Funding goal in ETH                          |
| `deadline`        | number   | Unix timestamp (seconds) of the deadline     |
| `collectedAmount` | string   | Total ETH donated so far                     |
| `withdrawedAmount`| string   | Total ETH already withdrawn by the owner     |
| `donations`       | array    | List of all donation objects                 |

### Response — 500 Internal Server Error

```json
{}
```

> ⚠️ **Known Bug (BUG-011/012):** Error body is empty and error detail is in `statusText`, which is unreliable. Also contains a typo: `"Somethings went wrong."`.

---

## POST /campaigns

> ⚠️ **Note:** This route is defined but the **frontend does not use it**. The Create Campaign page (`/create`) calls the smart contract directly via `ethers.js` in the browser. This route exists for server-side or programmatic campaign creation.

> 🐛 **Known Bug (BUG-009):** This route currently ignores the `category` field — it is not passed to the contract call.

Creates a new campaign by calling `contract.createCampaign(...)` from the server.

### Request Body

```json
{
  "title": "Build a community centre",
  "description": "We want to build...",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Community",
  "target": "1000000000000000000",
  "deadline": 1750000000
}
```

| Field         | Type   | Required | Description                                        |
|---------------|--------|----------|----------------------------------------------------|
| `title`       | string | Yes      | Campaign title                                     |
| `description` | string | Yes      | Campaign description                               |
| `imageUrl`    | string | Yes      | Cover image URL                                    |
| `category`    | string | Yes      | Campaign category (**currently ignored — BUG-009**)|
| `target`      | string | Yes      | Funding goal in Wei (use `ethers.parseUnits`)      |
| `deadline`    | number | Yes      | Unix timestamp in **milliseconds**                 |

### Response — 201 Created

```json
{}
```

### Response — 500 Internal Server Error

```json
{}
```

---

## PUT /campaigns/:id

Closes a campaign by setting its deadline to `block.timestamp` on-chain. Only callable by the campaign owner (enforced by the smart contract `onlyOwner` modifier).

> 🐛 **Known Bug (BUG-004):** The `catch` block is missing a `return` statement, causing the error response to never be sent — the request silently hangs on failure.

### URL Parameters

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `id`      | number | Yes      | Campaign ID (index)   |

### Request Body

_None_

### Response — 200 OK

```json
{}
```

### Response — 500 Internal Server Error

```json
{}
```
> ⚠️ Currently this response is **never sent** due to the missing `return`. See BUG-004.

---

## GET /total

Returns the total ETH collected across all campaigns (reads the `totalCollected` public variable from the contract).

### Response — 200 OK

```json
{
  "total": "3.75"
}
```

| Field   | Type   | Description                          |
|---------|--------|--------------------------------------|
| `total` | string | Total ETH raised across all campaigns|

### Response — 500 Internal Server Error

```json
{}
```

---

## Smart Contract Functions (Direct — Frontend Only)

The following functions are called directly from the browser via `ethers.js` and do **not** go through the Next.js API routes.

| Function          | Called From                        | Description                                     |
|-------------------|------------------------------------|-------------------------------------------------|
| `donate(id)`      | `/campaigns/[title]/page.jsx`      | Send ETH to a campaign. `value` = donation amount |
| `withdraw(id, amount)` | `/campaigns/[title]/page.jsx` | Owner withdraws `amount` ETH from campaign     |
| `claimRefund(id)` | `/campaigns/[title]/page.jsx`      | Donor claims refund from a failed campaign      |
| `createCampaign(...)` | `/create/page.jsx`             | Creates a new campaign on-chain                 |
| `closeCampaign(id)` | `AlertModal.jsx`                 | Owner manually closes/expires a campaign        |

> All direct contract calls use `gasLimit: 1000000` as a hardcoded override.

---

## Environment Variables

| Variable                    | Description                                  |
|-----------------------------|----------------------------------------------|
| `NEXT_PUBLIC_API_BASE_URL`  | Base URL for all API fetch calls (client-side)|

---

## Data Flow Diagram

```
Browser (Next.js Client)
│
├── Direct contract calls (ethers.js + MetaMask)
│   ├── donate()
│   ├── withdraw()
│   ├── claimRefund()
│   ├── createCampaign()
│   └── closeCampaign()
│
└── Next.js API Routes (server-side RPC)
    ├── GET  /api/campaigns       → contract.getCampaigns()
    ├── POST /api/campaigns       → contract.createCampaign()  ⚠️ unused by frontend
    ├── PUT  /api/campaigns/:id   → contract.closeCampaign()
    └── GET  /api/total           → contract.totalCollected()
```
