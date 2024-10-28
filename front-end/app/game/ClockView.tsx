import Image, { StaticImageData } from "next/image";
import Button from "./Button";

interface ClockViewProps {
  clockTime: number;
  setClockTime: (time: number) => void;
  setTime: () => void;
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

export default function ClockView({
  clockTime,
  setClockTime,
  setTime,
  icons,
}: ClockViewProps) {
  return (
    <>
      <div className='grid grid-cols-5 gap-4 p-2'>
        <Button onClick={() => {}} icon={icons.Rice} disabled={true} />
        <Button onClick={() => {}} icon={icons.Candy} disabled={true} />
        <Button onClick={() => {}} icon={icons.Sun} disabled={true} />
        <Button onClick={() => {}} icon={icons.Console} disabled={true} />
        <Button onClick={() => {}} icon={icons.Flask} disabled={true} />
      </div>

      <div className='flex-grow border border-gray-600 flex flex-col items-center justify-center relative'>
        <h2 className='text-2xl font-bold mb-4'>Hatch your Tama</h2>
        <div className='relative'>
          <Image src='/egg1.gif' alt='pet' width={200} height={200} />
        </div>
        <p className='mb-4 p-2 text-center text-sm font-bold'>
          Tama's sleep between 9pm and 9am and do not require attention during
          those times.*
        </p>
        <input
          type='time'
          value={`${String(clockTime).padStart(2, "0")}:00`}
          onChange={(e) => {
            const [hours] = e.target.value.split(":");
            setClockTime(parseInt(hours));
          }}
          className='mb-4 p-2 border rounded'
        />
        <button
          onClick={setTime}
          className='bg-blue-500 text-white px-4 py-2 rounded'
        >
          Set your time
        </button>
      </div>

      <div className='grid grid-cols-4 gap-4 p-2'>
        <Button onClick={() => {}} icon={icons.WaterDrop} disabled={true} />
        <Button onClick={() => {}} icon={icons.Speaker} disabled={true} />
        <Button onClick={() => {}} icon={icons.MoneyBag} disabled={true} />
        <Button onClick={() => {}} icon={icons.Trophy} disabled={true} />
      </div>
    </>
  );
}
