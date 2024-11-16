import { useState, useEffect, useCallback } from "react";
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
import Crown from "../svgs/crown.png";

import { WebApp } from "@twa-dev/types";

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
  lastVideoWatchTime: number;
  referralCount: number;
  tamahue: number;
  crowns: number;
  orderNo?: number;
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

  const checkAuth = async () => {
    const response = await fetch("/api/session");
    if (response.ok) {
      setIsAuthenticated(true);
      const WebApp: any = (await import("@twa-dev/sdk")).default;
      WebApp.ready();
      const initData: any = WebApp.initDataUnsafe;

      setCurrentView("clock");
      setUserId(initData.user.id.toString());
      fetchTamagotchi(initData.user.id.toString());
    } else {
      console.log("not authenticated");
      authenticateUser();
    }
  };

  useEffect(() => {
    checkAuth();
  }, [isAuthenticated]);

  const authenticateUser = async () => {
    const WebApp = (await import("@twa-dev/sdk")).default;
    WebApp.ready();
    const initData = WebApp.initData;
    if (initData) {
      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ initData }),
        });

        if (response.ok) {
          setIsAuthenticated(true);
          console.log("Authenticated user ");
          const r = await response.json();
          console.log(r);
        } else {
          console.error("Authentication failed");
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error during authentication:", error);
        setIsAuthenticated(false);
      }
    }
  };

  const displayError = (error: any) => {
    setError(error);
    setTimeout(() => {
      setError(null);
    }, 4000);
  };

  const initializeSocket = useCallback(() => {
    if (userId && !socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL, {
        query: { userId },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("Socket connected");
        newSocket.emit("join", userId);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      newSocket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      newSocket.on("tamagotchiUpdate", (updatedTamagotchi: Tamagotchi) => {
        setTamagotchi(updatedTamagotchi);
        setClockTime(updatedTamagotchi.clockTime);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [userId]);

  useEffect(() => {
    initializeSocket();
  }, [userId, initializeSocket]);

  const fetchTamagotchi = async (id: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${id}`
      );

      if (response.data.error === "Doesn't exist") {
        // Tamagotchi doesn't exist, create a new one
        await createTamagotchi(id);
      } else {
        // Tamagotchi exists, update the state
        setTamagotchi(response.data);
        setClockTime(response.data.clockTime);
        setCurrentView("main");
      }
    } catch (error) {
      console.error("Error fetching Tamagotchi:", error);
      displayError("Error fetching Tamagotchi. Please try again.");
    }
  };

  const createTamagotchi = async (id: string) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get("start");

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi`,
        { userId: id, referralCode }
      );
      const newTamagotchi = response.data;
      setTamagotchi(newTamagotchi);
      setClockTime(newTamagotchi.clockTime);
      setCurrentView("clock");
    } catch (error) {
      console.error("Error creating Tamagotchi:", error);
      displayError("Error creating Tamagotchi. Please try again.");
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
      if (action == "watchVideo") {
        triggerAnimation(Coin, 10);
      }
      if (action == "revive") {
        triggerAnimation(Coin, -10);
        setCurrentView("main");
      }

      setLastAction(action);
      setTimeout(() => setLastAction(null), 10000);
      setError(null);
      setIsBusyAction(false);
    } catch (error: any) {
      console.error(`Error performing action ${action}:`, error);
      setCurrentView("main");
      displayError(error.response?.data?.error || "An error occurred");
      setIsBusyAction(false);
    }
  };

  const BuyCrown = async () => {
    if (!userId) return;

    try {
      setIsBusyAction(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}/buy-crown`
      );
      setTamagotchi(response.data);
      triggerAnimation(Crown, +1);
      setIsBusyAction(false);
    } catch (error) {
      console.error("Error buying crown:", error);
      setIsBusyAction(false);
    }
  };

  const createOrder = async () => {
    if (!userId) return;

    console.log("creating order test");
    try {
      setIsBusyAction(true);

      const response = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/order-coins/${userId}`
    );

      if (response.data?.webUrl) {
        window.location.href = response.data.webUrl;
      }
    } catch (err) {
      console.error("unable to hit api.", err);
      alert("Unable to purchase now.");
      setIsBusyAction(false);
    }
  };

  const orderStatus = async () => {
    if (!userId) return;

    try {
      setIsBusyAction(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/order-status/${userId}`
      );
      console.log("getting response", response);
      if (response.status === 200) {
        console.log("Order status updated successfully", response.data);
        if (response.data.model.orderStatus !== "COMPLETED") {
          alert(
            `Payment not completed. Please try again at https://sbx-crypto-payment.alchemypay.org/${response.data.model.orderNo}.`
          );
        }
        setIsBusyAction(false);
        return response.data;
      } else {
        setIsBusyAction(false);
        alert("Unable to get purchase info.");
        console.error("Error updating order status.");
      }
    } catch (err) {
      console.error("unable to hit api.", err);
      alert("Unable to check info.");
    }
  };

  const purchaseItem = async (itemId: string) => {
    if (!userId) return;

    console.log(itemId);

    /* try {
      setIsBusyAction(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/${userId}/purchase`,
        { itemId }
      );
      setTamagotchi(response.data);
      setClockTime(response.data.clockTime);
    triggerAnimation(Coin, -10);
      setIsBusyAction(false);
    } catch (error: any) {
      console.error(`Error purchasing item ${itemId}:`, error);
      displayError(error.response?.data?.error || "An error occurred");
      setIsBusyAction(false);
    } */
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
  const watchVideo = () => performAction("watchVideo", Coin, 0);
  const revive = () => performAction("revive", Trophy, 0);

  return {
    userId,
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
    watchVideo,
    revive,
    BuyCrown,
    createOrder,
    orderStatus,
  };
}
