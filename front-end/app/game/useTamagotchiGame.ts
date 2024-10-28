import { useState, useEffect } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { StaticImageData } from "next/image";

// Import SVG icons
import Rice from "../svgs/yakisoba.png";
import Candy from "../svgs/candy.png";
import Console from "../svgs/console.png";
import Flask from "../svgs/flask.png";
import Sun from "../svgs/sun.png";
import Coin from "../svgs/coin.png";
import HappyEmpty from "../svgs/happyempty.png";
import HappyEmptyWhite from "../svgs/happyemptywhite.png";
import Happy from "../svgs/happy.png";
import HappyWhite from "../svgs/happywhite.png";
import Hungry from "../svgs/hungry.png";
import HungryWhite from "../svgs/hungrywhite.png";
import HungryEmpty from "../svgs/hungryempty.png";
import HungryEmptyWhite from "../svgs/hungryemptywhite.png";
import WaterDrop from "../svgs/waterdrop.png";
import Speaker from "../svgs/speaker.png";
import MoneyBag from "../svgs/money-bag.png";
import Trophy from "../svgs/trophy.png";
import BackArrow from "../svgs/backarrow.png";

interface Tamagotchi {
  userId: string;
  hunger: number;
  happiness: number;
  discipline: number;
  age: number;
  weight: number;
  poop: number;
  careMistakes: number;
  isSleeping: boolean;
  isSick: boolean;
  isLightOn: boolean;
  coins: number;
  clockTime: number;
  lastCoinDrop: number;
}

interface AnimationInfo {
  icon: StaticImageData;
  value: number;
  x: number;
  y: number;
}

export function useTamagotchiGame() {
  const [tamagotchi, setTamagotchi] = useState<Tamagotchi | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<
    "main" | "stats" | "minigame" | "clock" | "wallet"
  >("clock");
  const [animation, setAnimation] = useState<AnimationInfo | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [clockTime, setClockTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isGameInProgress, setIsGameInProgress] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isBusyAction, setIsBusyAction] = useState<boolean>(false);

  const displayError = (error: any) => {
    setError(error);
    setTimeout(() => {
      setError(null);
    }, 2000);
  };

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
      setCurrentView("main");
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

  const fetchTamagotchi = async (id: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${id}`
      );
      setTamagotchi(response.data);
      setClockTime(response.data.clockTime || 0);
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
      setClockTime(tamagotchiData.clockTime || 0);
      localStorage.setItem("userId", userId);
    } catch (error) {
      console.error("Error creating Tamagotchi:", error);
    }
  };

  const performAction = async (
    action: string,
    icon: StaticImageData,
    statChange: number,
    foodType?: string
  ) => {
    if (!userId) return;
    try {
      setIsBusyAction(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}/${action}`,
        { foodType }
      );
      if (action === "play") {
        const winProbability = response.data.won;
        const isWin = winProbability > 0.7;
        setGameResult(isWin ? "You won!" : "You lost.");
        setIsGameInProgress(false);

        setTimeout(() => {
          setCurrentView("main");
          setGameResult(null);
        }, 3000);
      }
      setTamagotchi(response.data);
      if (action !== "toggleLight") {
        triggerAnimation(icon, statChange);
      }
      setLastAction(action);
      setError(null);
      setIsBusyAction(false);
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      displayError(error.response?.data?.error || "An error occurred");
      setIsBusyAction(false);
    }
  };

  const triggerAnimation = (icon: StaticImageData, value: number) => {
    const x = Math.random() * 150 + 25;
    const y = Math.random() * 150 + 25;
    setAnimation({ icon, value, x, y });
    setTimeout(() => setAnimation(null), 1000);
  };

  const setTime = async () => {
    if (!userId) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}/setTime`,
        { time: clockTime }
      );
      setTamagotchi(response.data);
      setCurrentView("main");
    } catch (error) {
      console.error("Error setting time:", error);
    }
  };

  const collectCoin = async () => {
    if (!userId) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}/collectCoin`
      );
      if (response.data.success) {
        setTamagotchi((prevState) => ({
          ...prevState,
          coins: response.data.coins,
        }));
        triggerAnimation("coin", 1);
      } else {
        displayError(response.data.message);
      }
    } catch (error) {
      console.error("Error collecting coin:", error);
      displayError("Failed to collect coin");
    }
  };

  const resetTamagotchi = async () => {
    if (!userId) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}`
      );
      localStorage.removeItem("userId");
      setUserId(null);
      setTamagotchi(null);
      setCurrentView("clock");
      createTamagotchi();
    } catch (error) {
      console.error("Error resetting Tamagotchi:", error);
    }
  };

  const feed = (foodType: "rice" | "candy") =>
    performAction("feed", foodType == "rice" ? Rice : Candy, 1, foodType);
  const play = () => {
    if (isGameInProgress) {
      performAction("play", Console, 1);
    } else {
      setCurrentView("minigame");
      setIsGameInProgress(true);
    }
  };
  const clean = () => performAction("clean", WaterDrop, -tamagotchi!.poop);
  const toggleLight = () => performAction("toggleLight", Sun, 0);
  const giveMedicine = () => performAction("medicine", Flask, 1);
  const disciplineIt = () => performAction("discipline", Speaker, 1);
  const revive = () => performAction("revive", Trophy, 0);

  return {
    tamagotchi,
    currentView,
    setCurrentView,
    animation,
    gameResult,
    clockTime,
    setClockTime,
    error,
    isGameInProgress,
    lastAction,
    isBusyAction,
    setTime,
    collectCoin,
    resetTamagotchi,
    feed,
    play,
    clean,
    toggleLight,
    giveMedicine,
    disciplineIt,
    revive,
  };
}
