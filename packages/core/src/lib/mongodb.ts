import { MongoClient } from "mongodb"

if (!process.env.DATABASE_URL) {
  throw new Error('Invalid/Missing environment variable: "DATABASE_URL"')
}

const uri = process.env.DATABASE_URL
const options = {}

type GlobalMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>
  _mongoClientUri?: string
}

function connectClient(connectionUri: string): Promise<MongoClient> {
  return new MongoClient(connectionUri, options).connect()
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as GlobalMongo

  if (!globalWithMongo._mongoClientPromise || globalWithMongo._mongoClientUri !== uri) {
    if (globalWithMongo._mongoClientUri && globalWithMongo._mongoClientUri !== uri) {
      console.warn(
        "[mongodb] DATABASE_URL changed — reconnecting (restart dev server if auth still fails)"
      )
    }
    globalWithMongo._mongoClientUri = uri
    globalWithMongo._mongoClientPromise = connectClient(uri)
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  clientPromise = connectClient(uri)
}

export default clientPromise
