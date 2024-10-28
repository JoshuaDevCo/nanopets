import Image, { StaticImageData } from "next/image";

interface StatIconsProps {
  label: string;
  value: number;
  icon: StaticImageData;
  icon2: StaticImageData;
}

export default function StatIcons({
  label,
  value,
  icon,
  icon2,
}: StatIconsProps) {
  return (
    <div className='mb-2'>
      <div className='flex'>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='mr-1'>
            {i < value ? (
              <Image width={20} height={20} alt={`${label} Icon`} src={icon} />
            ) : (
              <Image
                width={20}
                height={20}
                alt={`${label} Empty Icon`}
                src={icon2}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
