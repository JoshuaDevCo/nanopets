"use client";

import { useState, useEffect } from "react";
import {
  Pizza,
  Gamepad2,
  Droplets,
  Sun,
  Pill,
  VolumeX,
  BarChart2,
  Coins,
  Wallet,
  Youtube,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import Egg from "../../public/egg1.gif";

const babyPets = ["/baby1.gif"];

const mockLeaderboard = [
  { username: "TamaKing", coins: 1000 },
  { username: "PetMaster", coins: 850 },
  { username: "EggHatcher", coins: 720 },
  { username: "PixelPet", coins: 650 },
  { username: "VirtualFriend", coins: 600 },
];

export default function TamagotchiGame() {
  const [hunger, setHunger] = useState(50);
  const [happiness, setHappiness] = useState(50);
  const [health, setHealth] = useState(100);
  const [discipline, setDiscipline] = useState(50);
  const [age, setAge] = useState(0);
  const [light, setLight] = useState(true);
  const [poop, setPoop] = useState(0);
  const [isCrying, setIsCrying] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [coins, setCoins] = useState(0);
  const [hatchProgress, setHatchProgress] = useState(0);
  const [isHatched, setIsHatched] = useState(false);
  const [pet, setPet] = useState(Egg);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [username, setUsername] = useState("TamaLover");
  const [gameStarted, setGameStarted] = useState(false);
  const [showHatchedScreen, setShowHatchedScreen] = useState(false);
  const [startScreenVisible, setStartScreenVisible] = useState(true);
  const [hatchedScreenVisible, setHatchedScreenVisible] = useState(false);

  useEffect(() => {
    if (startScreenVisible) {
      const timer = setTimeout(() => {
        setStartScreenVisible(false);
        setGameStarted(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [startScreenVisible]);

  useEffect(() => {
    if (showHatchedScreen) {
      setHatchedScreenVisible(true);
      const timer = setTimeout(() => {
        setHatchedScreenVisible(false);
        setShowHatchedScreen(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showHatchedScreen]);

  useEffect(() => {
    if (!isHatched) return;

    const timer = setInterval(() => {
      setHunger((prev) => Math.max(0, prev - 1));
      setHappiness((prev) => Math.max(0, prev - 1));
      setHealth((prev) => Math.max(0, prev - 0.5));
      setAge((prev) => prev + 1);
      setPoop((prev) => Math.min(5, prev + 0.2));
      if (Math.random() < 0.05) setIsCrying(true);
    }, 3000);

    return () => clearInterval(timer);
  }, [isHatched]);

  const hatchEgg = () => {
    if (isHatched) return;
    setHatchProgress((prev) => {
      const newProgress = prev + 1;
      if (newProgress >= 10) {
        setIsHatched(true);
        setPet(babyPets[Math.floor(Math.random() * babyPets.length)]);
        setShowHatchedScreen(true);
      }
      return newProgress;
    });
    setCoins((prev) => prev + 10);
    setShowCoinAnimation(true);
    setTimeout(() => setShowCoinAnimation(false), 1000);
  };

  const feed = () => {
    setHunger((prev) => Math.min(100, prev + 20));
    setPoop((prev) => Math.min(5, prev + 1));
  };
  const play = () => setHappiness((prev) => Math.min(100, prev + 20));
  const clean = () => setPoop(0);
  const toggleLight = () => setLight((prev) => !prev);
  const giveMedicine = () => setHealth((prev) => Math.min(100, prev + 30));
  const disciplineIt = () => {
    setIsCrying(false);
    setDiscipline((prev) => Math.min(100, prev + 20));
  };
  const toggleStats = () => {
    setShowStats((prev) => !prev);
    setShowWallet(false);
  };
  const toggleWallet = () => {
    setShowWallet((prev) => !prev);
    setShowStats(false);
  };

  const watchVideo = () => {
    setTimeout(() => {
      setCoins((prev) => prev + 50);
      alert("You earned 50 coins for watching the video!");
    }, 3000);
  };

  const followOnTwitter = () => {
    setCoins((prev) => prev + 100);
    alert("You earned 100 coins for following on Twitter!");
  };

  const isDisabled = !isHatched || showStats || showWallet;

  if (startScreenVisible) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-white animate-fade-out'>
        <h1 className='text-3xl font-bold mb-3 text-center'>
          Welcome to Tonago `
        </h1>
        <p className='font-bold'>Click on your egg to hatch</p>
      </div>
    );
  }

  if (hatchedScreenVisible) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-white animate-fade-in-out'>
        <h1 className='text-2xl font-bold mb-8 text-center'>
          Your Tamagotchi has hatched!
        </h1>
        <p className='font-bold'>Take good care and reap rewards</p>
      </div>
    );
  }

  return (
    <div>
      <div className='w-full max-w-md flex flex-col min-h-screen justify-between bg-blue-50 animate-fade-in'>
        {/* Top Buttons  */}
        <div className='grid grid-cols-4 gap-4 p-2'>
          <Button
            onClick={feed}
            icon={<Pizza className='w-6 h-6' />}
            disabled={isDisabled}
          />
          <Button
            onClick={toggleLight}
            icon={<Sun className='w-6 h-6' />}
            disabled={isDisabled}
          />
          <Button
            onClick={play}
            icon={<Gamepad2 className='w-6 h-6' />}
            disabled={isDisabled}
          />
          <Button
            onClick={giveMedicine}
            icon={<Pill className='w-6 h-6' />}
            disabled={isDisabled}
          />
        </div>

        {/* Game Screen  */}
        <div
          className={`flex-grow border border-gray-600 flex flex-col items-center justify-center relative ${
            light ? "bg-white" : "bg-gray-800"
          }`}
        >
          <div className='absolute top-2 left-2 flex items-center text-sm'>
            <span className='font-bold'>Age:</span> {age} days
          </div>
          <div className='absolute top-2 right-2 flex items-center'>
            <Coins className='w-4 h-4 mr-1' />
            <span className='text-sm font-bold'>{coins}</span>
          </div>
          {showStats ? (
            <div className='w-full p-4'>
              <h2 className='text-xl font-bold mb-4'>Stats</h2>
              <div className='grid grid-cols-2 gap-4 mb-4'>
                <Stat value={hunger} label='Hunger' />
                <Stat value={happiness} label='Happiness' />
                <Stat value={health} label='Health' />
                <Stat value={discipline} label='Discipline' />
              </div>
              <h3 className='text-lg font-bold mb-2'>Leaderboard</h3>
              <ul className='space-y-2'>
                {mockLeaderboard.map((player, index) => (
                  <li key={index} className='flex justify-between items-center'>
                    <span>{player.username}</span>
                    <span>{player.coins} 🪙</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : showWallet ? (
            <div className='w-full p-4'>
              <h2 className='text-xl font-bold mb-4'>Wallet</h2>
              <p className='mb-2'>
                <strong>Username:</strong> {username}
              </p>
              <p className='mb-4'>
                <strong>Balance:</strong> {coins} 🪙
              </p>
              <h3 className='text-lg font-bold mb-2'>Earn Bonus Coins</h3>
              <button
                onClick={watchVideo}
                className='bg-red-500 text-white px-4 py-2 rounded mb-2 flex items-center'
              >
                <Youtube className='mr-2' /> Watch Video (+50 coins)
              </button>
              <button
                onClick={followOnTwitter}
                className='bg-blue-400 text-white px-4 py-2 rounded flex items-center'
              >
                <Twitter className='mr-2' /> Follow on X (+100 coins)
              </button>
            </div>
          ) : (
            <div className='relative cursor-pointer' onClick={hatchEgg}>
              <Image src={pet} alt='pet' width={200} height={200} />
              {!isHatched && (
                <div className='absolute bottom-0 left-0 right-0 h-2 bg-gray-200'>
                  <div
                    className='h-full bg-green-500'
                    style={{ width: `${hatchProgress * 10}%` }}
                  ></div>
                </div>
              )}
              {poop > 0 && (
                <div className='absolute bottom-0 right-0 text-2xl'>
                  {"💩".repeat(Math.floor(poop))}
                </div>
              )}
              {isCrying && (
                <div className='absolute top-0 left-0 text-xl'>😢</div>
              )}
              {showCoinAnimation && (
                <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl animate-bounce'>
                  +10 🪙
                </div>
              )}
            </div>
          )}
        </div>

        <div className='grid grid-cols-4 gap-4 p-2'>
          <Button
            onClick={clean}
            icon={<Droplets className='w-6 h-6' />}
            disabled={isDisabled}
          />
          <Button
            onClick={disciplineIt}
            icon={<VolumeX className='w-6 h-6' />}
            disabled={isDisabled}
          />
          <Button
            onClick={toggleStats}
            icon={<BarChart2 className='w-6 h-6' />}
            disabled={!isHatched}
          />
          <Button
            onClick={toggleWallet}
            icon={<Wallet className='w-6 h-6' />}
            disabled={!isHatched}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className='flex flex-col items-center'>
      <div className='mt-1 h-2 w-full bg-gray-200 rounded-full'>
        <div
          className='h-2 bg-blue-500 rounded-full'
          style={{ width: `${value}%` }}
        ></div>
      </div>
      <span className='text-xs mt-1'>{label}</span>
    </div>
  );
}

function Button({ onClick, icon, disabled }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 duration-200 flex justify-center ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-100"
      }`}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}
