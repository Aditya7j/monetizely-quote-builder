import mongoose from "mongoose";

const MONGODB_URI: string =
  process.env.MONGODB_URI ?? "";

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is missing. Add it to .env.local.",
  );
}

interface MongooseCache {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache =
  global.mongooseCache ??
  (global.mongooseCache = {
    connection: null,
    promise: null,
  });

export async function connectToDatabase(): Promise<
  typeof mongoose
> {
  if (cached.connection) {
    return cached.connection;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.connection = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.connection;
}