import { connect } from "http2";
import mongoose, {Mongoose} from "mongoose";
import { buffer } from "stream/consumers";

const MONGODB_URL = process.env.MONGODB_URL!

interface MongooseConnection {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
}

//next use severless connection which is stateless
//the server will handle things then shutdown
// we need to do something to cache th db connection tp reduce number of connectio


let cached: MongooseConnection = (global as any).mongoose
if (!cached) {
    cached = (global as any).mongoose = {conn: null, promise: null}
}


export const connectToDatabase = async () => {
    if (cached.conn) {
        return cached.conn
    }

    if (!MONGODB_URL) {
        throw new Error(
            'Please define the MONGODB_URL environment variable inside .env.local'
        )
    }

    cached.promise = cached.promise || mongoose.connect(MONGODB_URL, {
        dbName: 'imagenary',
        bufferCommands: false,
    })

    
    cached.conn = await cached.promise
    console.log('Connected to database')
    return cached.conn
}
