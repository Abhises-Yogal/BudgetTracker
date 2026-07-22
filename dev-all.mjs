import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("Starting backend and frontend...\n");

// Start backend
const backend = spawn("npm", ["run", "server:dev"], {
  cwd: __dirname,
  stdio: "inherit",
  shell: true,
});

// Start frontend
const frontend = spawn("npm", ["run", "dev"], {
  cwd: __dirname,
  stdio: "inherit",
  shell: true,
});

// Handle cleanup
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  backend.kill();
  frontend.kill();
  process.exit(0);
});

backend.on("error", (err) => {
  console.error("Backend error:", err);
});

frontend.on("error", (err) => {
  console.error("Frontend error:", err);
});
