import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import Button from "./Button";

import Heart from "../svgs/heart.png";

interface LoadingProps {
  icons: {
    Rice: StaticImageData;
    Candy: StaticImageData;
    Sun: StaticImageData;
    Console: StaticImageData;
    Flask: StaticImageData;
    WaterDrop: StaticImageData;
    Speaker: StaticImageData;
    MoneyBag: StaticImageData;
    Trophy: StaticImageData;
  };
}

export default function NotOpenTelegram({ icons }: LoadingProps) {
  return (
    <>
      <div className='flex-grow   flex flex-col items-center justify-center relative'>
        <div className=' p-8 max-w-md w-full space-y-6 text-center flex flex-col items-center justify-center'>
          <Image
            src={Heart}
            width={70}
            height={70}
            alt='heart'
            className='animate-pulse'
          />
          <h2 className='text-2xl font-bold text-gray-800'>
            How did you get here? This app should only be open in Telegram.
          </h2>
          <a
            className='bg-blue-500 hover:bg-blue-600 text-white p-2'
            href='t.me/KodoMochiBot'
            target='_blank'
          >
            Open In Telegram
          </a>
        </div>
      </div>
    </>
  );
}
