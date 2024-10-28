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

const START_STATS = 2;
const MAX_STATS = 5;
const CARE_MISTAKE_LIMIT = 10;
const POOP_LIMIT = 3;
const CALL_RESPONSE_TIME = 15 * 60 * 1000;
const MIN_WEIGHT = 1;
const MAX_WEIGHT = 10;

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
    isSleeping: tamagotchi.isSleeping === "true",
    isSick: tamagotchi.isSick === "true",
    isLightOn: tamagotchi.isLightOn === "true",
    coins: parseInt(tamagotchi.coins),
    lastFed: parseInt(tamagotchi.lastFed),
    lastPlayed: parseInt(tamagotchi.lastPlayed),
    lastCleaned: parseInt(tamagotchi.lastCleaned),
    lastCall: parseInt(tamagotchi.lastCall),
    lastCoinDrop: parseInt(tamagotchi.lastCoinDrop),
    clockTime: parseInt(tamagotchi.clockTime),
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
    hunger: START_STATS,
    happiness: START_STATS,
    discipline: 0,
    age: 1,
    weight: 5,
    poop: 0,
    careMistakes: 0,
    isSleeping: false,
    isSick: false,
    isLightOn: true,
    coins: 0,
    lastFed: Date.now(),
    lastPlayed: Date.now(),
    lastCleaned: Date.now(),
    lastCall: Date.now(),
    lastCoinDrop: Date.now() - 15 * 60 * 1000,
    clockTime: 12,
  };
  await updateTamagotchi(userId, newTamagotchi);
  await redis.sadd("tamagotchi:users", userId);
  res.json({ userId, ...newTamagotchi });
});

app.post("/api/tamagotchi/:userId/collectCoin", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const updates = {};

  if (Date.now() - tamagotchi.lastCoinDrop >= 15 * 60 * 1000) {
    // 15 minutes
    updates.coins = tamagotchi.coins + 10;
    updates.lastCoinDrop = Date.now();
    await updateTamagotchi(userId, updates);
    res.json({ success: true, coins: updates.coins });
  } else {
    res.json({ success: false, message: "No coin available yet" });
  }
});

// Get Tamagotchi data
app.get("/api/tamagotchi/:userId", async (req, res) => {
  const { userId } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  res.json(tamagotchi);
});

app.post("/api/tamagotchi/:userId/setTime", async (req, res) => {
  const { userId } = req.params;
  const { time } = req.body;
  const tamagotchi = await getTamagotchi(userId);
  const updates = { clockTime: time };

  // Check if it's sleep time (9 PM to 9 AM)
  const isSleepTime = time >= 21 || time < 9;

  if (isSleepTime) {
    updates.isSleeping = true;
    // Turn off lights if they were on
    if (tamagotchi.isLightOn) {
      updates.isLightOn = false;
    }
  } else {
    updates.isSleeping = false;
    // Turn on lights if they were off
    if (!tamagotchi.isLightOn) {
      updates.isLightOn = true;
    }
  }

  await updateTamagotchi(userId, updates);
  const updatedTamagotchi = await getTamagotchi(userId);
  res.json(updatedTamagotchi);
  io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
});

