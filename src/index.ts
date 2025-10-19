#!/usr/bin/env node
import { Command } from "commander";
import {
  installEngine,
  listEngines,
  uninstallEngine,
} from "./commands/engine.js";
import { runProject, runEditor } from "./commands/run.js";
import { useEngine } from "./commands/use.js";
import { newProject } from "./commands/new.js";

const program = new Command();

program.name("gpm").description("Godot Project Manager CLI").version("0.1.0");

program.command("new")
  .description("Create a new Godot project using the setup wizard")
  .action(newProject);

program.command("run [mode]")
  .description("Run the Godot project, Godot enditor or tests")
  .action(async (mode: string | undefined) =>  {
    
    const selectedMode = mode?.toLowerCase() ?? "run";
    
    switch (selectedMode) {
      case "run":
        await runProject("default");
        break;
      case "editor":
        await runEditor();
        break;
      case "test":
        await runProject("test");
        break;
      default:
        await runProject("default");
        break;
    }
  });

program
  .command("use [version]")
  .description("Select or set the Godot engine version for this project")
  .action(useEngine);



const engine = program
  .command("engine")
  .description("Manage Godot engine versions");
  
engine
  .command("install")
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



program.parse();
