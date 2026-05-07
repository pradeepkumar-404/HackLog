# 🔍 HackLog - Bug Bounty Research Tracker

<p align="center">
  <img src="build/icon.png" alt="HackLog Logo" width="200"/>
</p>

<p align="center">
  <strong>A Notion-style notes and daily research tracker built for bug bounty hunters.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-green" alt="Version"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/>
  <img src="https://img.shields.io/badge/platform-Linux%20%7C%20Windows-brightgreen" alt="Platform"/>
  <img src="https://img.shields.io/badge/AUR-hacklog--bin-cyan" alt="AUR"/>
</p>

---

# ✨ Features

- 📝 **Rich Markdown Notes** – Full Markdown editor with live preview
- 🎯 **Project Management** – Organize targets by project and workspace
- 🐛 **Vulnerability Tracking** – Log and track vulnerabilities with severity
- 📊 **Recon Data Management** – Store subdomains, URLs, IPs, and technologies
- 📅 **Daily Research Logging** – Track activities with calendar support
- 🔗 **Backlink Support** – Create linked notes and references
- 💾 **Payload Library** – Save and reuse custom payloads
- 📤 **Export Options** – Export notes to Markdown and CSV
- 🔍 **Full-Text Search** – Quickly search across all workspaces
- 📈 **Dashboard & Statistics** – Monitor productivity and progress
- 🎨 **Modern UI** – Beautiful dark theme using shadcn/ui
- ⌨️ **Keyboard Shortcuts** – Fast workflow with shortcuts support

---

# 📸 Screenshots

<p align="center">
  <em>Screenshots coming soon!</em>
</p>

---

# 📦 Download & Installation

## 🚀 Download Latest Release

👉 **Download Here:**  
https://github.com/pradeepkumar-404/HackLog/releases/tag/v1.0.0

---

# 🐧 Linux Installation

## Arch Linux / Manjaro

### Install from AUR

```bash
yay -S hacklog-bin
```

### Install Pacman Package

```bash
sudo pacman -U HackLog-1.0.0-x64.pacman
```

---

## Debian / Ubuntu / Kali Linux

### Install `.deb` Package

```bash
sudo dpkg -i HackLog-1.0.0-amd64.deb

# Fix missing dependencies if needed
sudo apt --fix-broken install
```

---

## AppImage (All Linux Distributions)

Works on:

- Fedora
- OpenSUSE
- Linux Mint
- Pop!_OS
- Debian-based distros
- Arch-based distros
- Other Linux distributions

```bash
chmod +x HackLog-1.0.0-x86_64.AppImage
./HackLog-1.0.0-x86_64.AppImage
```

---

# 🪟 Windows Installation

## Windows Installer (.exe)

1. Download `HackLog Setup 1.0.0.exe`
2. Double-click the installer
3. Follow the setup wizard
4. Launch HackLog from the Start Menu

---

# 📂 Included Release Files

Your GitHub release should contain:

```text
HackLog-1.0.0-x64.pacman
HackLog-1.0.0-amd64.deb
HackLog-1.0.0-x86_64.AppImage
HackLog Setup 1.0.0.exe
```

---

# 🛠️ Development Setup

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Git

---

## 📥 Clone Repository

```bash
git clone https://github.com/pradeepkumar-404/HackLog.git

cd HackLog
```

---

## 📦 Install Dependencies

```bash
npm install
```

---

## ▶️ Run in Development Mode

```bash
npm run dev
```

This starts:

- Backend → `http://localhost:5000`
- Frontend → `http://localhost:5001`
- Electron window opens automatically

---

# 🏗️ Build for Production

## Build Arch Linux Package

```bash
npm run build:arch
```

## Build Debian Package

```bash
npm run build:deb
```

## Build AppImage

```bash
npm run build:appimage
```

## Build Windows Installer

```bash
npm run build:win
```

---

# 🏗️ Tech Stack

| Layer | Technology |
|------|-------------|
| Frontend | React, TypeScript, Vite |
| UI Framework | Tailwind CSS, shadcn/ui |
| Backend | Express.js, Node.js |
| Database | SQLite + Sequelize |
| Desktop | Electron |
| Build Tools | electron-builder |

---

# 🤝 Contributing

Pull requests are welcome.

For major changes, please open an issue first to discuss what you would like to change.

---

# 📜 License

This project is licensed under the MIT License.

![License](https://img.shields.io/badge/license-MIT-blue)

---

# ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!

Made with ❤️ for the bug bounty community.
