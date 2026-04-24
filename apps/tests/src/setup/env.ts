import dotenv from "dotenv";

dotenv.config({
  path: new URL("../../.env.test", import.meta.url),
  quiet: true,
});
