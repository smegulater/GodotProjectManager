#!/usr/bin/env node
import { Command } from "commander";
//import { initProject } from "./commands/init.js";
import {
  installEngine,
  listEngines,
  uninstallEngine,
} from "./commands/engine.js";
import { runProject } from "./commands/run.js";
import { useEngine } from "./commands/use.js";
import { newProject } from "./commands/new.js";

const program = new Command();

program.name("gpm").description("Godot Project Manager CLI").version("0.1.0");
program
  .command("new")
  .description("Create a new Godot project using the setup wizard")
  .action(newProject);

/*
program
  .command("init")
  .description("Initialize a new Godot project")
  .action(initProject);
*/
const engine = program
  .command("engine")
  .description("Manage Godot engine versions");
engine.command("install [version]")
  .description("Install a specific or project-defined Godot engine")
  .option("--flavor <type>", "Engine flavor (stable, rc, beta)", "stable")
  .option("--mono", "Install Mono (C#) version", false)
  .action(async (version, options) => {
    const flavor = options.flavor || "stable";
    const mono = !!options.mono;
    await installEngine(version, flavor, mono);
  });

engine.command("uninstall").action(uninstallEngine);

engine.command("list").action(function () {
  listEngines(false);
});

program
  .command("run")
  .option("--test", "Run project tests")
  .description("Run the Godot project")
  .action(async (options) => {
    if (options.test) await runProject("test");
    else await runProject("default");
  });

program
  .command("use [version]")
  .description("Select or set the Godot engine version for this project")
  .action(useEngine);

program.parse();
