import mongoose from "mongoose";
import type { DevMetricPayload } from "@wse/core/lib/dev-metrics";

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("Please define the DATABASE_URL environment variable inside .env");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
  var mongooseUri: string | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

function resetMongooseCacheIfUriChanged() {
  if (global.mongooseUri && global.mongooseUri !== MONGODB_URI) {
    console.warn(
      "[db] DATABASE_URL changed — resetting Mongoose cache (restart dev server if auth still fails)"
    );
    void cached?.conn?.disconnect().catch(() => undefined);
    cached = global.mongoose = { conn: null, promise: null };
  }
  global.mongooseUri = MONGODB_URI;
}

async function recordDbDevMetric(
  payload: Pick<DevMetricPayload, "source" | "category" | "name" | "value" | "unit" | "status" | "metadata">
) {
  const { isDevMetricsEnabled, recordDevMetric } = await import("@wse/core/lib/dev-metrics");
  if (!isDevMetricsEnabled()) return;
  await recordDevMetric(payload);
}

async function dbConnect() {
  resetMongooseCacheIfUriChanged();

  if (cached!.conn) {
    if (process.env.NODE_ENV === "development") {
      void recordDbDevMetric({
        source: "server",
        category: "db",
        name: "connection-reuse",
        value: 0,
        unit: "ms",
        status: "ok",
      });
    }
    return cached!.conn;
  }

  const metricName = cached!.promise ? "await-pending-connect" : "cold-connect";
  const start = performance.now();

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
    if (process.env.NODE_ENV === "development") {
      await recordDbDevMetric({
        source: "server",
        category: "db",
        name: metricName,
        value: performance.now() - start,
        unit: "ms",
        status: "ok",
      });
    }
  } catch (e) {
    cached!.promise = null;
    if (process.env.NODE_ENV === "development") {
      await recordDbDevMetric({
        source: "server",
        category: "db",
        name: metricName,
        value: performance.now() - start,
        unit: "ms",
        status: "error",
        metadata: { errorName: e instanceof Error ? e.name : typeof e },
      });
    }
    throw e;
  }

  return cached!.conn;
}

export default dbConnect;
