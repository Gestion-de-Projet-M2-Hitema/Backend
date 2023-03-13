import express, { Express, Request, Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
const PocketBase = require('pocketbase/cjs');

dotenv.config();

const pb = new PocketBase(process.env.POCKETBASE_URL);

// Initialization of Express
const app: Express = express();
const corsOptions: Object = {
  origin: "*",
  credentials: true,
  allowedHeaders: ["sessionId", "Content-Type"],
  exposedHeaders: ["sessionId"],
  methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
  preflightContinue: false,
};

// We will need to parse the incoming json into req.body
app.use(cors(corsOptions));
app.use(express.json());

// First route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World !");
});

// Get users collections from pocketbase
app.get("/users", async (req: Request, res: Response) => {
  await pb.admins.authWithPassword(process.env.POCKETBASE_USERNAME, process.env.POCKETBASE_PASSWORD);
  const records = await pb.collection('users').getFullList();
  res.send(records);
});

export = app;
