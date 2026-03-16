import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI;
const MONGO_URI_NEW = process.env.MONGO_URI_NEW;

if (!MONGO_URI && !MONGO_URI_NEW) {
  throw new Error("Please define the MONGO_URI or MONGO_URI_NEW environment variable");
}

async function getConnectedClient() {
  try {
    if (MONGO_URI) {
      console.log("Attempting to connect to primary MongoDB...");
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      console.log("Connected to primary MongoDB successfully.");
      return client;
    }
    throw new Error("MONGO_URI not defined.");
  } catch (error) {
    console.warn("Primary MongoDB connection failed. Trying fallback...", error.message);
    if (MONGO_URI_NEW) {
      console.log("Attempting to connect to fallback MongoDB (MONGO_URI_NEW)...");
      const fallbackClient = new MongoClient(MONGO_URI_NEW);
      await fallbackClient.connect();
      console.log("Connected to fallback MongoDB successfully.");
      return fallbackClient;
    }
    throw new Error("Both primary and fallback MongoDB connections failed.");
  }
}

let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = getConnectedClient();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = getConnectedClient();
}

export default clientPromise;