app.post("/api/tamagotchi/:userId/:action", async (req, res) => {
  const { userId, action } = req.params;
  const tamagotchi = await getTamagotchi(userId);
  const updates = {};

  if (tamagotchi.careMistakes >= CARE_MISTAKE_LIMIT) {
    return res.status(400).json({ error: "Tamagotchi has passed away" });
  }

  switch (action) {
    case "feed":
      const { foodType } = req.body;
      const cost = foodType === "rice" ? 1 : 2;

      if (tamagotchi.coins < cost) {
        return res.status(400).json({ error: "Not enough coins" });
      }

      if (foodType === "rice") {
        updates.hunger = Math.min(tamagotchi.hunger + 1, MAX_STATS);
        (updates.weight = tamagotchi.weight + 1), MAX_WEIGHT;
      } else if (foodType === "candy") {
        updates.happiness = Math.min(tamagotchi.happiness + 1, MAX_STATS);
        (updates.weight = tamagotchi.weight + 2), MAX_WEIGHT;
      }

      if (updates.weight >= MAX_WEIGHT) {
        updates.isSick = true;
      }

      updates.coins = tamagotchi.coins - cost;
      updates.lastFed = Date.now();
      break;
    case "play":
      if (tamagotchi.weight <= MIN_WEIGHT) {
        return res.status(400).json({ error: "Too weak to play" });
      }

      const won = Math.random() < 0.7; // 70% chance of winning
      if (won) {
        updates.happiness = Math.min(tamagotchi.happiness + 1, MAX_STATS);
      }
      updates.weight = Math.max(tamagotchi.weight - 1, MIN_WEIGHT);
      updates.lastPlayed = Date.now();
      await updateTamagotchi(userId, updates);
      const updatedTamagotchi = await getTamagotchi(userId);
      res.json({ ...updatedTamagotchi, won });
      io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
      return;
    case "clean":
      if ((tamagotchi.poop = 0)) {
        return res.status(400).json({ error: "No coins to collect" });
      }
      updates.poop = 0;
      updates.lastCleaned = Date.now();
      updates.coins = tamagotchi.coins + 5;
      break;
    case "toggleLight":
      updates.isLightOn = !tamagotchi.isLightOn;
      if (tamagotchi.isSleeping && updates.isLightOn) {
        updates.careMistakes = tamagotchi.careMistakes + 1;
      }
      break;

    case "medicine":
      if (tamagotchi.isSick) {
        const cost = 1;
        if (tamagotchi.coins < cost) {
          return res.status(400).json({ error: "Not enough coins" });
        }
        updates.isSick = false;
        updates.coins = tamagotchi.coins - cost;
      } else
        return res.status(400).json({ error: "Doesn't need medicine now" });

      break;
    case "revive":
      if (tamagotchi.careMistakes >= CARE_MISTAKE_LIMIT) {
        const cost = 10;
        if (tamagotchi.coins < cost) {
          return res.status(400).json({ error: "Not enough coins" });
        }
        updates.careMistakes = 0;
        updates.coins = tamagotchi.coins - cost;
        updates.hunger = START_STATS;
        updates.happiness = START_STATS;
      }
      break;

    case "attention":
      if (tamagotchi.hunger <= 1 || tamagotchi.happiness <= 1) {
        updates.discipline = tamagotchi.discipline + 1;
        updates.lastCall = Date.now();
      }
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

      // Sleep mechanics
      const currentTime = tamagotchi.clockTime;
      const isSleepTime = currentTime >= 21 || currentTime < 9;

      if (isSleepTime && !tamagotchi.isSleeping) {
        updates.isSleeping = true;
      } else if (!isSleepTime && tamagotchi.isSleeping) {
        updates.isSleeping = false;
        updates.isLightOn = true; // Turn light on when waking up
        // Age increase
        updates.age = tamagotchi.age + 1;
      }

      if (!isSleepTime) {
        // Stat decay
        if (Math.random() < 0.3)
          updates.hunger = Math.max(tamagotchi.hunger - 1, 0);
        if (Math.random() < 0.3)
          updates.happiness = Math.max(tamagotchi.happiness - 1, 0);

        // Random events
        if (Math.random() < 0.1) updates.isSick = true;
        if (Math.random() < 0.3) updates.poop = tamagotchi.poop + 1;

        // Care mistakes
        if (tamagotchi.hunger === 0 || tamagotchi.happiness === 0) {
          updates.careMistakes = tamagotchi.careMistakes + 1;
        }
        if (tamagotchi.isSleeping && tamagotchi.isLightOn) {
          updates.careMistakes = tamagotchi.careMistakes + 1;
        }
        if (
          tamagotchi.isSick &&
          now - tamagotchi.lastCall > 2 * 60 * 60 * 1000
        ) {
          updates.careMistakes = tamagotchi.careMistakes + 1;
        }
        if (tamagotchi.poop >= POOP_LIMIT) {
          updates.careMistakes = tamagotchi.careMistakes + 1;
          updates.poop = 0;
        }
      }

      // Increment time
      updates.clockTime = (currentTime + 1) % 24;

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

const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));

// Graceful shutdown
process.on("SIGINT", () => {
  scheduler.stop();
  redis.quit();
  process.exit(0);
});
