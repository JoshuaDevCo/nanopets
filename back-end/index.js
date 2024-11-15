// bot testing
const { Bot, InlineKeyboard } = require("grammy");
const bot = new Bot(process.env.BOT_TOKEN);

const firstMenu =
  "<b>Your virtual pet adventure awaits!</b>\n\nKeep your Kodomochi happy and healthy.Earn daily tokens, shop items, complete adventures, invite friends and more.";
const firstMenuMarkup = new InlineKeyboard()
  .url("Play in 1 click", "https://t.me/KodoMochiBot/play")
  .row()
  .text("How to play", "Tutorial")
  .row()
  .url("Subscribe to our channel", "https://t.me/kodomochi");

const Reply =
  "<b>How to play KodoMochi</b>\n\nHatch your KodoMochi.\nEvery night KodoMochi will sleep. Turn the lights off to avoid care mistakes\n\nKeep your KodoMochi alive.\nFeed, Play, Clean and give Medicine to your Kodomochi to keep it alive\n\nNo coins left?\nWait for your KodoMochi to poop in order to earn more coins\n\nConnect your wallet.\nMint a KodoMochi Soul Bound Crown to support the development and gain future percs.\n\n/help to get this guide";
const play = new InlineKeyboard()
  .url("Play in 1 click", "https://t.me/KodoMochiBot/play")
  .row()
  .url("Subscribe to our channel", "https://t.me/kodomochi");

bot.command("start", async (ctx) => {
  await ctx.reply(firstMenu, {
    parse_mode: "HTML",
    reply_markup: firstMenuMarkup,
  });
});

bot.command("help", async (ctx) => {
  await ctx.reply(Reply, {
    parse_mode: "HTML",
    reply_markup: play,
  });
});

bot.on("message", async (ctx) => {
  await ctx.reply(firstMenu, {
    parse_mode: "HTML",
    reply_markup: firstMenuMarkup,
  });
});

//This handler processes next button on the menu
bot.callbackQuery("Tutorial", async (ctx) => {
  //Update message content with corresponding menu section
  await ctx.editMessageText(Reply, {
    reply_markup: play,
    parse_mode: "HTML",
  });
});

// Helper function to send Telegram notification
async function sendTelegramNotification(userId, message) {
  try {
    await bot.api.sendMessage(userId, message);
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
}

//Start the Bot
bot.start();

// game server part:
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
    origin: ["*"],
    methods: ["GET", "POST", "OPTIONS"],
  },
});

const redis = new Redis(process.env.REDIS_URL);
const scheduler = new ToadScheduler();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const START_STATS = 2;
const MAX_STATS = 5;
const CARE_MISTAKE_LIMIT = 10;
const POOP_LIMIT = 3;
const MIN_WEIGHT = 1;
const MAX_WEIGHT = 10;
const VIDEO_REWARD_COOLDOWN = 24 * 60 * 60 * 1000;

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
    lastVideoWatchTime: parseInt(tamagotchi.lastVideoWatchTime),
    referralCount: parseInt(tamagotchi.referralCount) || 0,
    tamahue: parseInt(tamagotchi.tamahue) || 0,
    crowns: parseInt(tamagotchi.crowns) || 0,
  };
}

// Helper function to update Tamagotchi data
async function updateTamagotchi(userId, updates) {
  await redis.hmset(`tamagotchi:${userId}`, updates);
}

// Helper function to log user activity
async function logActivity(userId, action) {
  const activity = JSON.stringify({ userId, action, timestamp: Date.now() });
  await redis.lpush("tamagotchi:activity", activity);
  await redis.ltrim("tamagotchi:activity", 0, 49); // Keep only the last 50 activities
}

