import { useState, useEffect } from "react";
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
    Thunder: StaticImageData;
    GiftBox: StaticImageData;
  };
}

const hints = [
  "Feed your Kodomochi regularly to keep it healthy!",
  "Don't forget to clean up after your Kodomochi to avoid care mistakes.",
  "Playing with your Kodomochi increases its happiness.",
  "Your Kodomochi sleeps between 9 PM and 9 AM. Try not to disturb it!",
  "If your Kodomochi gets sick, give it medicine to help it recover.",
  "Balancing your Kodomochi's diet is key to maintaining a healthy weight.",
  "Earn coins by cleaning up after your Kodomochi.",
  "Watch out for care mistakes! Too many, and your Kodomochi might pass away.",
  "Toggle the light when it's bedtime",
];

export default function Loading({ icons }: LoadingProps) {
  const [hint, setHint] = useState("");

  useEffect(() => {
    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    setHint(randomHint);
  }, []);

  return (
    <>
      <div className='grid grid-cols-5 gap-4 p-2'>
        <Button
          onClick={() => {}}
          icon={icons.Rice}
          disabled={true}
          animate={false}
        />
        <Button
          onClick={() => {}}
          icon={icons.Candy}
          disabled={true}
          animate={false}
        />
        <Button
          onClick={() => {}}
          icon={icons.Console}
          disabled={true}
          animate={false}
        />
        <Button
          onClick={() => {}}
          icon={icons.Flask}
          disabled={true}
          animate={false}
        />
        <Button
          onClick={() => {}}
          icon={icons.WaterDrop}
          disabled={true}
          animate={false}
        />
      </div>

      <div className='flex-grow border border-gray-600 flex flex-col items-center justify-center relative'>
        <div className=' p-8 max-w-md w-full space-y-6 text-center flex flex-col items-center justify-center'>
          <Image
            src={Heart}
            width={70}
            height={70}
            alt='heart'
            className='animate-pulse'
          />
          <h2 className='text-2xl font-bold text-gray-800'>
            Loading your Kodomochi...
          </h2>
          <p className='text-gray-600 italic'>&quot;{hint}&quot;</p>
        </div>
      </div>

      <div className='grid grid-cols-4 gap-4 p-2'>
        <Button
          onClick={() => {}}
          icon={icons.Sun}
          disabled={true}
          animate={false}
        />
        <Button
          onClick={() => {}}
          icon={icons.Thunder}
          disabled={true}
          animate={false}
        />
        <Button
          onClick={() => {}}
          icon={icons.GiftBox}
          disabled={true}
          animate={false}
        />
        <Button
          onClick={() => {}}
          icon={icons.MoneyBag}
          disabled={true}
          animate={false}
        />
      </div>
    </>
  );
}
