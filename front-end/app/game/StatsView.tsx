import { useState, useEffect } from "react";

type LeaderboardEntry = {
  userId: string;
  name: string;
  coins: number;
  age: number;
};

export default function StatsView() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }
        const data = await response.json();
        setLeaderboard(data);
      } catch (err) {
        setError("Error fetching leaderboard data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return <div>Loading leaderboard...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className='w-full max-w-2xl mx-auto'>
      <div>
        <div>Tamagotchi Leaderboard</div>
      </div>
      <div>
        <div>
          <div>
            <div>
              <div className='w-[50px]'>Rank</div>

              <div>Coins</div>
              <div>Age</div>
            </div>
          </div>
          <div>
            {leaderboard.map((entry, index) => (
              <div key={entry.userId}>
                <div className='font-medium'>{index + 1}</div>

                <div>{entry.coins}</div>
                <div>{entry.age} days</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
