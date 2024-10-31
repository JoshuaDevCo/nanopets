import { useState, useEffect } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { StaticImageData } from "next/image";

// Import SVG icons
import Rice from "../svgs/yakisoba.png";
import Candy from "../svgs/candy.png";
import Flask from "../svgs/flask.png";
import Sun from "../svgs/sun.png";
import WaterDrop from "../svgs/waterdrop.png";
import Trophy from "../svgs/trophy.png";
import Happy from "../svgs/happy.png";
import Scale from "../svgs/scale1.png";
import Hungry from "../svgs/hungry.png";
import Coin from "../svgs/coin.png";

import { WebApp } from "@twa-dev/types";
import { useRouter } from "next/router";

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp;
    };
  }
}

interface Tamagotchi {
  userId: string;
  hunger: number;
  happiness: number;
  age: number;
  weight: number;
  poop: number;
  careMistakes: number;
  isSleeping: boolean;
  isSick: boolean;
  isLightOn: boolean;
  coins: number;
  clockTime: number;
  timeSet: boolean;
  lastUpdateTime: number;
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
    "main" | "stats" | "minigame" | "clock" | "wallet" | "shop" | "nottelegram"
  >("clock");
  const [animation, setAnimation] = useState<AnimationInfo | null>(null);
  const [animation2, setAnimation2] = useState<AnimationInfo | null>(null);
  const [animation3, setAnimation3] = useState<AnimationInfo | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameResult, setGameResult] = useState<string | null>(null);
  const [clockTime, setClockTime] = useState<number>(12);
  const [error, setError] = useState<string | null>(null);
  const [isGameInProgress, setIsGameInProgress] = useState<boolean>(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isBusyAction, setIsBusyAction] = useState<boolean>(false);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const response = await fetch("/api/session");
    if (response.ok) {
      const session = await response.json();
      setIsAuthenticated(true);
      setUserId(session.telegramId);
      fetchTamagotchi(session.telegramId);
    } else {
      router.push("/");
    }
  };

  const displayError = (error: any) => {
    setError(error);
    setTimeout(() => {
      setError(null);
    }, 2000);
  };

  useEffect(() => {
    if (userId) {
      const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL);
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [userId]);

  useEffect(() => {
    if (userId && socket) {
      socket.emit("join", userId);

      socket.on("tamagotchiUpdate", (updatedTamagotchi: Tamagotchi) => {
        setTamagotchi(updatedTamagotchi);
        setClockTime(updatedTamagotchi.clockTime);
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
      setClockTime(response.data.clockTime);
      setCurrentView("main");
    } catch (error) {
      console.error("Error fetching Tamagotchi:", error);
      createTamagotchi(id);
    }
  };

  const createTamagotchi = async (id: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi`,
        { userId: id }
      );
      const { userId, ...tamagotchiData } = response.data;
      setTamagotchi(tamagotchiData);
      setClockTime(tamagotchiData.clockTime);
      setCurrentView("main");
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
        if (isWin) {
          triggerAnimation(Happy, statChange);
          triggerAnimation2(Scale, -statChange);
        } else {
          triggerAnimation(Scale, -statChange);
        }
        setTimeout(() => {
          setCurrentView("main");
          setGameResult(null);
        }, 3000);
      }
      setTamagotchi(response.data);
      setClockTime(response.data.clockTime);

      if (action == "feed") {
        if (foodType == "rice") {
          triggerAnimation(Hungry, statChange);
          triggerAnimation2(Scale, statChange);
          triggerAnimation3(Coin, -1);
        }
        if (foodType == "candy") {
          triggerAnimation(Happy, 1);
          triggerAnimation2(Scale, 2);
          triggerAnimation3(Coin, -2);
        }
      }
      if (action == "medicine") {
        // triggerAnimation()
      }
      if (action == "toggleLight") {
        // triggerAnimation(icon, statChange);
      }
      if (action == "clean") {
        triggerAnimation(Coin, 5);
      }
      setLastAction(action);
      setError(null);
      setIsBusyAction(false);
    } catch (error: any) {
      console.error(`Error performing action ${action}:`, error);
      setCurrentView("main");
      displayError(error.response?.data?.error || "An error occurred");
      setIsBusyAction(false);
    }
  };

  const purchaseItem = async (itemId: string) => {
    if (!userId) return;
    try {
      setIsBusyAction(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}/purchase`,
        { itemId }
      );
      setTamagotchi(response.data);
      setClockTime(response.data.clockTime);
      setLastAction(`purchase_${itemId}`);
      setError(null);
      setIsBusyAction(false);
    } catch (error: any) {
      console.error(`Error purchasing item ${itemId}:`, error);
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

  const triggerAnimation2 = (icon: StaticImageData, value: number) => {
    const x = Math.random() * 150 + 25;
    const y = Math.random() * 150 + 25;
    setAnimation2({ icon, value, x, y });
    setTimeout(() => setAnimation2(null), 1000);
  };

  const triggerAnimation3 = (icon: StaticImageData, value: number) => {
    const x = Math.random() * 150 + 35;
    const y = Math.random() * 150 + 35;
    setAnimation3({ icon, value, x, y });
    setTimeout(() => setAnimation3(null), 1000);
  };

  const setTime = async (hours: number, minutes: number) => {
    if (!userId) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}/setTime`,
        { hours, minutes }
      );
      setCurrentView("main");
      setTamagotchi(response.data);
      setClockTime(response.data.clockTime);
    } catch (error: any) {
      console.error("Error setting time:", error);
      displayError(
        error.response?.data?.error || "An error occurred while setting time"
      );
    }
  };

  const feed = (foodType: "rice" | "candy") =>
    performAction("feed", foodType === "rice" ? Rice : Candy, 1, foodType);
  const play = () => {
    if (isGameInProgress) {
      performAction("play", Happy, 1);
    } else {
      setCurrentView("minigame");
      setIsGameInProgress(true);
    }
  };
  const clean = () => performAction("clean", WaterDrop, -tamagotchi!.poop);
  const toggleLight = () => performAction("toggleLight", Sun, 0);
  const giveMedicine = () => performAction("medicine", Flask, 1);

  const revive = () => performAction("revive", Trophy, 0);

  return {
    tamagotchi,
    currentView,
    setCurrentView,
    animation,
    animation2,
    animation3,
    gameResult,
    clockTime,
    error,
    isGameInProgress,
    lastAction,
    isBusyAction,
    isAuthenticated,
    setTime,
    feed,
    play,
    clean,
    toggleLight,
    giveMedicine,
    purchaseItem,
    revive,
  };
}
