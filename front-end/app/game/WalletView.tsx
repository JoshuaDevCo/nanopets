interface WalletViewProps {
  coins: number;
  weight: number;
  careMistakes: number;
  resetTamagotchi: () => void;
}

export default function WalletView({
  coins,
  weight,
  careMistakes,
  resetTamagotchi,
}: WalletViewProps) {
  return (
    <div className='p-4 w-full'>
      <h2 className='text-6xl font-bold mb-4'>Wallet</h2>
      <p className='mb-4 text-2xl'>Coins: {coins}</p>
      <div className='flex gap-2 mb-4'>
        <button
          onClick={resetTamagotchi}
          className='bg-red-500 hover:bg-red-600 text-white'
        >
          Reset Tamagotchi
        </button>
      </div>
      <h2 className='text-4xl font-bold my-4'>Stats</h2>
      <p className='text-lg'>Weight: {weight}</p>
      <p className='text-lg'>Care Mistakes: {careMistakes}</p>
    </div>
  );
}
