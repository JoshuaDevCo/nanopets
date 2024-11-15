"use client";

import { useState } from "react";
import AnimatedIcon from "../game/AnimatedIcons";

import { useTamagotchiGame } from "../game/useTamagotchiGame";
import axios from "axios";

export default function TestPage() {
  const { animation } = useTamagotchiGame();
  const [isLoading, setIsLoading] = useState(false);

  const createOrder = async () => {
    console.log("creating order test");
    try {
      setIsLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/order-coins`
      );

      if (response.data?.webUrl) {
        window.location.href = response.data.webUrl;
      }
    } catch (err) {
      console.error("unable to hit api.", err);
    }
  };

  const orderStatus = async () => {
    try {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_SERVER_URL + "/api/aeonOrderStatus"
      );
      console.log("getting response", response);
      if (response.status === 200) {
        console.log("Order status updated successfully", response.data);
        return response.data;
      } else {
        console.error("Error updating order status.");
      }
    } catch (err) {
      console.error("unable to hit api.", err);
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

      <button
        onClick={orderStatus}
        disabled={isLoading}
        className='bg-green-500 text-white font-bold py-2 px-4 disabled:opacity-50'
      >
        <div className='flex gap-2 items-center'>
          {isLoading ? <p>...loading</p> : null}
          <p className='text-xl'>Check Order</p>
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
