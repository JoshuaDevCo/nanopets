"use client";

import { useTonConnectUI } from "@tonconnect/ui-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Address } from "@ton/core";
import YouTube from "react-youtube";

interface WalletViewProps {
  coins: number;
  weight: number;
  careMistakes: number;
  resetTamagotchi: () => void;
  watchVideo: () => Promise<{ earnedCoins: number; nextAvailableTime: number }>;
}

export default function WalletView({
  coins,
  weight,
  careMistakes,
  resetTamagotchi,
  watchVideo,
}: WalletViewProps) {
  const [tonConnectUI] = useTonConnectUI();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [nextAvailableTime, setNextAvailableTime] = useState<number | null>(
    null
  );
  const playerRef = useRef<YouTube>(null);

  const handleWalletConnection = useCallback((address: string) => {
    setTonWalletAddress(address);
    console.log("Wallet connected successfully!");
    setIsLoading(false);
  }, []);

  const handleWalletDisconnection = useCallback(() => {
    setTonWalletAddress(null);
    console.log("Wallet disconnected successfully!");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (tonConnectUI.account?.address) {
        handleWalletConnection(tonConnectUI.account?.address);
      } else {
        handleWalletDisconnection();
      }
    };

    checkWalletConnection();

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        handleWalletConnection(wallet.account.address);
      } else {
        handleWalletDisconnection();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI, handleWalletConnection, handleWalletDisconnection]);

  const handleWalletAction = async () => {
    if (tonConnectUI.connected) {
      setIsLoading(true);
      await tonConnectUI.disconnect();
    } else {
      await tonConnectUI.openModal();
    }
  };

  const formatAddress = (address: string) => {
    const tempAddress = Address.parse(address).toString();
    return `${tempAddress.slice(0, 4)}...${tempAddress.slice(-4)}`;
  };

  const handleWatchVideo = async () => {
    setIsWatchingVideo(true);
    setVideoCompleted(false);
  };

  const handleVideoEnd = async () => {
    setVideoCompleted(true);
    try {
      const { earnedCoins, nextAvailableTime } = await watchVideo();
      setNextAvailableTime(nextAvailableTime);
      alert(
        `You earned ${earnedCoins} coins! You can watch another video in 24 hours.`
      );
    } catch (error) {
      console.error("Error watching video:", error);
      alert("Failed to process video reward. Please try again.");
    } finally {
      setIsWatchingVideo(false);
    }
  };

  const formatTimeRemaining = (nextAvailableTime: number) => {
    const now = Date.now();
    const remainingTime = Math.max(0, nextAvailableTime - now);
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor(
      (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
    );
    return `${hours}h ${minutes}m`;
  };

  const isVideoAvailable =
    !nextAvailableTime || Date.now() >= nextAvailableTime;

  return (
    <div className='p-4 w-full'>
      <h2 className='text-6xl font-bold mb-4'>Wallet</h2>
      {isLoading ? (
        <>...Loading</>
      ) : (
        <>
          {tonWalletAddress ? (
            <div className='flex flex-col items-center'>
              <p className='mb-4'>
                Connected: {formatAddress(tonWalletAddress)}
              </p>
              <button
                onClick={handleWalletAction}
                className='bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded'
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <button
              onClick={handleWalletAction}
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
            >
              Connect TON Wallet
            </button>
          )}
        </>
      )}

      <p className='mb-4 text-2xl'>Coins: {coins}</p>
      <div className='flex gap-2 mb-4'>
        <button
          onClick={handleWatchVideo}
          disabled={isWatchingVideo || !isVideoAvailable}
          className='bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50'
        >
          {isWatchingVideo ? "Watching Video..." : "Watch Video for Coins"}
        </button>
        <button
          onClick={resetTamagotchi}
          className='bg-red-500 hover:bg-red-600 text-white'
        >
          Reset Tamagotchi
        </button>
      </div>
      {!isVideoAvailable && nextAvailableTime && (
        <p className='text-yellow-500 mb-4'>
          Next video available in: {formatTimeRemaining(nextAvailableTime)}
        </p>
      )}
      {isWatchingVideo && (
        <div className='mb-4'>
          <YouTube
            videoId='dQw4w9WgXcQ' // Example: Rick Astley - Never Gonna Give You Up
            opts={{
              height: "390",
              width: "640",
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
              },
            }}
            onEnd={handleVideoEnd}
            ref={playerRef}
          />
          {videoCompleted && (
            <p className='text-green-500 mt-2'>
              Video completed! Coins added to your wallet.
            </p>
          )}
        </div>
      )}
      <h2 className='text-4xl font-bold my-4'>Stats</h2>
      <p className='text-lg'>Weight: {weight}</p>
      <p className='text-lg'>Care Mistakes: {careMistakes}</p>
    </div>
  );
}
