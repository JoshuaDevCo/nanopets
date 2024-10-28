"use client";

import Image from "next/image";
import Button from "./Button";
import StatIcons from "./StatsIcons";
import AnimatedIcon from "./AnimatedIcons";
import ClockView from "./ClockView";
import WalletView from "./WalletView";
import MinigameView from "./MiniGameView";
import AIChat from "./ai";
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
import Speaker from "../svgs/speaker.png";
import MoneyBag from "../svgs/money-bag.png";
import Trophy from "../svgs/trophy.png";
import BackArrow from "../svgs/backarrow.png";

export default function TamagotchiGame() {
  const {
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
  } = useTamagotchiGame();

  if (!tamagotchi) return <div>Loading...</div>;

  const isSleepTime = clockTime >= 21 || clockTime < 9;
  const isDisabled = currentView !== "main" || tamagotchi.careMistakes >= 10;
  const isDead = tamagotchi.careMistakes >= 10;

  const icons = {
    Rice,
    Candy,
    Sun,
    Console,
    Flask,
    WaterDrop,
    Speaker,
    MoneyBag,
    Trophy,
    BackArrow,
  };

  return (
    <div className='w-full max-w-md flex flex-col min-h-screen justify-between bg-blue-50'>
      {currentView === "clock" ? (
        <ClockView
          clockTime={clockTime}
          setClockTime={setClockTime}
          setTime={setTime}
          icons={icons}
        />
      ) : (
        <>
          <div className='grid grid-cols-5 gap-4 p-2'>
            <Button
              onClick={() => feed("rice")}
              icon={Rice}
              disabled={isDisabled || isBusyAction}
            />
            <Button
              onClick={() => feed("candy")}
              icon={Candy}
              disabled={isDisabled || isBusyAction}
            />
            <Button
              onClick={toggleLight}
              icon={Sun}
              disabled={isDisabled || isBusyAction}
            />
            <Button
              onClick={play}
              icon={Console}
              disabled={isDisabled || isBusyAction}
            />
            <Button
              onClick={giveMedicine}
              icon={Flask}
              disabled={isDisabled || isBusyAction}
            />
          </div>

          <div
            className={`flex-grow border border-gray-600 flex flex-col items-center justify-center relative ${
              tamagotchi.isLightOn
                ? "bg-white text-black"
                : "bg-gray-800 text-white"
            }`}
          >
            {currentView === "main" && (
              <>
                <div className='absolute top-2 left-2 flex items-center text-2xl'>
                  <span className='font-bold'>Age:</span> {tamagotchi.age} days
                </div>
                <div className='absolute top-2 right-2 flex items-center text-2xl'>
                  <Image
                    className='mr-2'
                    width={20}
                    height={20}
                    alt='coin'
                    src={Coin}
                  />
                  <span className='font-bold'>{tamagotchi.coins}</span>
                </div>
                <div className='relative'>
                  <Image
                    src={
                      isDead
                        ? "/dead.gif"
                        : tamagotchi.isSleeping
                        ? "/sleeping.gif"
                        : "/baby1.gif"
                    }
                    alt='pet'
                    width={300}
                    height={300}
                    className='hue-rotate-90'
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
                    <div className='absolute top-0 left-0 text-xl'>🤒</div>
                  )}
                  {tamagotchi.poop > 0 && (
                    <div className='absolute bottom-0 right-0 text-2xl'>
                      {"💩".repeat(tamagotchi.poop)}
                    </div>
                  )}
                </div>
                {tamagotchi && lastAction && (
                  <AIChat
                    tamagotchi={tamagotchi}
                    lastAction={lastAction}
                    gameResult={gameResult}
                  />
                )}
                <div className='absolute bottom-2 left-2 flex items-center'>
                  <StatIcons
                    label='Happiness'
                    value={tamagotchi.happiness}
                    icon={tamagotchi.isLightOn ? Happy : HappyWhite}
                    icon2={tamagotchi.isLightOn ? HappyEmpty : HappyEmptyWhite}
                  />
                </div>
                <div className='absolute bottom-2 right-2 flex items-center'>
                  <StatIcons
                    label='Hunger'
                    value={tamagotchi.hunger}
                    icon={tamagotchi.isLightOn ? Hungry : HungryWhite}
                    icon2={
                      tamagotchi.isLightOn ? HungryEmpty : HungryEmptyWhite
                    }
                  />
                </div>
              </>
            )}
            {currentView === "wallet" && (
              <WalletView
                coins={tamagotchi.coins}
                weight={tamagotchi.weight}
                careMistakes={tamagotchi.careMistakes}
                collectCoin={collectCoin}
                resetTamagotchi={resetTamagotchi}
              />
            )}
            {currentView === "stats" && <div className='p-4 w-full'></div>}
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
            {error && (
              <div className='absolute top-10 left-0 right-0 text-center text-red-500'>
                {error}
              </div>
            )}
          </div>

          <div className='grid grid-cols-4 gap-4 p-2'>
            <Button
              onClick={clean}
              icon={WaterDrop}
              disabled={isDisabled || isBusyAction}
            />
            <Button
              onClick={disciplineIt}
              icon={Speaker}
              disabled={isDisabled || isBusyAction}
            />
            {currentView === "main" || currentView === "minigame" ? (
              <>
                <Button
                  onClick={() => setCurrentView("wallet")}
                  icon={MoneyBag}
                  disabled={isBusyAction}
                />
                <Button
                  onClick={() => setCurrentView("stats")}
                  icon={Trophy}
                  disabled={isBusyAction}
                />
              </>
            ) : (
              <>
                {currentView === "stats" && <div />}
                <Button
                  onClick={() => setCurrentView("main")}
                  icon={BackArrow}
                  disabled={false}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
