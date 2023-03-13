import * as dotenv from "dotenv";

dotenv.config();

const PocketBase = require("pocketbase/cjs");
const pb = new PocketBase(process.env.POCKETBASE_URL);

(async () => {
  // Authenticate to PocketBase
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_USERNAME,
    process.env.POCKETBASE_PASSWORD
  );
})();

export = pb;
