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
    origin: ["http://localhost:3000", "https://nanopets.vercel.app/*"],
    methods: ["GET", "POST", "OPTIONS"],
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
const MIN_WEIGHT = 1;
const MAX_WEIGHT = 10;

// Helper function to get Tamagotchi data
async function getTamagotchi(userId) {
  const tamagotchi = await redis.hgetall(`tamagotchi:${userId}`);
  return {
    ...tamagotchi,
    hunger: parseInt(tamagotchi.hunger),
    happiness: parseInt(tamagotchi.happiness),
    age: parseInt(tamagotchi.age),
    weight: parseInt(tamagotchi.weight),
    poop: parseInt(tamagotchi.poop),
    careMistakes: parseInt(tamagotchi.careMistakes),
    isSleeping: tamagotchi.isSleeping === "true",
    isSick: tamagotchi.isSick === "true",
    isLightOn: tamagotchi.isLightOn === "true",
    coins: parseInt(tamagotchi.coins),
    clockTime: parseFloat(tamagotchi.clockTime),
    timeSet: tamagotchi.timeSet === "true",
    lastUpdateTime: parseInt(tamagotchi.lastUpdateTime),
  };
}
// Helper function to update Tamagotchi data
async function updateTamagotchi(userId, updates) {
  await redis.hmset(`tamagotchi:${userId}`, updates);
}

// New Tamagotchi
app.post("/api/tamagotchi", async (req, res) => {
  const { userId } = req.body;

  // Check if a Tamagotchi already exists for this user
  const existingTamagotchi = await redis.exists(`tamagotchi:${userId}`);
  if (existingTamagotchi) {
    const tamagotchi = await getTamagotchi(userId);
    return res.json({ userId, ...tamagotchi });
  }

  const newTamagotchi = {
    hunger: START_STATS,
    happiness: START_STATS,
    age: 1,
    weight: 5,
    poop: 0,
    careMistakes: 0,
    isSleeping: false,
    isSick: false,
    isLightOn: true,
    coins: 0,
    clockTime: 12,
    timeSet: false,
    lastUpdateTime: Date.now(),
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

app.post("/api/tamagotchi/:userId/setTime", async (req, res) => {
  const { userId } = req.params;
  const { hours, minutes } = req.body;
  const tamagotchi = await getTamagotchi(userId);

  if (tamagotchi.timeSet) {
    return res.status(400).json({ error: "Time has already been set" });
  }

  const clockTime = hours + minutes / 60; // Store time as a decimal (e.g., 14.5 for 2:30 PM)
  const updates = {
    clockTime: clockTime,
    timeSet: true,
    lastUpdateTime: Date.now(),
  };

  // Check if it's sleep time (9 PM to 9 AM)
  const isSleepTime = clockTime >= 21 || clockTime < 9;

  if (isSleepTime) {
    updates.isSleeping = true;
    updates.isLightOn = false;
  } else {
    updates.isSleeping = false;
    updates.isLightOn = true;
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
    if (action == "revive") {
      const cost = 10;
      if (tamagotchi.coins < cost) {
        return res.status(400).json({ error: "Not enough coins" });
      }
      updates.careMistakes = 0;
      updates.coins = tamagotchi.coins - cost;
      updates.age = 1;
      updates.weight = 5;
      updates.poop = 0;
      updates.careMistakes = 0;
      updates.hunger = START_STATS;
      updates.happiness = START_STATS;
      updates.timeSet = false;
    } else return res.status(400).json({ error: "Tamagotchi has passed away" });
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
        updates.weight = Math.min(tamagotchi.weight + 1, MAX_WEIGHT);
      } else if (foodType === "candy") {
        updates.happiness = Math.min(tamagotchi.happiness + 1, MAX_STATS);
        updates.weight = Math.min(tamagotchi.weight + 1, MAX_WEIGHT);
      }

      if (updates.weight >= MAX_WEIGHT) {
        updates.isSick = true;
      }

      updates.coins = tamagotchi.coins - cost;
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
      await updateTamagotchi(userId, updates);
      const updatedTamagotchi = await getTamagotchi(userId);
      res.json({ ...updatedTamagotchi, won });
      io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
      return;
    case "clean":
      if (tamagotchi.poop == 0) {
        return res.status(400).json({ error: "No coins to collect" });
      }
      updates.poop = 0;
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
      if (tamagotchi.careMistakes < CARE_MISTAKE_LIMIT) {
        return res.status(400).json({ error: "Still alive" });
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
    const currentTime = Date.now();
    for (const userId of userIds) {
      const tamagotchi = await getTamagotchi(userId);

      if (tamagotchi.careMistakes >= CARE_MISTAKE_LIMIT) {
        continue; // Skip this Tamagotchi and move to the next one
      }

      const updates = {};

      // Calculate elapsed time in minutes
      const elapsedMinutes =
        (currentTime - tamagotchi.lastUpdateTime) / (60 * 1000);

      // Update clock time
      updates.clockTime = (tamagotchi.clockTime + elapsedMinutes / 60) % 24;

      // Sleep mechanics
      const isSleepTime = updates.clockTime >= 21 || updates.clockTime < 9;

      if (!tamagotchi.isSleeping) {
        // Care mistakes
        if (tamagotchi.hunger === 0 || tamagotchi.happiness === 0) {
          updates.careMistakes = tamagotchi.careMistakes + 1;
        }
        if (tamagotchi.isSick) {
          updates.careMistakes = tamagotchi.careMistakes + 1;
        }
        if (tamagotchi.poop >= POOP_LIMIT) {
          updates.careMistakes = tamagotchi.careMistakes + 1;
          updates.poop = 0;
        }

        // Give coins via poop if user has no coins left.
        if (tamagotchi.coins == 0) {
          if (tamagotchi.poop <= POOP_LIMIT) {
            updates.poop = tamagotchi.poop + 1;
          }
        }

        // Stat decay
        if (Math.random() < 0.25)
          updates.hunger = Math.max(tamagotchi.hunger - 1, 0);
        if (Math.random() < 0.25)
          updates.happiness = Math.max(tamagotchi.happiness - 1, 0);

        // Random events
        if (Math.random() < 0.1) updates.isSick = true;
        if (tamagotchi.poop < POOP_LIMIT) {
          if (Math.random() < 0.1) updates.poop = tamagotchi.poop + 1;
        }
      }

      if (isSleepTime && !tamagotchi.isSleeping) {
        updates.isSleeping = true;
      } else if (!isSleepTime && tamagotchi.isSleeping) {
        updates.isSleeping = false;
        updates.isLightOn = true; // Turn light on when waking up
        updates.careMistakes = 0; // Reset care mistakes
        // Age increase
        updates.age = tamagotchi.age + 1;
        updates.poop = tamagotchi.poop + 1;
      }

      // Increment time
      updates.lastUpdateTime = currentTime;

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
  { minutes: 5, runImmediately: true },
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
