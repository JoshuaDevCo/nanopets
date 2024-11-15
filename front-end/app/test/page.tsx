"use client";

import { useState } from "react";
import AnimatedIcon from "../game/AnimatedIcons";

import { useTamagotchiGame } from "../game/useTamagotchiGame";
import axios from "axios";
import { useRouter } from "next/router";

export default function TestPage() {
  const { animation } = useTamagotchiGame();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const createOrder = async () => {
    console.log("creating order test");
    try {
      setIsLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/order-coins`
      );

      if (response.data?.webUrl) {
        router.push(response.data.webUrl);
      }
    } catch (err) {
      console.error("unable to hit api.", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={createOrder}
        disabled={isLoading}
        className='bg-green-500 text-white font-bold py-2 px-4 disabled:opacity-50'
      >
        <div className='flex gap-2 items-center'>
          {isLoading ? <p>...loading</p> : null}
          <p className='text-xl'>Buy Coins</p>
        </div>
      </button>

      {animation && (
        <AnimatedIcon
          icon={animation.icon}
          value={animation.value}
          x={animation.x}
          y={animation.y}
        />
      )}
    </div>
  );
}
