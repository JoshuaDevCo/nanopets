"use client";

import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import Image from "next/image";
import Coin from "../svgs/coin.png";
import InviteFriendTask from "./InviteFriendTask";
import TonConnectionMinter from "./TonConnection";

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
  const [isWatchingVideo, setIsWatchingVideo] = useState(false);

  const [nextVideoAvailableTime, setNextVideoAvailableTime] = useState<
    number | null
  >(null);
  const playerRef = useRef<YouTube>(null);

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
        <div className='fixed inset-0 z-50 bg-black flex justify-center items-center '>
          <YouTube
            videoId='Zxjxk9AQHmI' // Quiz no1.
            opts={{
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
              },
              height: window.innerHeight,
              width: window.innerWidth,
            }}
            onEnd={handleVideoEnd}
            className='w-screen h-screen'
            ref={playerRef}
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
                <TonConnectionMinter />
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
