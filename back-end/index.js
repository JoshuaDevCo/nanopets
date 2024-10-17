const express = require("express");
const Redis = require("ioredis");

require("dotenv").config();

const {
  ToadScheduler,
  SimpleIntervalJob,
  AsyncTask,
} = require("toad-scheduler");
const cors = require("cors");

const app = express();
const redis = new Redis(process.env.REDIS_URL);
const scheduler = new ToadScheduler();

app.use(cors());
app.use(express.json());

// API endpoints
app.get("/api/tamagotchi/:userId", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  res.json(tamagotchi);
});

app.post("/api/tamagotchi/:userId", async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  await updateTamagotchi(userId, updates);
  const updatedTamagotchi = await getTamagotchi(userId);
  res.json(updatedTamagotchi);
});

app.post("/api/tamagotchi", async (req, res) => {
  const userId = Math.random().toString(36).substring(7);
  const newTamagotchi = {
    hunger: 50,
    happiness: 50,
    health: 100,
    age: 0,
    poop: 0,
    isCrying: false,
    isHatched: false,
    coins: 0,
    pet: "egg",
    hatchProgress: 0,
    light: true,
  };
  await updateTamagotchi(userId, newTamagotchi);
  await redis.sadd("tamagotchi:users", userId);
  res.json({ userId, ...newTamagotchi });
});

// Redis operations
async function getTamagotchi(userId) {
  const keys = await redis.keys(`tamagotchi:${userId}:*`);
  const values = await redis.mget(keys);
  return keys.reduce((obj, key, index) => {
    const field = key.split(":")[2];
    obj[field] = ["isCrying", "isHatched", "light"].includes(field)
      ? values[index] === "true"
      : Number(values[index]);
    return obj;
  }, {});
}

async function updateTamagotchi(userId, updates) {
  const multi = redis.multi();
  Object.entries(updates).forEach(([key, value]) => {
    multi.set(`tamagotchi:${userId}:${key}`, value);
  });
  await multi.exec();
}

// Toad Scheduler for periodic updates
const updateTask = new AsyncTask(
  "update tamagotchis",
  async () => {
    const userIds = await redis.smembers("tamagotchi:users");
    for (const userId of userIds) {
      await updateTamagotchiState(userId);
    }
  },
  (err) => {
    console.error("Error updating tamagotchis:", err);
  }
);

const job = new SimpleIntervalJob(
  { minutes: 10, runImmediately: true },
  updateTask
);
scheduler.addSimpleIntervalJob(job);

async function updateTamagotchiState(userId) {
  const tamagotchi = await getTamagotchi(userId);
  if (tamagotchi.isHatched) {
    const updates = {
      hunger: Math.max(0, tamagotchi.hunger - 1),
      happiness: Math.max(0, tamagotchi.happiness - 1),
      health: Math.max(0, tamagotchi.health - 0.5),
      age: tamagotchi.age + 1,
      poop: Math.min(5, tamagotchi.poop + 0.2),
      isCrying: Math.random() < 0.05,
    };
    await updateTamagotchi(userId, updates);
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

// Graceful shutdown
process.on("SIGINT", () => {
  scheduler.stop();
  redis.quit();
  process.exit(0);
});
