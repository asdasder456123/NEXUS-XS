import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "npm.cmd" : "npm";

let stopping = false;

function startDevWeb() {
  console.log("[NΞXUS XS] Starting npm run dev:web...");

  const child = spawn(command, ["run", "dev:web"], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("error", (error) => {
    console.error("[NΞXUS XS] Failed to start dev:web:", error);
  });

  child.on("exit", (code, signal) => {
    if (stopping) {
      return;
    }

    console.error(
      `[NΞXUS XS] dev:web stopped (code=${code}, signal=${signal ?? "none"}).`,
    );

    console.log("[NΞXUS XS] Restarting dev:web in 3 seconds...");

    setTimeout(() => {
      if (!stopping) {
        startDevWeb();
      }
    }, 3000);
  });
}

function shutdown(signal) {
  if (stopping) {
    return;
  }

  stopping = true;
  console.log(`[NΞXUS XS] Received ${signal}. Shutting down...`);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log("========================================");
console.log("       NΞXUS XS START SUPERVISOR");
console.log("========================================");
console.log("[NΞXUS XS] Supervisor is running.");
console.log("[NΞXUS XS] Launching npm run dev:web...");

startDevWeb();
