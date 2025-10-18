import fs from "fs";
import path from "path";
import chalk from "chalk";
import os from "os";

try {
  console.log(chalk.cyan("🔍 Checking Node.js and npm versions..."));

  const nodeVersion = process.version;
  const npmVersion = (await import("child_process")).execSync("npm -v").toString().trim();
  console.log(`✅ Node ${nodeVersion}, npm ${npmVersion}`);

  // Define .gpm base directory
  const home = os.homedir();
  const gpmBase = path.join(home, ".gpm");
  const gpmEngines = path.join(gpmBase, "engines");

  // Create .gpm and .gpm/engines directories if missing
  if (!fs.existsSync(gpmEngines)) {
    fs.mkdirSync(gpmEngines, { recursive: true });
    console.log(chalk.green(`✅ Created ${gpmEngines}`));
  } else {
    console.log(chalk.gray(`✔️  Engine directory already exists: ${gpmEngines}`));
  }

  console.log(chalk.green("✅ GPM environment ready.\n"));
} catch (err) {
  console.error(chalk.red("❌ Setup failed:"), err);
  process.exit(1);
}
