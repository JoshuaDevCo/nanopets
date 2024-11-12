// components/MintSBT.tsx

"use client";

import { useState, useEffect } from "react";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import { Address, beginCell, toNano } from "@ton/core";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { TonClient } from "@ton/ton";
import { NftCollection } from "@/utils/NftCollection/tact_NftCollection";
import { Account } from "@tonconnect/sdk";

// This is your SBT collection address
const SBT_CONTRACT_ADDRESS = "EQABJOutwO97Aj6-xod1sJ9Kg1uf9l8AA9nXpABxxJjS-5MH";

interface CollectionMetadata {
  name: string;
  description: string;
  image: string;
}

function isConnectedAccount(account: Account | null): account is Account {
  return account !== null;
}

export default function TonConnectionMinter() {
  const [tonConnectUI] = useTonConnectUI();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metadata, setMetadata] = useState<CollectionMetadata | null>(null);
  const [mintPrice, setMintPrice] = useState<string>("0");

  // Function to decode metadata Cell
  function decodeCell(cell: any): string {
    let slice = cell.beginParse();
    slice.loadUint(8); // Skip the first byte
    return slice.loadStringTail();
  }

  // Add connection status tracking
  useEffect(() => {
    if (!tonConnectUI) return;

    // Subscribe to connection status changes
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      console.log("Connection status changed:", !!wallet);
      setIsConnected(!!wallet);
    });

    // Initial status check
    setIsConnected(!!tonConnectUI.account);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [tonConnectUI]);

  // Fetch metadata from IPFS
  async function fetchMetadata(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      return await response.json();
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return null;
    }
  }

  // Load collection data
  useEffect(() => {
    async function loadCollectionData() {
      try {
        setIsLoading(true);

        // Initialize TON client
        const endpoint = await getHttpEndpoint({ network: "mainnet" });
        const client = new TonClient({ endpoint });

        // Create contract instance
        const address = Address.parse(SBT_CONTRACT_ADDRESS);
        const contract = NftCollection.fromAddress(address);
        const openedContract = client.open(contract);

        // Get collection data and price
        const [collectionData, price] = await Promise.all([
          openedContract.getGetCollectionData(),
          1,
        ]);

        // Get metadata URL and fetch metadata
        const metadataUrl = decodeCell(collectionData.collection_content);
        const collectionMetadata = await fetchMetadata(metadataUrl);

        setMetadata(collectionMetadata);
        setMintPrice(price.toString());
      } catch (error) {
        console.error("Error loading collection data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCollectionData();
  }, []);

  // Handle minting process
  const handleMint = async () => {
    if (!isConnected || !isConnectedAccount(tonConnectUI.account)) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);

      const nftCollectionAddress = Address.parse(SBT_CONTRACT_ADDRESS);
      const mintCost = BigInt(mintPrice) + BigInt(toNano("0.05")); // Adding gas fees

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [
          {
            address: nftCollectionAddress.toString(),
            amount: mintCost.toString(),
            payload: beginCell()
              .storeUint(0, 32)
              .storeStringTail("Mint")
              .endCell()
              .toBoc()
              .toString("base64"),
          },
        ],
      });

      alert("Minting transaction sent successfully!");
    } catch (error) {
      console.error("Error minting:", error);
      alert("Error minting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !metadata) {
    return (
      <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
        <div className='animate-spin  h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
        <p className='text-white'>Error loading collection data</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center p-4'>
      <div className='bg-gray-800  p-8 max-w-md w-full'>
        <div className='mb-6'>
          <TonConnectButton />
        </div>
        <div className='flex flex-col items-center'>
          <img
            src={metadata.image}
            alt={metadata.name}
            className='w-32 h-32  mb-6 object-cover'
          />

          <h1 className='text-2xl font-bold text-white mb-2'>
            {metadata.name}
          </h1>

          <p className='text-gray-400 text-center mb-6'>
            {metadata.description}
          </p>

          <p className='text-white mb-6'>
            Price: {(Number(mintPrice) / 1e9).toFixed(2)} TON
          </p>

          <button
            onClick={handleMint}
            disabled={isLoading || !isConnected}
            className={`w-full py-3 px-6  font-semibold text-white 
                            ${
                              isConnected
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-gray-600"
                            } 
                            transition-colors disabled:opacity-50`}
          >
            {isLoading
              ? "Minting..."
              : isConnected
              ? "Mint SBT"
              : "Connect Wallet First"}
          </button>
        </div>
      </div>
    </div>
  );
}
