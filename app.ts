import express, { Express } from "express";
import cors from "cors";
import * as dotenv from "dotenv";

dotenv.config();

// Initialization of Express
const app: Express = express();
const corsOptions: Object = {
  origin: ["https://concorde.netlify.app", "http://localhost:5173"],
  // origin: (origin: string, callback: Function) => {
  //   callback(null, true);
  // },
  credentials: true,
  allowedHeaders: ["sessionId", "Content-Type"],
  exposedHeaders: ["sessionId"],
  methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
  preflightContinue: false,
};

// We will need to parse the incoming json into req.body
app.use(cors(corsOptions));
app.use(express.json());

// Import routes
const routes = require("./routes");

app.use("/api/v1", routes);

export = app;
