# 🎨 Palette Master

A high-performance, browser-based image processing platform designed for glitch art, dithering, palette extraction, and creative pixel manipulation experiments. Built with low-level pixel manipulation algorithms, Web Workers, and a modern React interface.

### 🌐 Try Online: [https://milospavlovic7.github.io/palette-master-AntigravityAIAgent/](https://milospavlovic7.github.io/palette-master-AntigravityAIAgent/)
*(Mirror: [palette-master-antigravityaiproject.netlify.app](https://palette-master-antigravityaiproject.netlify.app))*

---

## ✨ Key Features

### 1. Interactive Image Canvas
- **Zero-Cloud Privacy**: Transform images directly in client memory without uploading data to external servers.
- **Upload & Clipboard**: Drag and drop images or paste directly from clipboard (`Ctrl+V`).
- **Smooth Navigation**: High-performance canvas with zoom and pan for pixel-perfect inspection.
- **Instant Comparison**: Toggle effects on/off on the fly to inspect against the original image.

### 2. Composable Real-Time Effect Chain
Stack multiple modular image effects, reorder them dynamically, and fine-tune parameters in real time:
- **Advanced Dithering**: Floyd-Steinberg, Atkinson, Sierra, Burkes, Jarvis-Judice-Ninke, Ordered (Bayer 2x2, 4x4, 8x8), Blue Noise, and Random Noise.
- **Glitch Art & Datamosh**:
  - **Pixel Sorting**: Sort pixels by luminance, hue, or saturation along horizontal or vertical axes.
  - **Datamosh**: Emulate lossy video compression keyframe drops and artifacting.
  - **Digital Glitch**: RGB channel shift, scanline dispersion, and sync corruption.
- **Stylization**:
  - **ASCII Art**: Convert images into customizable ASCII character grids.
  - **Halftone**: Print-media simulation using customizable dot, line, or square screens.
  - **Woodcut**: High-contrast graphic novel thresholding.
- **Color Grading & Adjustments**:
  - **Photoshop-style Curves**: Independent RGB and luminance tone-curve shaping.
  - **HSL Controls**: Precision Hue, Saturation, and Lightness adjustment.
  - **Palette Quantization**: Map colors to classic hardware palettes (Game Boy, CGA, NES, Cyberpunk, Sepia, Monochrome).

### 3. Presets & Export Pipeline
- **Preset Management**: Save custom effect stacks to JSON and load community configurations.
- **Lossless Export**: Export processed images directly to PNG.
- **Offline Self-Contained**: Compiles into a single offline-capable HTML bundle.

---

## 🎮 Controls & Shortcuts

- **Paste Image**: `Ctrl + V` anywhere on the screen
- **Pan Canvas**: Hold `Middle Click` or `Space + Click & Drag`
- **Zoom**: Mouse Wheel (`Scroll Up` / `Scroll Down`)
- **Toggle Original**: Press or hold the Compare toggle button
- **Reorder Effects**: Drag and drop effect blocks inside the effect chain panel

---

## 🚀 Quick Start

### Option 1: Play Online (No installation required)
Launch directly in your browser:  
👉 **[https://milospavlovic7.github.io/palette-master-AntigravityAIAgent/](https://milospavlovic7.github.io/palette-master-AntigravityAIAgent/)**

### Option 2: Run Standalone Offline
Open `dist/index.html` directly in any modern web browser.

### Option 3: Local Development
```bash
# Clone the repository
git clone https://github.com/milospavlovic7/palette-master-AntigravityAIAgent.git
cd palette-master-AntigravityAIAgent

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Option 4: Production Build
```bash
npm run build
```
Generates a zero-dependency, single-file bundle at `dist/index.html`.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite](https://vitejs.dev/) + [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile)
- **Engine**: Pure client-side HTML5 Canvas 2D & Web Workers (`imageWorker.ts`) for off-main-thread pixel processing
- **Styling**: Modern CSS Custom Properties & responsive layout
- **Architecture**: Antigravity AI Agent pair programming experiment

---

## 📜 License

MIT License. Free for educational and personal use.
