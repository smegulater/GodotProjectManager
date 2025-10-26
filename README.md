# 🎮 Godot Project Manager (GPM)

**GPM** is a cross-platform command-line tool for managing **Godot Engine** projects.  
It automates tedious setup steps like engine installation, project scaffolding, and build management —  
similar in spirit to `npm` or `npx`, but for Godot developers.

---

## 🚀 Features

- 🧩 **Quick project creation**
  - `gpm new` walks you through a wizard to set up a new Godot project (2D or 3D)
  - Automatically initializes Git and optional Git LFS
  - Creates a consistent folder structure for code, assets, tests, and builds
  - Generates a ready-to-run `project.godot`

- ⚙️ **Automatic Godot engine management**
  - Installs Godot engines per version
  - Supports GDScript and Mono (C#)
  - Engines are cached in the following locations:
    - Unix: `~/.gpm/engines`
    - Windows: `%USERPROFILE%/.gpm/engines`

- 🧠 **Project environment handling**
  - Tracks active Godot engine via `.gpmrc`
  - Allows switching engines with `gpm use <version>`

- 🧪 **Build & run helpers**
  - `gpm run` launches your project in the selected Godot engine
  - `gpm run test` builds and runs your project for testing/debugging

- 🧱 **Cross-platform**
  - Works on Windows, macOS, and Linux
  - Can be installed globally via npm

---

## 📦 Installation

You can install GPM globally via npm:

``` bash
npm install -g godot-project-manager
```

Or use it locally with npx:

``` bash
npx gpm new
```

## 🧭 Commands Overview
| Command                        | Description                                         | Documentation |
| ------------------------------ | --------------------------------------------------- | ------------- |
| `gpm new`                      | Start the interactive project creation wizard       |               |
| `gpm init`                     | Intialise GPm in an existing godot project          |               |
| `gpm use <version>`            | Set project to a specific Godot engine version      |               |
| `gpm run`                      | Launch the current project in the configured engine |               |
| `gpm run editor`               | Launches the configured editor but not the project  |               |
| `gpm engine install `          | Install Godot engine for peoject                    |               |
| `gpm engine install --new`     | Manually install a specific Godot engine using a wizard to select which version |               |
| `gpm engine install --mono` | Manually install a specific Godot mono engine using a wizard to select which version |               |
| `gpm engine list`              | Show all locally installed engine versions          |               |
| `gpm engine uninstall `        | Run a wizard to uninstall one or more installed editors |               |


## 🏗️ Project Structure
When you create a new project using gpm new, it generates this structure:

``` css

my-godot-project/
│
├── project/
│   ├── project.godot
│   ├── src/
│   ├── scenes/
│   ├── assets/
│   ├── tests/
│   └── addons/
│
├── build/
├── scripts/
├── .gitignore
├── .gitattributes
└── gpm.json
```

## 🧰 Engine Management
GPM installs and caches Godot engines under:
- Unix: `~/.gpm/engines`
- Windows: `%USERPROFILE%/.gpm/engines`

If the requested engine already exists locally, GPM will reuse it automatically.

## 🧠 Notes
GPM uses the official Godot download API and mirrors from GitHub releases.

Projects can use different Godot versions — GPM automatically picks the right one.

The .gpmrc file in your project directory keeps track of which engine version to use.

Git LFS support is optional but recommended for managing binary assets.

## 🛠️ Development
Clone this repository and build locally:

```bash
git clone https://github.com/yourusername/GodotProjectManager.git
cd GodotProjectManager
npm install
npm run build
npm link
```

Then you can run it directly:

```bash

gpm new
```

## testing 

``` bash
npm run build
npm link

gpm new 
```

## 🧩 Roadmap
 Support for headless Godot test runs

 Template system for project presets

 Plugin system for custom build scripts

 Remote Godot engine management (auto-update)

 Cloud sync for project configs

### 🧑‍💻 Author
Developed by George Chambers
Cross-platform automation enthusiast.

> “GPM — because starting a new Godot project should take seconds, not setup manuals.” ✨

