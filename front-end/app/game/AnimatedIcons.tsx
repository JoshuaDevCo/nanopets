import Image, { StaticImageData } from "next/image";

interface AnimatedIconProps {
  icon: StaticImageData;
  value: number;
  x: number;
  y: number;
}

export default function AnimatedIcon({ icon, value, x, y }: AnimatedIconProps) {
  return (
    <div
      className='absolute animate-float-up pointer-events-none'
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className='flex items-center bg-white px-2 py-1 border-2 border-black'>
        <Image width={20} height={20} alt='Icon' src={icon} />
        <span className='ml-1 text-sm font-bold'>
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
    </div>
  );
}
