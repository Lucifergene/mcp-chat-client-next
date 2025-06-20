import { spawn } from "child_process";
import * as path from "path";
import { promises as fs } from "fs";

/**
 * Server-side utilities for MCP client operations.
 * These utilities use Node.js APIs and should only be used on the server side.
 */

/**
 * Helper function to find npx executable path
 * Searches common installation locations and validates the executable works
 * @returns Promise<string> Path to the npx executable
 * @throws Error if npx cannot be found or is not functional
 */
export async function findNpxPath(): Promise<string> {
  // Get the directory where node is installed
  const nodeDir = path.dirname(process.execPath);

  const possiblePaths = [
    "npx", // Try system PATH first
    path.join(nodeDir, "npx"), // Same dir as node (Unix)
    path.join(nodeDir, "npx.cmd"), // Windows
    "/usr/local/bin/npx", // Common installation path
    "/opt/homebrew/bin/npx", // Homebrew on Apple Silicon
  ];

  // Optional: Enable debug logging with environment variable
  if (process.env.DEBUG_MCP) {
    console.log(`Node.js executable: ${process.execPath}`);
    console.log(`Searching for npx in: ${possiblePaths.join(", ")}`);
  }

  for (const npxPath of possiblePaths) {
    try {
      // Check if file exists first
      await fs.access(npxPath);

      // Test if this path works by running npx --version
      const child = spawn(npxPath, ["--version"], { stdio: "pipe" });
      const exitCode = await new Promise((resolve) => {
        child.on("close", resolve);
        child.on("error", () => resolve(1));
      });

      if (exitCode === 0) {
        if (process.env.DEBUG_MCP) {
          console.log(`Found npx at: ${npxPath}`);
        }
        return npxPath;
      }
    } catch (error) {
      // Continue to next path
      if (process.env.DEBUG_MCP) {
        console.log(`npx not found at: ${npxPath}`);
      }
    }
  }

  throw new Error(
    "npx not found. Please ensure Node.js is properly installed with npm."
  );
}
