import * as dotenv from "dotenv";
import { httpServer } from "./websocket";

dotenv.config();

const port = process.env.PORT || 3000;

httpServer.listen(port, () => {
  console.log(`Server listening on port : ${port}`);
});
