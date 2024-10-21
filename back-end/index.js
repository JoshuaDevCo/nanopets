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

const MAX_STATS = 5;
const CARE_MISTAKE_LIMIT = 3;
const POOP_LIMIT = 3;
const CALL_RESPONSE_TIME = 15 * 60 * 1000;

// Helper function to get Tamagotchi data
async function getTamagotchi(userId) {
  const tamagotchi = await redis.hgetall(`tamagotchi:${userId}`);
  return {
    ...tamagotchi,
    hunger: parseInt(tamagotchi.hunger),
    happiness: parseInt(tamagotchi.happiness),
    discipline: parseInt(tamagotchi.discipline),
    age: parseInt(tamagotchi.age),
    weight: parseInt(tamagotchi.weight),
    poop: parseInt(tamagotchi.poop),
    careMistakes: parseInt(tamagotchi.careMistakes),
    lifespan: parseInt(tamagotchi.lifespan),
    isSleeping: tamagotchi.isSleeping === "true",
    isSick: tamagotchi.isSick === "true",
    isLightOn: tamagotchi.isLightOn === "true",
    isHatched: tamagotchi.isHatched === "true",
    hatchProgress: tamagotchi.hatchProgress,
    coins: parseInt(tamagotchi.coins),
    lastFed: parseInt(tamagotchi.lastFed),
    lastPlayed: parseInt(tamagotchi.lastPlayed),
    lastCleaned: parseInt(tamagotchi.lastCleaned),
    lastCall: parseInt(tamagotchi.lastCall),
  };
}

// Helper function to update Tamagotchi data
async function updateTamagotchi(userId, updates) {
  await redis.hmset(`tamagotchi:${userId}`, updates);
}

// New Tama
app.post("/api/tamagotchi", async (req, res) => {
  const userId = Math.random().toString(36).substring(7);
  const newTamagotchi = {
    hunger: MAX_STATS,
    happiness: MAX_STATS,
    discipline: MAX_STATS,
    age: 1,
    weight: 5,
    poop: 0,
    careMistakes: 0,
    lifespan: 100,
    isSleeping: false,
    isSick: false,
    isLightOn: true,
    isHatched: true,
    hatchProgress: 10,
    coins: 20,
    lastFed: Date.now(),
    lastPlayed: Date.now(),
    lastCleaned: Date.now(),
    lastCall: Date.now(),
  };
  await updateTamagotchi(userId, newTamagotchi);
  await redis.sadd("tamagotchi:users", userId);
  res.json({ userId, ...newTamagotchi });
});

// Get Tamagotchi data
app.get("/api/tamagotchi/:userId", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  res.json(tamagotchi);
});

app.post("/api/tamagotchi/:userId/:action", async (req, res) => {
  const { userId, action } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const updates = {};

  switch (action) {
    case "feed":
      const { foodType } = req.body;
      if (foodType === "rice") {
        updates.hunger = Math.min(tamagotchi.hunger + 1, MAX_STATS);
        updates.weight = tamagotchi.weight + 1;
      } else if (foodType === "candy") {
        updates.happiness = Math.min(tamagotchi.happiness + 1, MAX_STATS);
        updates.weight = tamagotchi.weight + 1;
      }
      updates.lastFed = Date.now();
      break;
    case "play":
      const won = Math.random() < 0.5; // 50% chance of winning
      updates.happiness = Math.min(
        tamagotchi.happiness + (won ? 1 : 0),
        MAX_STATS
      );
      updates.weight = Math.max(tamagotchi.weight - 1, 1);
      updates.lastPlayed = Date.now();
      await updateTamagotchi(userId, updates);
      const updatedTamagotchi = await getTamagotchi(userId);
      res.json({ ...updatedTamagotchi, won });
      io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
      return;
    case "clean":
      updates.poop = 0;
      updates.lastCleaned = Date.now();
      break;
    case "toggleLight":
      updates.isLightOn = !tamagotchi.isLightOn;
      break;
    case "discipline":
      updates.discipline = Math.min(tamagotchi.discipline + 1, MAX_STATS);
      break;
    case "medicine":
      if (tamagotchi.isSick) {
        updates.isSick = false;
        updates.health = Math.min(tamagotchi.health + 1, MAX_STATS);
      } else {
        updates.isSick = false;
      }
      break;
    case "answerCall":
      if (Date.now() - tamagotchi.lastCall <= CALL_RESPONSE_TIME) {
        updates.happiness = Math.min(tamagotchi.happiness + 1, MAX_STATS);
      }
      updates.lastCall = Date.now();
      break;
  }

  await updateTamagotchi(userId, updates);
  const updatedTamagotchi = await getTamagotchi(userId);
  res.json(updatedTamagotchi);
  io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
});

// Periodic updates
const updateTask = new AsyncTask(
  "update-tamagotchis",
  async () => {
    const userIds = await redis.smembers("tamagotchi:users");
    for (const userId of userIds) {
      const tamagotchi = await getTamagotchi(userId);
      const updates = {};
      const now = Date.now();

      // Stat decay
      updates.hunger = Math.max(tamagotchi.hunger - 1, 0);
      updates.happiness = Math.max(tamagotchi.happiness - 1, 0);
      updates.discipline = Math.max(tamagotchi.discipline - 1, 0);

      // Age increase
      updates.age = tamagotchi.age + 1;

      // Random events
      if (Math.random() < 0.1) updates.isSick = true;
      if (Math.random() < 0.2) updates.isSleeping = !tamagotchi.isSleeping;
      if (Math.random() < 0.3) updates.poop = tamagotchi.poop + 1;

      // Care mistakes
      if (tamagotchi.hunger === 0 || tamagotchi.happiness === 0) {
        updates.careMistakes = tamagotchi.careMistakes + 1;
      }
      if (tamagotchi.isSleeping && tamagotchi.isLightOn) {
        updates.careMistakes = tamagotchi.careMistakes + 1;
      }
      if (tamagotchi.isSick && now - tamagotchi.lastCall > 2 * 60 * 60 * 1000) {
        updates.careMistakes = tamagotchi.careMistakes + 1;
      }
      if (tamagotchi.poop >= POOP_LIMIT) {
        updates.careMistakes = tamagotchi.careMistakes + 1;
        updates.poop = 0;
      }

      // Lifespan calculation
      updates.lifespan = Math.max(
        tamagotchi.lifespan -
          updates.careMistakes -
          Math.max(tamagotchi.weight - 10, 0),
        0
      );

      await updateTamagotchi(userId, updates);
      const updatedTamagotchi = await getTamagotchi(userId);
      io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
    }
  },
  (err) => {
    console.error("Error in update task:", err);
  }
);

const updateJob = new SimpleIntervalJob(
  { minutes: 15, runImmediately: true },
  updateTask
);

scheduler.addSimpleIntervalJob(updateJob);

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

// Hatch egg
/* app.post("/api/tamagotchi/:userId/hatch", async (req, res) => {
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
}); */

// Earn coins (simple implementation)
/* app.post("/api/tamagotchi/:userId/earnCoins", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const earnedCoins = Math.floor(Math.random() * 10) + 1; // Earn 1-10 coins randomly
  const updates = {
    coins: tamagotchi.coins + earnedCoins,
  };
  await updateTamagotchi(userId, updates);
  res.json(await getTamagotchi(userId));
});
 */
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));

// Graceful shutdown
process.on("SIGINT", () => {
  scheduler.stop();
  redis.quit();
  process.exit(0);
});
