"use client";

import { useState, useEffect } from "react";
import {
  Pizza,
  Gamepad2,
  Droplets,
  Sun,
  Pill,
  VolumeX,
  Trophy,
  Coins,
  Wallet,
  ArrowLeft,
  Candy,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import { io, Socket } from "socket.io-client";

const babyPets = ["/baby1.gif"];

interface Tamagotchi {
  userId: string;
  hunger: number;
  happiness: number;
  discipline: number;
  age: number;
  weight: number;
  poop: number;
  careMistakes: number;
  lifespan: number;
  isSleeping: boolean;
  isSick: boolean;
  isLightOn: boolean;
  isHatched: boolean;
  coins: number;
  hatchProgress: number;
  lastFed: number;
  lastPlayed: number;
  lastCleaned: number;
  lastCall: number;
}

/* interface LeaderboardEntry {
  userId: string;
  coins: number;
} */

interface AnimationInfo {
  icon: React.ReactNode;
  value: number;
  x: number;
  y: number;
}

export default function TamagotchiGame() {
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [startScreenVisible, setStartScreenVisible] = useState(true);
  const [hatchedScreenVisible, setHatchedScreenVisible] = useState(false);
  const [currentView, setCurrentView] = useState<
    "main" | "leaderboard" | "wallet" | "minigame"
  >("main");
  // const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [animation, setAnimation] = useState<AnimationInfo | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchTamagotchi(storedUserId);
    } else {
      createTamagotchi();
    }
  }, []);

  useEffect(() => {
    if (userId && socket) {
      socket.emit("join", userId);

      socket.on("tamagotchiUpdate", (updatedTamagotchi: Tamagotchi) => {
        setTamagotchi(updatedTamagotchi);
      });

      return () => {
        socket.off("tamagotchiUpdate");
      };
    }
  }, [userId, socket]);

  useEffect(() => {
    if (startScreenVisible) {
      const timer = setTimeout(() => {
        setStartScreenVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [startScreenVisible]);

  useEffect(() => {
    if (hatchedScreenVisible) {
      const timer = setTimeout(() => {
        setHatchedScreenVisible(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hatchedScreenVisible]);

  const fetchTamagotchi = async (id: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${id}`
      );
      setTamagotchi(response.data);
    } catch (error) {
      console.error("Error fetching Tamagotchi:", error);
    }
  };

  const createTamagotchi = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi`
      );
      const { userId, ...tamagotchiData } = response.data;
      setUserId(userId);
      setTamagotchi(tamagotchiData);
      localStorage.setItem("userId", userId);
    } catch (error) {
      console.error("Error creating Tamagotchi:", error);
    }
  };

  const performAction = async (
    action: string,
    icon: React.ReactNode,
    statChange: number,
    foodType?: string
  ) => {
    if (!userId) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}/${action}`,
        { foodType }
      );
      if (action === "play") {
        setGameResult(response.data.won ? "You won!" : "You lost.");
        setCurrentView("minigame");
        setTimeout(() => {
          setCurrentView("main");
          setGameResult(null);
        }, 2000);
      }
      setTamagotchi(response.data);
      triggerAnimation(icon, statChange);
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
    }
  };

  const triggerAnimation = (icon: React.ReactNode, value: number) => {
    const x = Math.random() * 150 + 25; // Random X position between 25 and 175
    const y = Math.random() * 150 + 25; // Random Y position between 25 and  175
    setAnimation({ icon, value, x, y });
    setTimeout(() => setAnimation(null), 1000); // Remove animation after 1 second
  };

  /*  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/leaderboard`
      );
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  }; */

  /* const hatchEgg = async () => {
    if (!userId || (tamagotchi && tamagotchi.isHatched)) return;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}/hatch`
      );
      setHatchedScreenVisible(true);
    } catch (error) {
      console.error("Error hatching egg:", error);
    }
  }; */

  const feed = () =>
    performAction("feed", <Pizza className='w-4 h-4' />, 1, "rice");
  const feedCandy = () =>
    performAction("feed", <Candy className='w-4 h-4' />, 1, "candy");
  const play = () => performAction("play", <Gamepad2 className='w-4 h-4' />, 1);
  const clean = () =>
    performAction("clean", <Droplets className='w-4 h-4' />, -tamagotchi!.poop);
  const toggleLight = () =>
    performAction("toggleLight", <Sun className='w-4 h-4' />, 0);
  const giveMedicine = () =>
    performAction("medicine", <Pill className='w-4 h-4' />, 1);
  const disciplineIt = () =>
    performAction("discipline", <VolumeX className='w-4 h-4' />, 1);
  const answerCall = () =>
    performAction("answerCall", <VolumeX className='w-4 h-4' />, 1);

  if (!tamagotchi) return <div>Loading...</div>;

  const isDisabled = !tamagotchi.isHatched || currentView !== "main";

  if (startScreenVisible) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-white animate-fade-out'>
        <h1 className='text-4xl font-bold mb-8 text-center'>
          Welcome to Tamagotchi
        </h1>
      </div>
    );
  }

  if (hatchedScreenVisible) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-white animate-fade-in-out'>
        <h1 className='text-4xl font-bold mb-8 text-center'>
          Your Tamagotchi has hatched!
        </h1>
      </div>
    );
  }

  return (
    <div className='w-full max-w-md flex flex-col min-h-screen justify-between bg-blue-50'>
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
      {currentView === "main" && (
        <div
          className={`flex-grow border border-gray-600 flex flex-col items-center justify-center relative ${
            tamagotchi.isLightOn ? "bg-white" : "bg-gray-800"
          }`}
        >
          <div className='absolute top-2 left-2 flex items-center text-sm'>
            <span className='font-bold'>Age:</span> {tamagotchi.age} days
          </div>
          <div className='absolute top-2 right-2 flex items-center'>
            <Coins className='w-4 h-4 mr-1' />
            <span className='text-sm font-bold'>{tamagotchi.coins}</span>
          </div>
          <div className='relative cursor-pointer'>
            <Image
              src={tamagotchi.isHatched ? "/baby1.gif" : "/egg1.gif"}
              alt='pet'
              width={200}
              height={200}
            />

            {!tamagotchi.isHatched && (
              <div className='absolute bottom-0 left-0 right-0 h-2 bg-gray-200'>
                <div
                  className='h-full bg-green-500'
                  style={{ width: `${tamagotchi.hatchProgress * 10}%` }}
                ></div>
              </div>
            )}
            {tamagotchi.poop > 0 && (
              <div className='absolute bottom-0 right-0 text-2xl'>
                {"💩".repeat(Math.floor(tamagotchi.poop))}
              </div>
            )}
          </div>
          <div className='w-full mt-4 px-4'>
            <StatBar label='Hunger' value={tamagotchi.hunger} />
            <StatBar label='Happiness' value={tamagotchi.happiness} />

            <StatBar label='Discipline' value={tamagotchi.discipline} />
          </div>
          {animation && (
            <AnimatedIcon
              icon={animation.icon}
              value={animation.value}
              x={animation.x}
              y={animation.y}
            />
          )}
        </div>
      )}

      {/* {currentView === "leaderboard" && (
        <div className='flex-grow border border-gray-600 bg-white p-4 overflow-y-auto'>
          <h2 className='text-2xl font-bold mb-4'>Leaderboard</h2>
          <ul>
            {leaderboard.map((entry, index) => (
              <li
                key={entry.userId}
                className='flex justify-between items-center mb-2'
              >
                <span>
                  {index + 1}. User {entry.userId}
                </span>
                <span>{entry.coins} coins</span>
              </li>
            ))}
          </ul>
        </div>
      )} */}

      {currentView === "wallet" && (
        <div className='flex-grow border border-gray-600 bg-white p-4'>
          <h2 className='text-2xl font-bold mb-4'>Wallet</h2>
          <p>Coins: {tamagotchi.coins}</p>
          <button
            className='mt-4 bg-blue-500 text-white px-4 py-2 rounded'
            onClick={() =>
              performAction("earnCoins", <Coins className='w-4 h-4' />, 10)
            }
            disabled={currentView !== "wallet"}
          >
            Earn Coins
          </button>
        </div>
      )}

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
          onClick={() => {
            if (currentView === "leaderboard") {
              setCurrentView("main");
            } else {
              setCurrentView("leaderboard");
              // fetchLeaderboard();
            }
          }}
          icon={
            currentView === "leaderboard" ? (
              <ArrowLeft className='w-6 h-6' />
            ) : (
              <Trophy className='w-6 h-6' />
            )
          }
          disabled={false}
        />
        <Button
          onClick={() =>
            setCurrentView(currentView === "wallet" ? "main" : "wallet")
          }
          icon={
            currentView === "wallet" ? (
              <ArrowLeft className='w-6 h-6' />
            ) : (
              <Wallet className='w-6 h-6' />
            )
          }
          disabled={false}
        />
      </div>
    </div>
  );
}

function Button({
  onClick,
  icon,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  disabled: boolean;
}) {
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

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className='mb-2'>
      <div className='flex justify-between mb-1'>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className='w-full bg-gray-200 rounded-full h-2.5'>
        <div
          className='bg-blue-600 h-2.5 rounded-full'
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

function AnimatedIcon({ icon, value, x, y }: AnimationInfo) {
  return (
    <div
      className='absolute animate-float-up pointer-events-none'
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className='flex items-center bg-white rounded-full px-2 py-1 shadow-md'>
        {icon}
        <span className='ml-1 text-sm font-bold'>
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
    </div>
  );
}
