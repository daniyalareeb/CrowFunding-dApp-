# CrowdFunding dApp: Comprehensive Architecture & Codebase Report

This document provides a detailed overview of the entire Next.js and Solidity-based crowdfunding Decentralized Application (dApp). It is designed to serve as the script reference and technical foundation for a comprehensive presentation of the decentralized application.

---

## SECTION 1 — Project Overview

The **CrowdFunding dApp** is a decentralized application built to allow individuals and organizations to raise capital securely and transparently without relying on traditional financial institutions or centralized middlemen. It solves the problem of centralized platform fees, censorship, and trust issues by leveraging the immutability of blockchain technology. 

This application operates on the **Ethereum blockchain** due to its robust smart contract capabilities, massive developer ecosystem, and unparalleled security guarantees. For development and demonstration purposes, the application is actively deployed to the **Sepolia testnet**, allowing users to interact with the application using test Ethereum (ETH) without risking real world funds.

The project originated as a fork of the open-source repository `ahmedsemih/CrowdFunding-dApp`. Several significant architectural and feature expansions have been added to the base project, including a full UI/UX overhaul using a dark-mode glassmorphism design language, advanced campaign filtering through categories, a secure and comprehensive refund mechanism, a search function, unique donor deduplication, and a live fiat conversion (ETH to GBP) display.

The full technology stack powering this dApp operates across the full Web3 stack:
*   **Frontend Framework:** Next.js (React)
*   **Smart Contract Language:** Solidity (v0.8.19)
*   **Ethereum Development Environment:** Hardhat
*   **Blockchain Communication:** Ethers.js (v6)
*   **Styling:** Tailwind CSS with custom glassmorphism utilities
*   **RPC Node Provider:** Alchemy
*   **Network:** Sepolia Testnet

---

## SECTION 2 — Smart Contract (Backend)

The core logic of the application resides in `CrowdFunding.sol`, which acts as the decentralized backend.

