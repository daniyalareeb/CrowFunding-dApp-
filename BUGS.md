# 🐛 Bug Tracker — CrowdFunding dApp

> Last updated: 2026-04-19
> Status labels: 🔴 Critical · 🟡 Major · 🟢 Minor

---

## 🔴 Critical Bugs

### BUG-001 — Campaign Detail page silently crashes on direct URL load
**File:** `client/src/app/campaigns/[title]/page.jsx` · Line 24  
**Severity:** Critical  
**Description:**  
When a user navigates directly to `/campaigns/<slug>` (e.g. via a shared link or browser refresh), `selectedCampaign` is `null` because it lives only in React context (not persisted). The page calls `router.back()` immediately without showing the user any explanation.

```js
// Current — silently navigates away
useEffect(() => {
  if (campaign === null) return router.back();
  ...
}, [campaign, router]);
```

**Impact:** Shared campaign links are completely broken. Any page refresh loses the campaign data.  
**Fix:** Replace the silent `router.back()` with a "Connect wallet / reload" prompt, and/or fetch the campaign by ID from the API when context is empty.

---

### BUG-002 — Campaign title used as a non-unique URL slug
**File:** `client/src/components/Card.jsx` · Line 67  
**Severity:** Critical  
**Description:**  
The campaign detail URL is built by slugifying the campaign title:

```js
router.push(`/campaigns/${campaign.title.replace(/\s/g, "-").toLowerCase()}`);
```

If two campaigns share the same (or similar) title, the URL collides and users can end up on the wrong campaign detail page. There is no ID disambiguation.

**Fix:** Use the campaign `id` in the URL — e.g. `/campaigns/${campaign.id}` or `/campaigns/${campaign.id}-${slug}`.

---

### BUG-003 — Smart contract `donate()` has no deadline check
**File:** `smart-contract/contracts/CrowdFunding.sol` · Line 91–99  
**Severity:** Critical  
**Description:**  
The `donate` function accepts ETH transfers even after the campaign deadline has passed. A donor who donates to an expired/failed campaign would be eligible for a refund only if `collectedAmount < target` — but if the campaign is already over its target, the funds are locked with no recourse.

```solidity
function donate(uint256 _id) public payable {
    // No deadline check here ❌
    Campaign storage campaign = campaigns[_id];
    campaign.donations.push(Donation(msg.sender, msg.value));
    ...
}
```

**Fix:** Add `require(block.timestamp <= campaign.deadline, "Campaign has ended.");` at the top of `donate()`.

---

### BUG-004 — `closeCampaign` API route swallows errors silently
**File:** `client/src/app/api/campaigns/[id]/route.js` · Line 16  
**Severity:** Critical  
**Description:**  
In the `PUT` handler's catch block, the `NextResponse.json(...)` call is not `return`ed. The function exits without sending any response to the client, causing the request to hang.

```js
// Current — missing return ❌
} catch (error) {
  NextResponse.json({}, { status: 500, statusText: "Somethings went wrong." });
}
```

**Fix:** Add `return` before `NextResponse.json(...)`.

---

## 🟡 Major Bugs

### BUG-005 — Stale UI after transaction (no data refresh)
**Files:** `client/src/app/campaigns/[title]/page.jsx`, `client/src/contexts/EthersContext.jsx`  
**Severity:** Major  
**Description:**  
After a successful `donate`, `withdraw`, or `claimRefund` transaction, the campaign data shown on screen is stale. The amounts, progress bar, and donor count do not update until the user manually refreshes the page.

**Fix:** After each successful transaction, re-fetch campaign data from the API and update `selectedCampaign` in context.

---

### BUG-006 — Withdraw on Detail page always withdraws 100% of available funds
**File:** `client/src/app/campaigns/[title]/page.jsx` · Line 50–53  
**Severity:** Major  
**Description:**  
The inline "Withdraw Funds" button calls `handleWithdraw`, which always withdraws the full available amount `(collectedAmount - withdrawedAmount)`. There is no input for a partial amount. The `WithdrawModal` on the Account page supports partial amounts, making these two flows inconsistent.