//  endpoint to get recent activities
app.get("/api/activity", async (req, res) => {
  try {
    const activities = await redis.lrange("tamagotchi:activity", 0, 49);
    const parsedActivities = activities.map(JSON.parse);
    res.json(parsedActivities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// New Tamagotchi
app.post("/api/tamagotchi", async (req, res) => {
  const { userId, referralCode } = req.body;

  // Check if a Tamagotchi already exists for this user
  const existingTamagotchi = await redis.exists(`tamagotchi:${userId}`);
  if (existingTamagotchi) {
    const tamagotchi = await getTamagotchi(userId);
    return res.json({ userId, ...tamagotchi });
  }

  const randhue = Math.floor(Math.random() * 360 - 180);

  const newTamagotchi = {
    hunger: 3,
    happiness: 3,
    age: 1,
    weight: 5,
    poop: 0,
    careMistakes: 0,
    isSleeping: false,
    isSick: false,
    isLightOn: true,
    coins: 1,
    clockTime: 12,
    timeSet: false,
    lastUpdateTime: Date.now(),
    lastVideoWatchTime: 0,
    referralCount: 0,
    tamahue: randhue,
    crowns: 0,
  };

  if (referralCode && referralCode !== userId) {
    const referrerTamagotchi = await getTamagotchi(referralCode);
    if (referrerTamagotchi) {
      await updateTamagotchi(referralCode, {
        coins: parseInt(referrerTamagotchi.coins) + 5,
        referralCount: parseInt(referrerTamagotchi.referralCount) + 1,
      });
      const updatedTamagotchi = await getTamagotchi(referrerTamagotchi);
      io.to(referralCode).emit("tamagotchiUpdate", updatedTamagotchi);
      newTamagotchi.coins += 5; // Also reward the new user
    }
  }

  console.log(newTamagotchi);
  await logActivity(userId, "Hatched Kodomochi");
  await updateTamagotchi(userId, newTamagotchi);
  await redis.sadd("tamagotchi:users", userId);
  res.json({ userId, ...newTamagotchi });
});

// Get Tamagotchi data
app.get("/api/tamagotchi/:userId", async (req, res) => {
  const { userId } = req.params;
  const existingTamagotchi = await redis.exists(`tamagotchi:${userId}`);
  if (!existingTamagotchi) {
    return res.json({ error: "Doesn't exist" });
  }
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
    switch (action) {
      case "watchVideo":
        const now = Date.now();
        const lastVideoWatchTime = parseInt(tamagotchi.lastVideoWatchTime) || 0;
        if (now - lastVideoWatchTime < VIDEO_REWARD_COOLDOWN) {
          return res.status(400).json({
            error: "Video reward not available yet",
          });
        } else {
          await logActivity(userId, action);
          updates.coins = tamagotchi.coins + 10;
          updates.lastVideoWatchTime = now;
        }
        break;
      case "revive":
        updates.careMistakes = 0;
        updates.coins = tamagotchi.coins;
        updates.age = 1;
        updates.weight = 5;
        updates.poop = 0;
        updates.careMistakes = 0;
        updates.hunger = START_STATS;
        updates.happiness = START_STATS;
        updates.timeSet = false;
        await logActivity(userId, action);
        break;
      default:
        return res.status(400).json({ error: "KodoMochi has passed away" });
    }
  }

  if (tamagotchi.isSleeping) {
    switch (action) {
      case "feed":
      case "play":
      case "clean":
        return res.status(400).json({ error: "KodoMochi is sleeping" });
    }
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
      await logActivity(userId, action);
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

    case "watchVideo":
      const now = Date.now();
      const lastVideoWatchTime = parseInt(tamagotchi.lastVideoWatchTime) || 0;
      if (now - lastVideoWatchTime < VIDEO_REWARD_COOLDOWN) {
        return res.status(400).json({
          error: "Video reward not available yet",
        });
      } else {
        updates.coins = tamagotchi.coins + 10;
        updates.lastVideoWatchTime = now;
      }
      break;

    case "revive":
      if (tamagotchi.careMistakes < CARE_MISTAKE_LIMIT) {
        return res.status(400).json({ error: "Still alive" });
      }
      break;
  }

  await logActivity(userId, action);
  await updateTamagotchi(userId, updates);
  const updatedTamagotchi = await getTamagotchi(userId);
  res.json(updatedTamagotchi);
  io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
});

// endpoint to buy crown (Need to add validation here later)
app.post("/api/tamagotchi/:userId/buy-crown", async (req, res) => {
  const { userId } = req.params;

  const tamagotchi = await getTamagotchi(userId);

  const updates = {
    crowns: tamagotchi.crowns + 1,
  };

  await updateTamagotchi(userId, updates);
  const updatedTamagotchi = await getTamagotchi(userId);
  res.json(updatedTamagotchi);
  io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
});

// Order coins via AEON.xyz
const crypto = require("crypto");
const axios = require("axios");
const appID = process.env.APP_ID;
const secretKey = process.env.SECRET_KEY;
let orderNo = 1;

app.post("/api/tamagotchi/order-coins", async (req, res) => {
  try {
    const userId = "5380815277";
    const response = await sendOrder(userId);

    if (!response) {
      res.status(400).send({ error: "Invalid response from Aeon" });
      return;
    }

    // Return the entire response data including webUrl
    res.status(200).json({
      webUrl: response.model.webUrl,
      orderNo: response.model.orderNo,
    });
  } catch (error) {
    console.log("Error creating Aeon order", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

const sendOrder = async (userID) => {
  orderNo += 14;
  return await createAeonOrdersWithTma({
    merchantOrderNo: orderNo,
    orderAmount: "10",
    payCurrency: "USD",
    paymentTokens: "USDT",
    paymentExchange: "16f021b0-f220-4bbb-aa3b-82d423301957",
    userId: userID,
  });
};

const URL = "https://sbx-crypto-payment-api.aeon.xyz";

// Define the API request function
const createAeonOrdersWithTma = async (params) => {
  const requestParams = params;
  requestParams.appId = appID;
  requestParams.sign = generateSignature(JSON.parse(JSON.stringify(params)));
  requestParams.redirectURL = "https://kodomochi.pet/test";
  // requestParams.tgModel = "MINIAPP";
  console.log(requestParams);

  try {
    const response = await axios.post(
      `${URL}/open/api/payment`,
      requestParams,

      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);
    const aeonResponse = response.data;
    return aeonResponse;
  } catch (error) {
    console.error("Error:", error);
  }
};

// Webhook to process payments
app.post("/api/tamagotchi/aeon-webhook", async (req, res) => {
  try {
    const webhookData = req.body;

    // Validate the webhook signature
    const isValidSignature = validateAeonWebhookSignature(webhookData);
    if (!isValidSignature) {
      console.error("Invalid AEON webhook signature");
      return res.status(401).send("Invalid signature");
    }

    // Process the webhook data
    await handleAeonWebhookData(webhookData);

    // Send a successful response to AEON
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing AEON webhook:", error);
    res.status(500).send("Error processing webhook");
  }
});

const validateAeonWebhookSignature = (data) => {
  // Implement signature validation logic here
  // Using the secret key shared with AEON
  const { sign, ...dataToVerify } = data;
  const expectedSignature = generateSignature(dataToVerify);
  return sign === expectedSignature;
};

const handleAeonWebhookData = async (data) => {
  // Process the webhook data here
  // Update your game server's state based on the payment status
  const { orderStatus, merchantOrderNo, orderAmount, settlementAmount } = data;

  if (orderStatus === "COMPLETED") {
    // Update the user's coins or any other relevant data
    console.log(merchantOrderNo, orderAmount, settlementAmount);
  } else if (orderStatus === "CLOSE") {
    // Handle order cancellation or failure

    console.log(merchantOrderNo, data.failReason);
  }
};

const generateSignature = (params) => {
  // Remove the 'sign' parameter from the object if it exists
  const filteredParams = Object.keys(params)
    .filter((key) => key !== "sign")
    .reduce((obj, key) => {
      obj[key] = params[key];
      return obj;
    }, {}); // Ensure the initial value is of type RequestParams

  // Sort the parameters alphabetically by their keys (ASCII order)
  const sortedKeys = Object.keys(filteredParams).sort();

  // Prepare the string for concatenation in 'key=value' format joined by '&'
  const paramString = sortedKeys
    .map((key) => `${key}=${filteredParams[key]}`)
    .join("&");

  // Append the secret key to the final string
  const stringToSign = `${paramString}&key=${secretKey}`;
  // Generate SHA-512 hash using CryptoJS and convert it to uppercase
  const signature = crypto
    .createHash("sha512")
    .update(stringToSign)
    .digest("hex")
    .toUpperCase();

  return signature;
};

// Periodic updates
const updateTask = new AsyncTask(
  "update-tamagotchis",
  async () => {
    const userIds = await redis.smembers("tamagotchi:users");

    const currentTime = Date.now();
    for (const userId of userIds) {
      const tamagotchi = await getTamagotchi(userId);

      if (!tamagotchi) {
        console.log("Couldn't find ID:" + userId);
        continue;
      }

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
          if (tamagotchi.hunger === 0) {
            await sendTelegramNotification(
              userId,
              "Your KodoMochi is hungry. Feed it now to avoid a care mistake.."
            );
          } else
            await sendTelegramNotification(
              userId,
              "Your KodoMochi is sad. Play with it to make it happy"
            );
        }
        if (tamagotchi.isSick) {
          updates.careMistakes = tamagotchi.careMistakes + 1;
          await sendTelegramNotification(
            userId,
            "Your KodoMochi is sick, time for a potion."
          );
        }

        if (tamagotchi.poop == 2) {
          await sendTelegramNotification(
            userId,
            "Your KodoMochi pooped, you should clean it up."
          );
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
          if (Math.random() < 0.2) updates.poop = tamagotchi.poop + 1;
        }
      }

      if (isSleepTime && !tamagotchi.isSleeping) {
        updates.isSleeping = true;
        await sendTelegramNotification(
          userId,
          "Your KodoMochi is sleeping, turn the light off to give it a good night rest."
        );
      } else if (!isSleepTime && tamagotchi.isSleeping) {
        updates.isSleeping = false;
        updates.isLightOn = true; // Turn light on when waking up
        await sendTelegramNotification(userId, "Your KodoMochi is awake. :)");
        updates.careMistakes = 0; // Reset care mistakes
        // Age increase
        updates.age = tamagotchi.age + 1;
        updates.poop = tamagotchi.poop + 1;
      }

      // Increment time
      updates.lastUpdateTime = currentTime;

      await updateTamagotchi(userId, updates);
      const updatedTamagotchi = await getTamagotchi(userId);
      console.log("emitting tamagotchiUpdate" + updatedTamagotchi);
      io.to(userId).emit("tamagotchiUpdate", updatedTamagotchi);
    }
  },
  (err) => {
    console.error("Error in update task:", err);
  }
);

const updateJob = new SimpleIntervalJob(
  { minutes: 10, runImmediately: true },
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
