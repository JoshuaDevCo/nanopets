"use client";

import { useState, useEffect, useRef } from "react";
import { useCompletion } from "ai/react";

export default function TamagotchiResponse({
  tamagotchi,
  lastAction,
  gameResult,
}: any) {
  const [isVisible, setIsVisible] = useState(false);
  const { complete, completion } = useCompletion({
    api: "/api/chat",
  });
  const prevTamagotchiRef = useRef(null);

  useEffect(() => {
    if (lastAction) {
      setIsVisible(true);
      const prevState = prevTamagotchiRef.current;
      const stateChanges = getStateChanges(prevState, tamagotchi);

      complete("", {
        body: {
          tamagotchiData: tamagotchi,
          lastAction,
          gameResult,
          stateChanges,
          prevState,
        },
      });

      const timer = setTimeout(() => setIsVisible(false), 10000);
      prevTamagotchiRef.current = { ...tamagotchi };
      return () => clearTimeout(timer);
    }
  }, [lastAction, tamagotchi, complete, gameResult]);

  if (!isVisible) return null;

  return (
    <div className='fixed bottom-28'>
      <div className='p-4'>
        <p className='text-xl'>{completion || "Thinking..."}</p>
      </div>
    </div>
  );
}

function getStateChanges(prevState, currentState): any {
  if (!prevState) return {};

  const changes = {};
  for (const [key, value] of Object.entries(currentState)) {
    if (prevState[key] !== value) {
      changes[key] = { from: prevState[key], to: value };
    }
  }
  return changes;
}
