import Image from "next/image";

import Heart from "../svgs/heart.png";

export default function NotOpenTelegram() {
  return (
    <div className=' p-8 max-w-md w-full h-screen space-y-6 text-center flex flex-col items-center justify-center'>
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
        href='https://t.me/KodoMochiBot/play'
        target='_blank'
      >
        Open In Telegram
      </a>
    </div>
  );
}
