"use client";

import { useTonConnectUI } from "@tonconnect/ui-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Address } from "@ton/core";
import YouTube from "react-youtube";
import Image from "next/image";
import Coin from "../svgs/coin.png";
import InviteFriendTask from "./InviteFriendTask";

interface WalletViewProps {
  coins: number;
  userId: any;
  lastVideoWatchTime: number;
  referralCount: number;
  resetTamagotchi: () => void;
  watchVideo: () => void;
}

export default function WalletView({
  coins,
  userId,
  lastVideoWatchTime,
  referralCount,
  resetTamagotchi,
  watchVideo,
}: WalletViewProps) {
  const [tonConnectUI] = useTonConnectUI();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);

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
  };

  const handleVideoEnd = async () => {
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
    <>
      {isWatchingVideo ? (
        <div className='absolute w-screen h-screen bg-black flex justify-center items-center'>
          <YouTube
            videoId='QNXvE1BZu8g' // Example: Rick Astley - Never Gonna Give You Up
            opts={{
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 1,
              },
            }}
            onEnd={handleVideoEnd}
            ref={playerRef}
            className='w-full'
          />
        </div>
      ) : (
        <div className='p-4 w-full'>
          <h2 className='text-6xl font-bold mb-2'>Wallet</h2>
          <div className='flex justify-between items-center mb-2'>
            <div className='flex gap-2 items-start'>
              <Image
                className='mr-2 aspect-square'
                width={30}
                height={25}
                alt='coin'
                src={Coin}
              />
              <p className='text-2xl'>Coins: {coins}</p>
            </div>
            <div>
              <button
                onClick={() =>
                  alert("NEED AEON API KEY TO INTEGRATE THIS HERE")
                }
                className='bg-green-500  text-white font-bold py-2 px-4 '
              >
                <div className='flex gap-2'>
                  <p className='text-xl'>Buy Coins</p>
                </div>
              </button>
            </div>
          </div>
          {isLoading ? (
            <>...Loading</>
          ) : (
            <>
              {tonWalletAddress ? (
                <div className='flex flex-col'>
                  <button
                    onClick={handleWalletAction}
                    className='bg-red-500  text-white font-bold py-2 px-4 '
                  >
                    Disconnect {formatAddress(tonWalletAddress)}
                  </button>
                  <p className='text-green-500'>
                    Your are currently eligible for $KODO Season 1.
                  </p>
                </div>
              ) : (
                <div className='flex flex-col'>
                  <button
                    onClick={handleWalletAction}
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 '
                  >
                    Connect TON Wallet For Airdrop Season 1
                  </button>
                </div>
              )}
            </>
          )}

          <div className='flex flex-col mb-4 mt-3'>
            <h2 className='text-4xl font-bold mb-2'>Tasks</h2>
            <button
              onClick={handleWatchVideo}
              disabled={isVideoButtonDisabled}
              className='bg-green-500  text-white font-bold py-2 px-4  disabled:opacity-50 flex justify-center'
            >
              {isWatchingVideo ? (
                "Watching Video..."
              ) : (
                <div className='flex gap-2'>
                  <p>Watch Video +10</p>
                  <Image
                    className='mr-2 aspect-square'
                    width={25}
                    height={25}
                    alt='coin'
                    src={Coin}
                  />
                </div>
              )}
            </button>
            {nextVideoAvailableTime && (
              <p className=' '>
                Next video available in:{" "}
                {formatTimeRemaining(nextVideoAvailableTime)}
              </p>
            )}
          </div>

          <InviteFriendTask userId={userId} />
          <p>Your have referred: {referralCount} people.</p>

          <div className='flex flex-col my-2 '>
            <button
              onClick={resetTamagotchi}
              className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 '
            >
              Reset Kodomochi
            </button>
            <p className=' mb-4'>RESETTING KODOMOCHI COSTS 10 COINS</p>
          </div>
        </div>
      )}
    </>
  );
}
