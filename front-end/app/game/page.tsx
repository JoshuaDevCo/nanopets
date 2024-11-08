"use client";

import Image from "next/image";
import Button from "./Button";
import StatIcons from "./StatsIcons";
import AnimatedIcon from "./AnimatedIcons";
import ClockView from "./ClockView";
import WalletView from "./WalletView";
import MinigameView from "./MiniGameView";
import AIChat from "./ai";
import Loading from "./Loading";
import ShopView from "./ShopView";
import { useTamagotchiGame } from "./useTamagotchiGame";

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
import GiftBox from "../svgs/gift-box.png";
import Speaker from "../svgs/speaker.png";
import MoneyBag from "../svgs/money-bag.png";
import Trophy from "../svgs/trophy.png";
import BackArrow from "../svgs/backarrow.png";
import Scale from "../svgs/scale1.png";
import Moon from "../svgs/moon.png";
import { useEffect, useState } from "react";
import NotOpenTelegram from "./NotOpenInTelegram";

export default function TamagotchiGame() {
  const [isInTelegram, setIsInTelegram] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
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
    setTime,
    feed,
    play,
    clean,
    toggleLight,
    giveMedicine,
    purchaseItem,
    isAuthenticated,
    revive,
    watchVideo,
  } = useTamagotchiGame();

  const icons = {
    Rice,
    Candy,
    Sun,
    Console,
    Flask,
    WaterDrop,
    GiftBox,
    Speaker,
    MoneyBag,
    Trophy,
    BackArrow,
  };

  useEffect(() => {
    const checkTelegramEnvironment = async () => {
      try {
        const WebApp = (await import("@twa-dev/sdk")).default;
        WebApp.ready();
        setIsInTelegram(true);
      } catch (error) {
        console.error("Not in Telegram environment:", error);
        setIsInTelegram(false);
      }
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    };

    checkTelegramEnvironment();
  }, []);

  if (isLoading) {
    return (
      <div className='w-full max-w-md flex flex-col min-h-screen justify-between bg-blue-50'>
        <Loading icons={icons} />
        {error && (
          <div className='absolute top-10 left-0 right-0 text-center text-red-500'>
            {error}
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated || !isInTelegram) {
    return <NotOpenTelegram />;
  }

  if (!userId || !tamagotchi) {
    if (tamagotchi) {
      return (
        <div className='w-full max-w-md flex flex-col min-h-screen justify-between bg-blue-50'>
          <ClockView
            icons={icons}
            setTime={setTime}
            tamahue={tamagotchi.tamahue}
          />
        </div>
      );
    } else
      return (
        <div className='w-full max-w-md flex flex-col min-h-screen justify-between bg-blue-50'>
          <Loading icons={icons} />
          {error && (
            <div className='absolute top-10 left-0 right-0 text-center text-red-500'>
              {error}
            </div>
          )}
        </div>
      );
  }

  const isDisabled = currentView !== "main" || tamagotchi.careMistakes >= 10;
  const isDead = tamagotchi.careMistakes >= 10;

  const formatTime = (clockTime: number) => {
    const hours = Math.floor(clockTime);
    const minutes = Math.round((clockTime % 1) * 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className='w-full max-w-md flex flex-col min-h-screen justify-between bg-blue-50'>
      {currentView === "clock" ? (
        <ClockView
          icons={icons}
          setTime={setTime}
          tamahue={tamagotchi.tamahue}
        />
      ) : (
        <>
          <div className='grid grid-cols-5 gap-4 p-2'>
            <Button
              onClick={() => feed("rice")}
              icon={Rice}
              disabled={isDisabled || isBusyAction || tamagotchi.coins == 0}
            />
            <Button
              onClick={() => feed("candy")}
              icon={Candy}
              disabled={isDisabled || isBusyAction || tamagotchi.coins < 2}
            />

            <Button
              onClick={play}
              icon={Console}
              disabled={isDisabled || isBusyAction || tamagotchi.weight == 1}
            />
            <Button
              onClick={giveMedicine}
              icon={Flask}
              disabled={isDisabled || isBusyAction || !tamagotchi.isSick}
            />
            <Button
              onClick={clean}
              icon={WaterDrop}
              disabled={isDisabled || isBusyAction || tamagotchi.poop == 0}
            />
          </div>

          <div
            className={` border border-gray-600 flex flex-col items-center  relative h-[calc(100vh-150px)] overflow-y-scroll ${
              tamagotchi.isLightOn
                ? "bg-white text-black"
                : "bg-gray-800 text-white"
            } h-[calc()]`}
          >
            {currentView === "main" && (
              <>
                <div className='absolute top-2 left-2 flex flex-col items-center text-2xl'>
                  <div className='flex gap-2'>
                    <span className='font-bold text-xl'>
                      <Image width={24} height={24} src={Scale} alt='scale' />
                    </span>{" "}
                    {tamagotchi.weight}/10
                  </div>
                  <div>
                    <span className='font-bold ml-2'>Age:</span>{" "}
                    {tamagotchi.age} days
                  </div>
                </div>
                <div className='absolute top-2 flex items-center text-2xl'>
                  <span className='font-bold'>Care Mistakes:</span>{" "}
                  {tamagotchi.careMistakes}/10
                </div>
                <div className='absolute top-2 right-2 flex flex-col items-center text-2xl'>
                  <div className='flex'>
                    <Image
                      className='mr-2'
                      width={20}
                      height={20}
                      alt='coin'
                      src={Coin}
                    />
                    <span className='font-bold'>{tamagotchi.coins}</span>
                  </div>

                  <div>
                    <p className='mt-2 text-lg font-bold'>
                      Time: {formatTime(clockTime)} <br />
                    </p>
                  </div>
                </div>
                <div className='relative mt-52'>
                  <Image
                    src={
                      isDead
                        ? "/dead1.png"
                        : tamagotchi.isSleeping
                        ? "/sleeping.gif"
                        : "/baby1.gif"
                    }
                    alt='pet'
                    width={300}
                    height={300}
                    className={`hue-rotate-[${tamagotchi.tamahue}deg]`}
                  />
                  {tamagotchi.isSleeping && (
                    <Image
                      src='/zzz.gif'
                      alt='zzz'
                      width={120}
                      height={120}
                      className='absolute -right-5 -top-10'
                    />
                  )}
                  {tamagotchi.isSick && (
                    <Image
                      src='/sick1.gif'
                      alt='pet'
                      width={300}
                      height={300}
                      className='absolute top-0'
                    />
                  )}
                  {tamagotchi.poop > 0 &&
                    [...Array(tamagotchi.poop)].map((_, i) => (
                      <Image
                        key={i}
                        src={Moon}
                        alt='moon poop'
                        width={30}
                        height={30}
                        className=' absolute bottom-0 right-0 '
                      />
                    ))}
                </div>

                {tamagotchi && lastAction && (
                  <AIChat
                    tamagotchi={tamagotchi}
                    lastAction={lastAction}
                    gameResult={gameResult}
                  />
                )}
                <div className='absolute bottom-2 left-2 flex items-center'>
                  {" "}
                  <StatIcons
                    label='Hunger'
                    value={tamagotchi.hunger}
                    icon={tamagotchi.isLightOn ? Hungry : HungryWhite}
                    icon2={
                      tamagotchi.isLightOn ? HungryEmpty : HungryEmptyWhite
                    }
                  />
                </div>
                <div className='absolute bottom-2 right-2 flex items-center'>
                  <StatIcons
                    label='Happiness'
                    value={tamagotchi.happiness}
                    icon={tamagotchi.isLightOn ? Happy : HappyWhite}
                    icon2={tamagotchi.isLightOn ? HappyEmpty : HappyEmptyWhite}
                  />
                </div>
              </>
            )}
            {currentView === "wallet" && (
              <WalletView
                coins={tamagotchi.coins}
                lastVideoWatchTime={tamagotchi.lastVideoWatchTime}
                resetTamagotchi={revive}
                watchVideo={watchVideo}
                userId={userId}
                referralCount={tamagotchi.referralCount}
              />
            )}
            {currentView === "stats" && <div className='p-4 w-full'></div>}
            {currentView === "shop" && (
              <ShopView coins={tamagotchi.coins} onPurchase={purchaseItem} />
            )}
            {currentView === "minigame" && (
              <MinigameView
                isGameInProgress={isGameInProgress}
                gameResult={gameResult}
                play={play}
              />
            )}
            {animation && (
              <AnimatedIcon
                icon={animation.icon}
                value={animation.value}
                x={animation.x}
                y={animation.y}
              />
            )}
            {animation2 && (
              <AnimatedIcon
                icon={animation2.icon}
                value={animation2.value}
                x={animation2.x}
                y={animation2.y}
              />
            )}
            {animation3 && (
              <AnimatedIcon
                icon={animation3.icon}
                value={animation3.value}
                x={animation3.x}
                y={animation3.y}
              />
            )}
            {error && (
              <div className='absolute top-10 left-0 right-0 text-center text-red-500'>
                {error}
              </div>
            )}
          </div>

          <div className='grid grid-cols-4 gap-4 p-2'>
            <Button
              onClick={toggleLight}
              icon={Sun}
              disabled={isDisabled || isBusyAction || !tamagotchi.isSleeping}
            />
            {currentView === "main" || currentView === "minigame" ? (
              <>
                <Button
                  onClick={() => setCurrentView("stats")}
                  icon={Trophy}
                  disabled={isBusyAction}
                />
                <Button
                  onClick={() => setCurrentView("shop")}
                  icon={GiftBox}
                  disabled={isBusyAction}
                />
                <Button
                  onClick={() => setCurrentView("wallet")}
                  icon={MoneyBag}
                  disabled={isBusyAction}
                />
              </>
            ) : (
              <>
                {currentView === "wallet" && (
                  <>
                    <Button
                      onClick={() => setCurrentView("stats")}
                      icon={Trophy}
                      disabled={true}
                    />
                    <Button
                      onClick={() => setCurrentView("shop")}
                      icon={GiftBox}
                      disabled={true}
                    />
                  </>
                )}
                {currentView === "shop" && (
                  <>
                    <Button
                      onClick={() => setCurrentView("stats")}
                      icon={Trophy}
                      disabled={true}
                    />
                  </>
                )}
                <Button
                  onClick={() => setCurrentView("main")}
                  icon={BackArrow}
                  disabled={false}
                />
                {currentView === "shop" && (
                  <>
                    <Button
                      onClick={() => setCurrentView("wallet")}
                      icon={MoneyBag}
                      disabled={true}
                    />
                  </>
                )}
                {currentView === "stats" && (
                  <>
                    <Button
                      onClick={() => setCurrentView("shop")}
                      icon={GiftBox}
                      disabled={true}
                    />
                    <Button
                      onClick={() => setCurrentView("wallet")}
                      icon={MoneyBag}
                      disabled={true}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
