"use client";

import Cookie from "js-cookie";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { createContext, useContext, useEffect, useState } from "react";

import SmartContract from "../../../smart-contract/artifacts/contracts/CrowdFunding.sol/CrowdFunding.json";

const EthersContext = createContext();

export const EthersProvider = ({ children }) => {
  const [signer, setSigner] = useState(null);
  const [loading, setLoading] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    const initEthers = async () => {
      const provider = new ethers.BrowserProvider(
        process.env.NEXT_PUBLIC_PROVIDER_URL
      );
      const contractInstance = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        SmartContract['abi'],
        provider
      );
      
      setProvider(provider);
      setContract(contractInstance);
      Cookie.get("isAllowed") && connectWallet();
    };

    initEthers();
  }, []);

  const connectWallet = async () => {
    setLoading(true);

    if (window.ethereum !== undefined) {
      try {
        // Switch to Sepolia testnet (chainId 11155111 = 0xaa36a7)
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      } catch (switchError) {
        // If Sepolia isn't added yet, add it automatically
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0xaa36a7",
              chainName: "Sepolia",
              rpcUrls: ["https://rpc.sepolia.org"],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          });
        }
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const connectedProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await connectedProvider.getSigner();
      const contractInstance = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        SmartContract['abi'],
        signer
      );

      setSigner(signer);
      setContract(contractInstance);
      Cookie.set("isAllowed", true);
    } else {
      toast.error("Please install Metamask to continue.");
    }

    setLoading(false);
  };


  const disconnectWallet = () => {
    setSigner(null);
    Cookie.remove("isAllowed");
  };

  const values = {
    signer,
    loading,
    contract,
    provider,
    selectedCampaign, 
    connectWallet,
    disconnectWallet,
    setSelectedCampaign,
  };

  return (
    <EthersContext.Provider value={values}>{children}</EthersContext.Provider>
  );
};

export const useEthersContext = () => useContext(EthersContext);
