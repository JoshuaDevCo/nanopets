import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import Button from "./Button";

interface ClockViewProps {
  setTime: (hours: number, minutes: number) => void;
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
  tamahue: number;
}

export default function ClockView({ setTime, icons, tamahue }: ClockViewProps) {
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);

  const handleSetTime = () => {
    setTime(hours, minutes);
  };

  return (
    <>
      <div className='grid grid-cols-5 gap-4 p-2'>
        <Button onClick={() => {}} icon={icons.Rice} disabled={true} />
        <Button onClick={() => {}} icon={icons.Candy} disabled={true} />

        <Button onClick={() => {}} icon={icons.Console} disabled={true} />
        <Button onClick={() => {}} icon={icons.Flask} disabled={true} />
        <Button onClick={() => {}} icon={icons.WaterDrop} disabled={true} />
      </div>

      <div className=' border border-gray-600 flex flex-col items-center  relative h-[calc(100vh-150px)] overflow-y-scroll'>
        <h2 className='text-2xl font-bold mb-4 mt-2'>Hatch your Kodomochi</h2>
        <div className='relative'>
          <Image
            src='/egg1.gif'
            alt='pet'
            width={200}
            height={200}
            className={`hue-rotate-[${tamahue}deg]`}
          />
        </div>
        <p className='mb-4 p-2 text-center text-sm font-bold'>
          Kodomochi&apos;s sleep between 9pm and 9am and do not require
          attention during those times.*
        </p>
        <div className='flex gap-4 mb-4'>
          <label className='flex flex-col items-center'>
            Hours:
            <input
              type='number'
              min='0'
              max='23'
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value))}
              className='mt-1 p-2 border rounded'
            />
          </label>
          <label className='flex flex-col items-center'>
            Minutes:
            <input
              type='number'
              min='0'
              max='59'
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value))}
              className='mt-1 p-2 border rounded'
            />
          </label>
        </div>
        <button
          onClick={handleSetTime}
          className='bg-blue-500 text-white px-4 py-2 rounded'
        >
          Set your time
        </button>
      </div>

      <div className='grid grid-cols-4 gap-4 p-2'>
        <Button onClick={() => {}} icon={icons.Sun} disabled={true} />

        <Button onClick={() => {}} icon={icons.Speaker} disabled={true} />
        <Button onClick={() => {}} icon={icons.MoneyBag} disabled={true} />
        <Button onClick={() => {}} icon={icons.Trophy} disabled={true} />
      </div>
    </>
  );
}
