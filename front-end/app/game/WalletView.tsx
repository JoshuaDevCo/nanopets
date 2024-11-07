"use client";

import { useTonConnectUI } from "@tonconnect/ui-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Address } from "@ton/core";
import YouTube from "react-youtube";
import Image from "next/image";
import Coin from "../svgs/coin.png";

interface WalletViewProps {
  coins: number;

  lastVideoWatchTime: number;
  resetTamagotchi: () => void;
  watchVideo: () => void;
}

export default function WalletView({
  coins,

  lastVideoWatchTime,
  resetTamagotchi,
  watchVideo,
}: WalletViewProps) {
  const [tonConnectUI] = useTonConnectUI();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [nextVideoAvailableTime, setNextVideoAvailableTime] = useState<
    number | null
  >(null);
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

  useEffect(() => {
    const VIDEO_REWARD_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();
    const nextAvailable = lastVideoWatchTime + VIDEO_REWARD_COOLDOWN;

    if (now < nextAvailable) {
      setNextVideoAvailableTime(nextAvailable);
    } else {
      setNextVideoAvailableTime(null);
    }
  }, [lastVideoWatchTime]);

  const handleWatchVideo = async () => {
    setIsWatchingVideo(true);
    setVideoCompleted(false);
  };

  const handleVideoEnd = async () => {
    setVideoCompleted(true);
    try {
      await watchVideo();
      setNextVideoAvailableTime(Date.now() + 24 * 60 * 60 * 1000); // Set next available time to 24 hours from now
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

  const isVideoButtonDisabled =
    nextVideoAvailableTime !== null || isWatchingVideo;

  return (
    <div className='p-4 w-full'>
      <h2 className='text-6xl font-bold mb-4'>Wallet</h2>
      <div className='flex gap-2'>
        <Image className='mr-2' width={20} height={20} alt='coin' src={Coin} />
        <p className='mb-4 text-2xl'>Coins: {coins}</p>
      </div>
      {isLoading ? (
        <>...Loading</>
      ) : (
        <>
          {tonWalletAddress ? (
            <div className='flex flex-col gap-2'>
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

      <div className=' mb-4'>
        <h2 className='text-4xl font-bold mb-4'>Tasks</h2>
        <button
          onClick={handleWatchVideo}
          disabled={isVideoButtonDisabled}
          className='bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50'
        >
          {isWatchingVideo ? (
            "Watching Video..."
          ) : (
            <>
              <div className='flex gap-2'>
                <p>Watch Video +5</p>
                <Image
                  className='mr-2'
                  width={20}
                  height={20}
                  alt='coin'
                  src={Coin}
                />
              </div>
            </>
          )}
        </button>
      </div>

      {nextVideoAvailableTime && (
        <p className='text-yellow-500 mb-4'>
          Next video available in: {formatTimeRemaining(nextVideoAvailableTime)}
        </p>
      )}

      {isWatchingVideo && (
        <div className='mb-4'>
          <YouTube
            videoId='QNXvE1BZu8g' // Example: Rick Astley - Never Gonna Give You Up
            opts={{
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

      <div>
        <button
          onClick={resetTamagotchi}
          className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded'
        >
          Reset Tamagotchi
        </button>
      </div>
    </div>
  );
}
