import Image, { StaticImageData } from "next/image";

interface ButtonProps {
  onClick: () => void;
  icon: StaticImageData;
  disabled: boolean;
}

export default function Button({ onClick, icon, disabled }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2 duration-200 flex justify-center ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={disabled}
    >
      <Image width={30} height={30} alt='Icon' src={icon} />
    </button>
  );
}
