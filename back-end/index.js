// server.js
const express = require("express");
const http = require("http");
require("dotenv").config();
const { Server } = require("socket.io");
const Redis = require("ioredis");
const {
  ToadScheduler,
  SimpleIntervalJob,
  AsyncTask,
} = require("toad-scheduler");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const redis = new Redis(process.env.REDIS_URL);
const scheduler = new ToadScheduler();

app.use(cors());
app.use(express.json());

// Helper function to get Tamagotchi data
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

// Helper function to update Tamagotchi data
async function updateTamagotchi(userId, updates) {
  const multi = redis.multi();
  Object.entries(updates).forEach(([key, value]) => {
    multi.set(`tamagotchi:${userId}:${key}`, value);
  });
  await multi.exec();
  const updatedTamagotchi = await getTamagotchi(userId);
  io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
}

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User joined room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Get Tamagotchi data
app.get("/api/tamagotchi/:userId", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  res.json(tamagotchi);
});

// Feed Tamagotchi
app.post("/api/tamagotchi/:userId/feed", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const updates = {
    hunger: Math.max(0, Math.min(100, tamagotchi.hunger + 20)),
    poop: Math.min(5, tamagotchi.poop + 1),
  };
  await updateTamagotchi(userId, updates);
  res.json(await getTamagotchi(userId));
});

// Play with Tamagotchi
app.post("/api/tamagotchi/:userId/play", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const updates = {
    happiness: Math.min(100, tamagotchi.happiness + 20),
  };
  await updateTamagotchi(userId, updates);
  res.json(await getTamagotchi(userId));
});

// Clean Tamagotchi
app.post("/api/tamagotchi/:userId/clean", async (req, res) => {
  const { userId } = req.params;
  const updates = { poop: 0 };
  await updateTamagotchi(userId, updates);
  res.json(await getTamagotchi(userId));
});

// Toggle light
app.post("/api/tamagotchi/:userId/toggleLight", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const updates = { light: !tamagotchi.light };
  await updateTamagotchi(userId, updates);
  res.json(await getTamagotchi(userId));
});

// Give medicine
app.post("/api/tamagotchi/:userId/medicine", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const updates = {
    health: Math.min(100, tamagotchi.health + 30),
  };
  await updateTamagotchi(userId, updates);
  res.json(await getTamagotchi(userId));
});

// Discipline Tamagotchi
app.post("/api/tamagotchi/:userId/discipline", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const updates = {
    isCrying: false,
    discipline: Math.min(100, tamagotchi.discipline + 20),
  };
  await updateTamagotchi(userId, updates);
  res.json(await getTamagotchi(userId));
});

// Hatch egg
app.post("/api/tamagotchi/:userId/hatch", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  if (tamagotchi.isHatched) {
    return res.status(400).json({ error: "Tamagotchi is already hatched" });
  }
  const newProgress = Math.min(10, (tamagotchi.hatchProgress || 0) + 1);
  const updates = {
    hatchProgress: newProgress,
    coins: tamagotchi.coins + 1,
  };
  if (newProgress >= 10) {
    updates.isHatched = true;
    updates.pet = "/baby1.gif"; // You might want to randomize this
    updates.coins += 9; // Additional coins for hatching
  }
  await updateTamagotchi(userId, updates);
  res.json(await getTamagotchi(userId));
});

// Create new Tamagotchi
app.post("/api/tamagotchi", async (req, res) => {
  const userId = Math.random().toString(36).substring(7);
  const newTamagotchi = {
    hunger: 50,
    happiness: 50,
    health: 100,
    discipline: 50,
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

// Get leaderboard
app.get("/api/leaderboard", async (req, res) => {
  const userIds = await redis.smembers("tamagotchi:users");
  const leaderboard = await Promise.all(
    userIds.map(async (userId) => {
      const coins = await redis.get(`tamagotchi:${userId}:coins`);
      return { userId, coins: Number(coins) };
    })
  );
  leaderboard.sort((a, b) => b.coins - a.coins);
  res.json(leaderboard.slice(0, 10)); // Return top 10
});

// Earn coins (simple implementation)
app.post("/api/tamagotchi/:userId/earnCoins", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const earnedCoins = Math.floor(Math.random() * 10) + 1; // Earn 1-10 coins randomly
  const updates = {
    coins: tamagotchi.coins + earnedCoins,
  };
  await updateTamagotchi(userId, updates);
  res.json(await getTamagotchi(userId));
});

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
  { minutes: 3, runImmediately: true },
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
      discipline: Math.max(0, tamagotchi.discipline - 0.5),
      age: tamagotchi.age + 1,
      poop: Math.min(5, tamagotchi.poop + 0.2),
      isCrying: Math.random() < 0.05,
    };
    await updateTamagotchi(userId, updates);
  }
}

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));

// Graceful shutdown
process.on("SIGINT", () => {
  scheduler.stop();
  redis.quit();
  process.exit(0);
});
