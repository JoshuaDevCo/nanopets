import { useState, useEffect } from "react";

type Activity = {
  userId: string;
  action: string;
  timestamp: number;
};

export default function StatsView() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/activity`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch activity data");
        }
        const data = await response.json();
        setActivities(data);
      } catch (err) {
        setError("Error fetching activity data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
    const intervalId = setInterval(fetchActivities, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return <div>Loading activity feed...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className='w-full max-w-2xl mx-auto p-4'>
      <h2 className='text-6xl font-bold mb-2'>Recent Activities</h2>
      <div>
        {" "}
        <ul className=''>
          {activities.map((activity, index) => (
            <li key={index} className='bg-muted '>
              <span className='font-semibold'>
                User {activity.userId.slice(0, 5)}
              </span>{" "}
              {activity.action}
              <span className='text-sm text-muted-foreground ml-2'>
                {new Date(activity.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
