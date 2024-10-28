import Image from "next/image";

interface MinigameViewProps {
  isGameInProgress: boolean;
  gameResult: string | null;
  play: () => void;
}

export default function MinigameView({
  isGameInProgress,
  gameResult,
  play,
}: MinigameViewProps) {
  return (
    <div className='p-4 w-full flex flex-col items-center justify-center'>
      <Image
        src='/svgs/gambling.png'
        alt='Playing Card'
        width={200}
        height={300}
        className='mb-4'
      />
      {isGameInProgress ? (
        <>
          <h2 className='text-2xl font-bold mb-4'>Guess the next card!</h2>
          <div className='flex gap-4'>
            <button
              onClick={play}
              className='bg-blue-500 hover:bg-blue-600 text-white'
            >
              Higher
            </button>
            <button
              onClick={play}
              className='bg-red-500 hover:bg-red-600 text-white'
            >
              Lower
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className='text-4xl font-bold mb-4'>{gameResult}</h2>
          <p className='text-xl'>
            {gameResult === "You won!"
              ? "Great job! Your Tamagotchi is happier now."
              : "Better luck next time! Your Tamagotchi still had fun."}
          </p>
        </>
      )}
    </div>
  );
}
