import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className='min-h-screen flex flex-col bg-gray-100 text-black'>
      <header className='p-4 flex justify-between items-center '>
        <div className='flex gap-2'>
          <Link
            href='https://twitter.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            <button className='bg-black text-white p-2 px-4 text-2xl'>
              <span className=''>X</span>
            </button>
          </Link>
          <Link
            href='https://github.com'
            target='_blank'
            rel='noopener noreferrer'
          >
            <button className='bg-black text-white p-2 px-4 text-2xl'>
              <span className=''>Telegram</span>
            </button>
          </Link>
        </div>

        <button className='bg-black text-white p-2 px-4 text-4xl'>Deck</button>
      </header>

      <main className='flex-grow flex flex-col items-center justify-center text-center px-4 py-32'>
        <Image src='/egg1.gif' width={200} height={200} alt='kodomochi egg' />
        <h1 className='text-6xl font-bold mt-6'>KODOMOCHI</h1>
        <h2 className='text-4xl font-bold '>
          Your virtual pet adventure awaits!
        </h2>
        <p className='text-2xl mb-8 max-w-md'>
          Keep your Kodomochi happy and healthy. <br /> Earn daily tokens, shop
          items, complete adventures, invite friends and more.
        </p>
        <button className='bg-black text-white p-2 px-4 text-4xl'>
          Play Beta Now
        </button>
        <p className='bg-red-500 px-2 text-xl mt-10'>
          TOKEN CURRENTLY ONLY ON THE TON TESTNET AND IS NOT TRADEABLE!!
        </p>
      </main>

      <section className='py-16 px-4 mt-20 bg-white relative'>
        <h2 className='text-4xl font-bold text-center mb-12'>Roadmap</h2>
        {/* Timeline line */}
        <div className='absolute left-1/2 top-32 bottom-8 w-0.5 bg-black -translate-x-1/2' />
        <div className='max-w-6xl mx-auto relative'>
          <div className='space-y-24'>
            {/* Q4 2024 */}
            <div className='flex items-center justify-center'>
              <div className='grid grid-cols-2 gap-8 w-full'>
                <div className='text-right pr-8'>
                  <RoadmapCard
                    title='Q4 2024'
                    items={[
                      "Launch beta game version",
                      "Core gameplay mechanics",
                      "Earn testnet tokens on Ton blockchain",
                      "Spend tokens on shop upgrades",
                    ]}
                  />
                </div>
                <div className='pl-8'>{/* Empty space for alignment */}</div>
              </div>
            </div>

            {/* Q1 2025 */}
            <div className='flex items-center justify-center'>
              <div className='grid grid-cols-2 gap-8 w-full'>
                <div className='text-right pr-8'>
                  {/* Empty space for alignment */}
                </div>
                <div className='pl-8'>
                  <RoadmapCard
                    title='Q1 2025'
                    items={[
                      "Season 1 launch",
                      "Introduce multiplayer features",
                      "Launch community-building initiatives",
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Q2 2025 */}
            <div className='flex items-center justify-center'>
              <div className='grid grid-cols-2 gap-8 w-full'>
                <div className='text-right pr-8'>
                  <RoadmapCard
                    title='Q2 2025'
                    items={[
                      "Mainnet launch with airdrop",
                      "Expand marketing efforts",
                      "Introduce competitive gameplay elements",
                    ]}
                  />
                </div>
                <div className='pl-8'>{/* Empty space for alignment */}</div>
              </div>
            </div>

            {/* Beyond */}
            <div className='flex items-center justify-center'>
              <div className='grid grid-cols-2 gap-8 w-full'>
                <div className='text-right pr-8'>
                  {/* Empty space for alignment */}
                </div>
                <div className='pl-8'>
                  <RoadmapCard
                    title='BEYOND'
                    items={[
                      "Token listings",
                      "Season 2 launch",
                      "Ad network integration",
                      "New games and updates",
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className='bg-white py-8 px-4'>
        <div className='max-w-6xl mx-auto flex flex-col md:flex-row justify-center items-center'>
          <div className='flex space-x-4'>
            <Link
              href='https://twitter.com'
              target='_blank'
              rel='noopener noreferrer'
            >
              <button className='bg-black text-white p-2 px-4 text-2xl'>
                <span className=''>X</span>
              </button>
            </Link>
            <Link
              href='https://github.com'
              target='_blank'
              rel='noopener noreferrer'
            >
              <button className='bg-black text-white p-2 px-4 text-2xl'>
                <span className=''>Telegram</span>
              </button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RoadmapCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className='bg-white/10 border-none'>
      <div>
        <div className='text-3xl'>{title}</div>
      </div>
      <div>
        <ul className='list-disc list-inside text-xl'>
          {items.map((item, index) => (
            <li key={index} className=''>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
