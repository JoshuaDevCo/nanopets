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
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/tamagotchi/ordercoins`,
        { userId: "5380815277" }
      );

      if (response.data?.webUrl) {
        window.location.href = response.data.webUrl;
      }
    } catch (err) {
      console.error("unable to hit api.", err);
      alert("Unable to purchase now.");
      setIsLoading(false);
    }
  };

  const orderStatus = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        process.env.NEXT_PUBLIC_SERVER_URL + "/api/aeonOrderStatus"
      );
      console.log("getting response", response);
      if (response.status === 200) {
        console.log("Order status updated successfully", response.data);
        if (response.data.model.orderStatus !== "COMPLETED") {
          alert("Payment not completed. Please try again.");
        }
        setIsLoading(false);
        return response.data;
      } else {
        setIsLoading(false);
        alert("Unable to get purchase info.");
        console.error("Error updating order status.");
      }
    } catch (err) {
      console.error("unable to hit api.", err);
      alert("Unable to check info.");
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
