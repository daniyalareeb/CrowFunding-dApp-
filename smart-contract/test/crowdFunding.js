const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CrowdFunding Contract", () => {
  let CrowdFunding;
  let crowdFunding;
  let owner;
  let donor;
  let campaignId;

  const DEADLINE_OFFSET = 3600; // 1 hour from now

  const createCampaign = async () => {
    const createCampaignTx = await crowdFunding.createCampaign(
      "Campaign Title",
      "Campaign Description",
      "Campaign Image",
      "Technology",
      ethers.parseEther("100"),
      Math.floor(Date.now() / 1000) + DEADLINE_OFFSET
    );

    await createCampaignTx.wait(1);
    return 0;
  };

  beforeEach(async () => {
    [owner, donor] = await ethers.getSigners();
    CrowdFunding = await ethers.getContractFactory("CrowdFunding");
    crowdFunding = await CrowdFunding.deploy();
    await crowdFunding.waitForDeployment();
    campaignId = await createCampaign();
  });

  it("should create a campaign with category", async () => {
    const campaign = await crowdFunding.campaigns(campaignId);
    expect(campaign.owner).to.equal(owner.address);
    expect(campaign.title).to.equal("Campaign Title");
    expect(campaign.description).to.equal("Campaign Description");
    expect(campaign.imageUrl).to.equal("Campaign Image");
    expect(campaign.category).to.equal("Technology");
    expect(campaign.target).to.equal(ethers.parseEther("100"));
    const expectedDeadline = Math.floor(Date.now() / 1000) + DEADLINE_OFFSET;
    expect(campaign.deadline).to.be.within(expectedDeadline - 2, expectedDeadline + 2);
  });

  it("should donate to a campaign", async () => {
    await crowdFunding.connect(donor).donate(campaignId, { value: ethers.parseEther("100") });
    const campaign = await crowdFunding.campaigns(campaignId);
    expect(campaign.collectedAmount).to.equal(ethers.parseEther("100"));
  });

  it("should close a campaign", async () => {
    await crowdFunding.connect(owner).closeCampaign(campaignId);
    const campaign = await crowdFunding.campaigns(campaignId);
    expect(campaign.deadline).to.be.lte(Math.floor(Date.now()));
  });

  it("should withdraw from a campaign", async () => {
    await crowdFunding.connect(donor).donate(campaignId, { value: ethers.parseEther("50") });
    await crowdFunding.connect(owner).withdraw(campaignId, ethers.parseEther("30"));
    const campaign = await crowdFunding.campaigns(campaignId);
    expect(campaign.withdrawedAmount).to.equal(ethers.parseEther("30"));
  });

  it("should get a list of campaigns", async () => {
    await createCampaign();
    const allCampaigns = await crowdFunding.getCampaigns();
    expect(allCampaigns.length).to.equal(2);
    expect(allCampaigns[0].title).to.equal("Campaign Title");
    expect(allCampaigns[1].title).to.equal("Campaign Title");
  });

  it("should get donations for a campaign", async () => {
    await crowdFunding.connect(donor).donate(campaignId, { value: ethers.parseEther("50") });
    await crowdFunding.connect(donor).donate(campaignId, { value: ethers.parseEther("30") });
    const donations = await crowdFunding.getDonations(campaignId);
    expect(donations.length).to.equal(2);
    expect(donations[0].donator).to.equal(donor.address);
    expect(donations[0].amount).to.equal(ethers.parseEther("50"));
    expect(donations[1].amount).to.equal(ethers.parseEther("30"));
  });

  // ─── Refund Tests ────────────────────────────────────────────────────────────

  describe("claimRefund", () => {
    let campaignIdSmallTarget;

    beforeEach(async () => {
      // Use the chain's current block timestamp (not wall-clock) so that
      // evm_increaseTime from earlier tests doesn't invalidate the deadline.
      const latestBlock = await ethers.provider.getBlock("latest");
      const chainNow = latestBlock.timestamp;

      const tx = await crowdFunding.createCampaign(
        "Refundable Campaign",
        "This campaign will fail to meet its goal",
        "image.png",
        "Environment",
        ethers.parseEther("1000"), // very high target — will never be met
        chainNow + 300 // 5-minute window — safe for tx, expires after fast-forward
      );
      await tx.wait(1);
      campaignIdSmallTarget = 1; // second campaign created
    });

    it("should allow donor to claim a refund when goal not met after deadline", async () => {
      // Donate a small amount (well below the 1000 ETH target)
      await crowdFunding.connect(donor).donate(campaignIdSmallTarget, {
        value: ethers.parseEther("1"),
      });

      // Fast-forward time past the deadline
      await ethers.provider.send("evm_increaseTime", [400]);
      await ethers.provider.send("evm_mine");

      const donorBalanceBefore = await ethers.provider.getBalance(donor.address);

      const refundTx = await crowdFunding.connect(donor).claimRefund(campaignIdSmallTarget);
      const receipt = await refundTx.wait(1);
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const donorBalanceAfter = await ethers.provider.getBalance(donor.address);

      // Donor should recover their 1 ETH minus gas
      expect(donorBalanceAfter).to.be.closeTo(
        donorBalanceBefore + ethers.parseEther("1") - gasUsed,
        ethers.parseEther("0.001") // tolerance for rounding
      );
    });

    it("should prevent double-claiming a refund", async () => {
      await crowdFunding.connect(donor).donate(campaignIdSmallTarget, {
        value: ethers.parseEther("1"),
      });

      await ethers.provider.send("evm_increaseTime", [400]);
      await ethers.provider.send("evm_mine");

      // First claim should succeed
      await crowdFunding.connect(donor).claimRefund(campaignIdSmallTarget);

      // Second claim should fail — donations are zeroed out
      await expect(
        crowdFunding.connect(donor).claimRefund(campaignIdSmallTarget)
      ).to.be.revertedWith("No refundable donations found.");
    });

    it("should revert if campaign is still active", async () => {
      // campaignId (0) has a 1-hour deadline — still active
      await crowdFunding.connect(donor).donate(campaignId, {
        value: ethers.parseEther("1"),
      });

      await expect(
        crowdFunding.connect(donor).claimRefund(campaignId)
      ).to.be.revertedWith("Campaign is still active.");
    });

    it("should revert if campaign goal was met", async () => {
      // Donate exactly the target on campaign 0 (100 ETH)
      await crowdFunding.connect(donor).donate(campaignId, {
        value: ethers.parseEther("100"),
      });

      // Close campaign manually to expire it
      await crowdFunding.connect(owner).closeCampaign(campaignId);

      await expect(
        crowdFunding.connect(donor).claimRefund(campaignId)
      ).to.be.revertedWith("Campaign goal was met; no refund available.");
    });

    it("should revert if caller has no donations", async () => {
      await ethers.provider.send("evm_increaseTime", [400]);
      await ethers.provider.send("evm_mine");

      // owner never donated, only donor did (but didn't donate here)
      await expect(
        crowdFunding.connect(owner).claimRefund(campaignIdSmallTarget)
      ).to.be.revertedWith("No refundable donations found.");
    });
  });
});