```js
await contract.withdraw(
  campaign.id,
  ethers.parseEther((campaign.collectedAmount - campaign.withdrawedAmount).toString())
  // Always the max ❌
);
```

**Fix:** Either add an amount input field on the detail page, or reuse the existing `<WithdrawModal>` component.

---

### BUG-007 — Donor count counts transactions, not unique donors
**Files:** `client/src/components/Card.jsx` · Line 141, `client/src/app/campaigns/[title]/page.jsx` · Line 240  
**Severity:** Major  
**Description:**  
`campaign.donations.length` is displayed as the number of donors. However, the same address can donate multiple times, each creating a separate `Donation` entry. A campaign with 3 donations from 1 address shows "3 donors" rather than "1 donor".

**Fix:** De-duplicate by address in the frontend before displaying the count:
```js
const uniqueDonors = new Set(campaign.donations.map(d => d.donator)).size;
```
Or track unique donor addresses separately in the smart contract.

---

### BUG-008 — Homepage campaign list hard-capped at 9
**File:** `client/src/app/page.jsx` · Line 19  
**Severity:** Major  
**Description:**  
Only the top 9 campaigns are fetched and displayed on the homepage. Additional campaigns are inaccessible unless the user navigates to `/campaigns`.

```js
return { campaigns: campaigns.slice(0, 9), donationCount, campaignCount: campaigns.length };
```

The `campaignCount` stat in the hero correctly shows the total number, creating a discrepancy between what is advertised and what is shown.

**Fix:** Implement pagination, a "Load more" button, or infinity scroll instead of the hard cap.

---

### BUG-009 — `POST /api/campaigns` does not pass `category` to the contract
**File:** `client/src/app/api/campaigns/route.js` · Line 47–56  
**Severity:** Major  
**Description:**  
The POST handler destructures `{ title, description, imageUrl, target, deadline }` from the request body and calls `contract.createCampaign(title, description, imageUrl, target, deadline)`. The `category` argument required by the smart contract is silently dropped, so any campaign created via the API route (not directly from the frontend) would have an empty/default category.

```js
// category missing from destructure and contract call ❌
const { title, description, imageUrl, target, deadline } = await req.json();
await contract.createCampaign(title, description, imageUrl, target, deadline, {...});
```

**Fix:** Add `category` to the destructure and pass it as the 4th argument: `createCampaign(title, description, imageUrl, category, target, deadline, ...)`.

---

## 🟢 Minor Bugs

### BUG-010 — ETH/GBP conversion uses a hardcoded exchange rate
**File:** `client/src/app/create/page.jsx` · Line 77  
**Severity:** Minor  
**Description:**  
The fiat preview on the create campaign form multiplies the ETH amount by a hardcoded `2800`:

```js
const gbpValue = (targetParsed * 2800).toLocaleString(...)
```

This rate will become stale immediately and could mislead users significantly.

**Fix:** Replace with a live price fetch from CoinGecko or a similar public API at page load.

---

### BUG-011 — Error responses use `statusText` instead of a JSON body
**Files:** All `route.js` files  
**Severity:** Minor  
**Description:**  
All API error responses return `NextResponse.json({}, { status: 500, statusText: "..." })`. `statusText` is stripped by many HTTP clients and is unreliable. Frontend `fetch` calls do not read it.

**Fix:** Include the error message in the JSON body:
```js
return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
```

---

### BUG-012 — Typo in error message repeated across all routes
**Files:** All `route.js` files  
**Severity:** Minor  
**Description:**  
`"Somethings went wrong."` is a grammatical error present in every API route's catch block.  
**Fix:** Replace with `"Something went wrong."`.

---

*Total bugs: 12 (3 Critical · 5 Major · 4 Minor)*
