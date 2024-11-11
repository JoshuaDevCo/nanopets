import { useState } from "react";
import Image, { StaticImageData } from "next/image";

import Coin from "../svgs/coin.png";
import Robot from "../svgs/robot.png";
import Pill from "../svgs/pill.png";
import Book from "../svgs/book.png";
import DiscoBall from "../svgs/disco-ball.png";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: StaticImageData;
  effect: string;
}

interface ShopViewProps {
  coins: number;
  onPurchase: (itemId: string) => void;
}

const shopItems: ShopItem[] = [
  {
    id: "robot",
    name: "Robot",
    description: "Hire a robot sitter to prevent stat decay for 24 hours",
    price: 10,
    image: Robot,
    effect: "Prevents stat decay for 24 hours",
  },
  {
    id: "discoball",
    name: "Disco Ball",
    description: "Instantly increase happiness to full",
    price: 5,
    image: DiscoBall,
    effect: "Instantly increases happiness to full",
  },
  {
    id: "pill",
    name: "Multivitamin",
    description: "A health boost for your Kodomochi",
    price: 10,
    image: Pill,
    effect: "Prevents sickness for 24 hours",
  },
  {
    id: "cookbook",
    name: "Gourmet Cookbook",
    description: "Learn to cook special meals for the same price",
    price: 50,
    image: Book,
    effect: "Unlocks special meals that provide better nutrition",
  },
];

export default function ShopView({ coins, onPurchase }: ShopViewProps) {
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  return (
    <div className=''>
      <div className='flex justify-between p-2'>
        <div className='absolute top-2 flex items-center text-2xl'>
          <span className='font-bold'>Shop</span>{" "}
        </div>
        <div className='absolute top-2 right-2 flex items-center text-2xl'>
          <Image
            className='mr-2'
            width={20}
            height={20}
            alt='coin'
            src={Coin}
          />
          <span className='font-bold'>{coins}</span>
        </div>
      </div>
      <div className='grid grid-cols-2 md:grid-cols-2 gap-4 p-2'>
        {shopItems.map((item) => (
          <div
            key={item.id}
            className='cursor-pointer p-2 border'
            onClick={() => setSelectedItem(item)}
          >
            <div>
              <div className='text-2xl'>{item.name}</div>
              <div>{item.description}</div>
            </div>
            <div>
              <div className='flex justify-center'>
                <Image
                  src={item.image}
                  alt={item.name}
                  width={50}
                  height={50}
                />
              </div>
            </div>
            <div className='flex justify-between mt-2'>
              <div className='flex items-center '>
                <Image
                  src={Coin}
                  width={20}
                  height={20}
                  alt='coin'
                  className='mr-1'
                />
                <span className='text-xl'>{item.price}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPurchase(item.id);
                }}
                disabled={coins < item.price}
                className={`bg-green-500 text-xl text-white p-1 px-4 ${
                  coins < item.price ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>
      {selectedItem && (
        <div className='fixed inset-0 z-10 bg-white  flex items-center justify-center p-4'>
          <div className='w-full max-w-md border-4 border-black p-2'>
            <div>
              <div className='text-4xl'>{selectedItem.name}</div>
              <div className='text-xl'>{selectedItem.description}</div>
            </div>
            <div>
              <Image
                src={selectedItem.image}
                alt={selectedItem.name}
                width={100}
                height={100}
                className='mx-auto'
              />
              <p className='mt-4'>
                <strong>Effect:</strong> {selectedItem.effect}
              </p>
            </div>
            <div className='flex justify-between'>
              <button
                className='bg-red-500 hover:bg-red-600 text-white p-2 px-4'
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
              <button
                onClick={() => {
                  onPurchase(selectedItem.id);
                  setSelectedItem(null);
                }}
                disabled={coins < selectedItem.price}
              >
                Buy for {selectedItem.price} coins
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
