import { startServer } from "./api/main.ts";

if (!process.env.VERCEL) {
  startServer();
}
