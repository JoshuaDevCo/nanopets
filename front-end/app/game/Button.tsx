import Image, { StaticImageData } from "next/image";

interface ButtonProps {
  onClick: () => void;
  icon: StaticImageData;
  disabled: boolean;
  animate: boolean;
}

export default function Button({
  onClick,
  icon,
  disabled,
  animate,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 duration-200 flex justify-center ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${animate ? "animate-grow" : ""}`}
      disabled={disabled}
    >
      <Image width={30} height={30} alt='Icon' src={icon} />
    </button>
  );
}
