"use client";

import AnimatedIcon from "../game/AnimatedIcons";
import { useTamagotchiGame } from "../game/useTamagotchiGame";

export default function TestPage() {
  const { createOrder, animation } = useTamagotchiGame();

  return (
    <div>
      <button
        onClick={createOrder}
        className='bg-green-500  text-white font-bold py-2 px-4 '
      >
        <div className='flex gap-2'>
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
