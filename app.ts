import express, { Express, Request, Response } from "express";
import cors from "cors";

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

export = app;
