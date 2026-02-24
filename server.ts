import { startServer } from "./api/index.ts";

if (!process.env.VERCEL) {
  startServer();
}