### The Campaign Struct
The `Campaign` struct is the fundamental data structure stored on-chain, containing the following fields:
*   **`owner`**: The `address` of the wallet that created the campaign and will receive the funds.
*   **`title`**: A `string` representing the name of the campaign.
*   **`description`**: A `string` defining the campaign's purpose and details.
*   **`imageUrl`**: A `string` URL pointing to the campaign's cover image.
*   **`category`**: A `string` indicating the campaign's classification (e.g., Tech, Health, Education).
*   **`target`**: A `uint256` representing the funding goal in Wei.
*   **`collectedAmount`**: A `uint256` tracking the total amount raised so far.
*   **`withdrawedAmount`**: A `uint256` tracking how much the owner has already pulled from the contract.
*   **`deadline`**: A `uint256` Unix timestamp representing the exact second the campaign expires.
*   **`donations`**: An array of `Donation` structs (storing the donator's address and the amount given).

### Functions
*   **`createCampaign`**: Takes in the title, description, image, category, target, and deadline. It instantiates a new Campaign struct in mapping, increments the total campaign count, and returns the new campaign ID.
*   **`donate`**: A payable function allowing users to send ETH. It accepts the campaign ID, checks if the deadline has passed, logs the donor's details in the donations array, and increments the `collectedAmount`.
*   **`withdraw`**: Exclusively callable by the campaign owner. It transfers accumulated ETH from the smart contract directly to the owner's wallet based on a requested amount.
*   **`claimRefund`**: Allows an individual donor to withdraw their funds if a campaign has expired without meeting its funding target.
*   **`getCampaigns`**: A view function that returns an array of all campaigns created on the platform.
*   **`getDonations`**: A view function that retrieves the complete history of donations for a specific campaign ID.

### Require Checks
*   **Creation Checks**: `createCampaign` requires that `_target > 0` (cannot be free) and `_deadline > block.timestamp` (must end in the future).
*   **Deadline Check in `donate()`**: A critical security check `require(block.timestamp < campaign.deadline, "Campaign has ended");` ensures users cannot accidentally donate to an expired campaign.
*   **Refund Checks (`claimRefund`)**: Requires the campaign to be fully expired (`block.timestamp > campaign.deadline`) AND the collected funds to be strictly less than the target (`campaign.collectedAmount < campaign.target`), ensuring refunds are only issued on failure.
*   **Withdrawal Checks**: Validates that `_amount` is less than or equal to `collectedAmount - withdrawedAmount`, preventing the owner from withdrawing more than what is available.
*   **Owner Modifier**: The `onlyOwner` modifier uses `require(msg.sender == campaigns[_id].owner)` to strictly guard administrative functions.

### Events Emitted
*   `CampaignCreated`: Emitted upon creation, broadcasting the owner, ID, title, and category.
*   `CampaignClosed`: Emitted when closed.
*   `DonateReceived`: Logs the ID, donator address, and the amount donated.
*   `Withdrawal`: Logs successful owner withdrawals.
*   `RefundClaimed`: Logs when a donor successfully reclaims capital.
These events act as a low-cost decentralized logging system that the frontend Next.js application can actively listen to in order to update the UI efficiently.

### Deployment & Category Handling
The new `category` field accepts strings natively and is stored directly on-chain within the struct memory.
The contract was successfully compiled and deployed to the Sepolia testnet using Hardhat. A deployment script `deploy.js` fetches the contract factory and broadcasts the transaction using an Alchemy RPC URL resulting in a publicly accessible deployed contract address, which is then mapped into the Next.js `NEXT_PUBLIC_CONTRACT_ADDRESS` environment variable.

---

## SECTION 3 — Frontend Changes and Features

### Homepage (`/`)
The main entry point of the dApp.
*   **Appearance**: Features a high-end "Particle Canvas" hero section with a dark mode glassmorphism theme, soft glowing gradients (emerald, violet), and an Ethereum badge.
*   **Features**: Displays an aggregate stats banner showing total campaigns active, total ETH raised, and total donor participation. It includes a dynamic, horizontal filtering grid using interactive category pills (Tech, Health, Education, Environment, Community) and a dedicated "Top Campaign" featured card.
*   **Data Read**: Fetches the complete list of campaigns using the Next.js API layer `/api/campaigns` and aggregate data from `/api/total`.
*   **Transactions**: Does not originate transactions, but triggers navigation.

### Campaign Detail Page (`/campaigns/[id]`)
*   **Appearance**: A split-panel view. The left side displays the campaign cover image, dynamic status badges, the campaign's creator information (wallet address), a long-form description, and a "Top Donors Leaderboard" decorated with medal emojis (🥇, 🥈, 🥉). The sticky right panel serves as the active transactional interface.
*   **Features**: Includes a visual progress bar (which dynamically glows emerald, violet, or red depending on the campaign's status), a countdown timer, a numeric breakdown of funds, and a conditional donate panel.
*   **Data Read**: Checks active wallet state from React Context and loads target, generated amounts, and the extensive donator history array.
*   **Transactions**: 
    1.  **Donate**: Accepts an ETH amount and triggers `contract.donate()`.
    2.  **Withdraw**: Presented only securely to the campaign `owner` to trigger `contract.withdraw()`.
    3.  **Claim Refund**: Specifically displayed when a campaign expires below its target. Triggers `contract.claimRefund()`.

### Create Campaign Page (`/create`)
*   **Appearance**: A centralized, glass-paneled form with floating neon ambient background blobs.
*   **Features**: Includes inputs for Campaign Title, a Category dropdown, Story/Description text area, Target funding goal in ETH, a deadline date picker, and an integrated native image upload selector (replacing manual URL entry). A highly notable feature is the inline fiat converter; as a user types an ETH target, it instantly previews the estimated GBP (£) equivalent to aid conceptualization.
*   **Transactions**: Upon submission, the app first intercepts the image file and POSTs it to a local Next.js `/api/upload` endpoint to generate and save a static repository URL. It then signs the transaction through MetaMask and dispatches `contract.createCampaign()`.

### Search Results Page (`/search`)
*   **Appearance**: Clean results list view displaying items filtered via search logic.
*   **Features**: Prioritizes exact phrase matches across both titles and descriptions first, before falling back on string tokenization to find partial matches across secondary campaigns. Prompts an engaging empty state layout if naught is found.

### Profile/Account Page (`/account`)
*   **Features**: Displays the user's specific past interactions, including past campaign creations and withdrawal portals for managing personal active campaigns.

---

## SECTION 4 — Features Added (vs original OSS repo)

The original open source framework was substantially upgraded to professional standards. The newly integrated features include:

*   **Progress bar**: Visually calculated as `(collectedAmount / target) * 100`. It dynamically changes its CSS color class—glowing green when "Active", violet when successfully "Funded", and red when "Expired".
*   **Live countdown timer**: Analyzes Unix timestamps against the current clock to calculate days remaining. When zero is crossed, it immediately locks interactions and updates the UI status to "Ended". Future enhancements target granular HH:MM:SS outputs.
*   **ETH to GBP conversion**: Added intelligently to the Create panel. Calculated using an indexed conversion rate (e.g., Target * 2800) and formatted dynamically as `currency: "GBP"`.
*   **Local Image Upload API**: Replaced manual text-based image URL string entry with an integrated Next.js API route (`/api/upload`) utilizing standard `FormData`. Parses and saves actual image files natively to `/public/uploads/` and dynamically links the generated file paths directly to the Solidity contract.
*   **Search functionality**: Resolves search queries in the `/api/campaigns` route, running multi-tiered filters comparing search parameters against campaign strings.
*   **Category filter**: Built a `FilterableGrid` array separating arrays based on tag, supporting values across multiple sectors.
*   **Category field in smart contract**: The smart contract itself was permanently upgraded; the struct now features a `category` parameter enabling strictly validated tracking at the blockchain level.
*   **Refund mechanism**: A critical trust feature. When strict conditions are met (deadline expired + funding failed), the smart contract `claimRefund` securely processes capital return directly mapping arrays. A dynamic "Claim Refund" badge automatically spawns on the UI for users caught in a failed campaign.
*   **Toast notifications**: Replaced silent fails with the `react-toastify` library to give real-time pop-ups declaring "Donation Successful!" or highlighting exact validation errors.
*   **Stats banner**: Aggregates all smart contract data iteratively into a single hero-component view for global platform transparency.
*   **Status badges**: Conditional logic flags campaigns as Active, Funded, or Expired with unique coloring.
*   **Donor leaderboard**: Intercepts the raw donations array, sorts purely by monetary volume contributed (`b.amount - a.amount`), slices the top 3 spots, and creates an automated podium UI (🥇, 🥈, 🥉).
*   **Wallet guard on campaign detail**: Silently interrupts active inputs if a wallet is disconnected, redirecting toward MetaMask authentication before processing.
*   **Unique donor deduplication**: Iterates through donations utilizing javascript `Set()` architecture to extract explicitly unique wallet addresses rather than counting total transaction spam.
*   **Data refresh after transaction**: Context providers were wired to securely command a manual API refetch and UI rehydration block immediately following a mined `tx.wait()` resolution.

---

## SECTION 5 — Bugs Fixed

A heavily audited list of critical structural issues was permanently resolved:

### BUG-02: Deadline check missing in `donate()`
*   **The Bug**: The `donate()` fallback completely ignored campaign deadlines, allowing infinite ETH extraction permanently.
*   **Why it was a problem**: Users donating essentially burned funds as they donated to already failed/abandoned contracts.
*   **The Fix**: Implemented a core `require(block.timestamp < campaign.deadline)` directive inside the localized state.
*   **File Changed**: `smart-contract/contracts/CrowdFunding.sol`

### BUG-11 + BUG-12: Milliseconds vs Seconds Logic Error
*   **The Bug**: Discrepancies routing unix timestamps between Javascript (milliseconds) and Solidity (seconds).
*   **Why it was a problem**: Deadlines were evaluated vastly incorrectly on chain resulting in 30,000-year expiration spans.
*   **The Fix**: Configured exact explicit Math.floor operations rounding date timeframes using `new Date(deadline).getTime() / 1000`.
*   **File Changed**: `client/src/app/create/page.jsx` & `utils/getDaysLeft.js`

### BUG-04: Hard Refresh Crash
*   **The Bug**: Users refreshing directly on a campaign page received immediate crashes or silent forced redirects.
*   **Why it was a problem**: Campaign URLs could not be shared across social media or linked to directly.
*   **The Fix**: Refactored the context routing dependency from `[title]` based lookup to permanent explicit Next.js parameter fetching resolving data safely.
*   **File Changed**: `client/src/app/campaigns/[id]/page.jsx`

### BUG-01: BrowserProvider wrong argument
*   **The Bug**: Connecting MetaMask produced terminal errors.
*   **Why it was a problem**: Migration to `ethers` version 6 completely halted the dApp from running.
*   **The Fix**: Syntax overhaul updating exact library parameters utilizing `new ethers.BrowserProvider(window.ethereum)`.
*   **File Changed**: `client/src/contexts/EthersContext.jsx`

### BUG-06: Conflicting campaign creation paths
*   **The Bug**: API route silently dropped the `category` string.
*   **Why it was a problem**: Campaigns created externally lacked essential categorization causing fatal grid anomalies.
*   **The Fix**: Deserialized the category input locally and wired it as the 4th explicit sequence arg within the POST node route.
*   **File Changed**: `client/src/app/api/campaigns/route.js`

### Gap Fixes
*   **Gap 1 (Wallet Guard):** Added explicit condition checks disabling components when disconnected.
*   **Gap 2 (Unique Donors):** Implemented programmatic `Set` filtering resolving inflated donor metric spam.
*   **Gap 3 (Hard Cap):** Sliced absolute layout bounds allowing extensive visual grids on the frontend filtering logic.
*   **Gap 4 (Data Refresh):** Fired asynchronous updates appending precise `selectedCampaign` context hooks post action resolutions updating live stats.
*   **Gap 6 (URL Slug):** Migrated file structures dynamically to `/campaigns/[id]/page.jsx` utilizing explicit blockchain integers to uniquely locate components and prevent collision.

---

## SECTION 6 — Blockchain Interaction Explained

*   **How MetaMask connects to the app:** When a user clicks "Connect Wallet," the Next.js frontend calls `window.ethereum.request({ method: "eth_requestAccounts" })`. This triggers MetaMask to pop up and ask the user for permission to link their account. Once approved, the dApp has access to the user's public address and can ask them to sign future transactions.
*   **How Ethers.js operates:** Ethers.js translates standard Javascript commands into dense hexadecimal remote procedure calls (RPC). Using `ethers.BrowserProvider`, it reads the user's active wallet state. Using `ethers.Contract`, it loads the `CrowdFunding.sol` ABI (Application Binary Interface) allowing javascript functions identical to the solidity endpoints to be called manually.
*   **Creating a campaign (Step-by-step):** The user enters parameters -> Next.js converts the goal to Wei using `ethers.parseUnits` and formats timestamps -> MetaMask pops up asking to submit the `createCampaign` transaction -> User pays the gas fee -> Block is validated by Sepolia miners -> `CampaignCreated` event fires -> Next.js routes the user home.
*   **Donating (Step-by-step):** User enters an ETH amount on a campaign page -> Next.js packages the value as explicit message payload -> `donate(id)` is sent -> Smart Contract authenticates deadline requirements -> Value is securely locked inside contract treasury -> Frontend awaits the confirmation blocks and triggers a Toast notification.
*   **Claiming a Refund:** Donor connects wallet -> Selects failed campaign -> Clicks Refund -> Smart Contract sweeps internal Donation Arrays validating `msg.sender` against previously logged variables -> Contract triggers `transfer()` returning the ETH.
*   **Gas fees & Sepolia:** "Gas" represents the computational workload fee required to modify the Ethereum database. Because this dapp is deployed to the "Sepolia Testnet", the ETH utilized represents monopoly money available freely via online "faucets," meaning all backend interactions are identical to production but financially free to test.
*   **Etherscan Verification:** The master contract address can be indexed inside Sepolia Etherscan, allowing anybody to visually trace the raw hexadecimal creation strings, active ETH balance of the central treasury, and the exact timestamps of all platform donations transparently.

---

## SECTION 7 — Code Quality

The repository implements strict code discipline enabling scale:
*   **ESLint Configuration**: Governed closely by `eslint-config-next` managing hooks, import orders, and core functional dependency requirements.
*   **Commit Structuring**: Project logging is direct and technical. The latest commits include:
    1.  `b270f07 (HEAD -> main, origin/main)`: **improve UI** (Detailing the core frontend redesign shift).
    2.  `bd49b44`: **fixed conflit error** (Managing git branching discrepancies).
    3.  `73f3ed3`: **first commit** (The inaugural application baseline).

---

## SECTION 8 — Installation Guide

Follow these exact steps to run the dApp locally:

### 1. Prerequisites
Ensure you have installed:
*   Node.js (v18 and above recommended)
*   MetaMask Browser Extension (configured to Sepolia Network)
*   A free API key from Alchemy (operating as an Ethereum Node RPC)

### 2. Clone the Repository
Open a terminal and download the exact codebase:
```bash
git clone https://github.com/ahmedsemih/CrowdFunding-dApp.git
cd CrowdFunding-dApp
```

### 3. Install Dependencies
Run parallel installations establishing packages for both architectures:
```bash
cd client
npm install
cd ..
cd smart-contract
npm install
```

### 4. Set up Environment Variables
In the `/client` directory, create a `.env` file:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_PROVIDER_URL=YOUR_ALCHEMY_RPC_URL
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
```
In the `/smart-contract` directory, create a `.env` file:
```env
ACCOUNT_PRIVATE_KEY=YOUR_METAMASK_PRIVATE_KEY
PROJECT_ID=YOUR_ALCHEMY_PROJECT_ID
```

### 5. Deploy the Smart Contract
While inside the `/smart-contract` trajectory, establish the decentralized limits:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```
*Copy the returned hex address output into your Client environment variables (NEXT_PUBLIC_CONTRACT_ADDRESS).*

### 6. Run the Frontend
Navigate back to the `/client` directory and boot the local Next.js server instance:
```bash
npm run dev
```
Open `http://localhost:3000` to interact directly with the dApp.
