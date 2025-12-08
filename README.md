# Palette Master

> **Note:** This project serves as an exploration and experiment into the capabilities of the **Antigravity AI Agent**. It was built to test advanced agentic coding, pair programming workflows, and real-time problem solving.

**Palette Master** is a high-performance, browser-based image processing platform designed for glitch art, palette extraction, and creative coding experiments. It combines the power of low-level pixel manipulation with a modern React interface.

![Project Status](https://img.shields.io/badge/Status-Experimental-orange)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_Vite_|_TypeScript-blue)

## ⚡ Quick Run (No Installation Required)

### **1. Live Demo (Recommended)**
Run the app instantly, with no installation needed (Presets not included):  
👉 **palette-master-antigravityaiproject.netlify.app/**

### **2. Local Alternative**
If you prefer running the app locally without Node.js:
1. Open the **`dist`** folder in this repository.
2. Launch **`index.html`** directly in your browser.
3. Download and add presets from **`dist`** folder.

*(For development or making changes, see the “Getting Started” section.)*

---

## 🎨 User Guide & Capabilities

Palette Master allows you to transform images directly in your browser without uploading data to any server.

### 1. Image Manipulation Core
- **Upload & Import**: Drag and drop images or paste from clipboard.
- **Interactive Canvas**: High-performance canvas with **Zoom** and **Pan** capabilities for analyzing pixel-perfect details.
- **Comparison Mode**: Toggle effects on/off instantly to compare with the original image.

### 2. The Effect Chain
The core feature of the application is the **Effect Chain**. Unlike simple filters, you can stack multiple effects, reorder them, and adjust their parameters in real-time. The output of one effect becomes the input for the next.

**Available Effects:**
- **Dithering**: An extensive collection of algorithms (Floyd-Steinberg, Atkinson, Sierra, Blue Noise, etc.) to simulate retro visual styles.
- **Glitch Art**:
  - **Pixel Sorting**: Sort pixels by brightness, hue, or saturation (Horizontal/Vertical).
  - **Datamosh**: Simulate video compression artifacts.
  - **Glitch**: Apply digital distortion, RGB shifting, and scanlines.
- **Stylization**:
  - **ASCII Art**: Convert images into text/characters.
  - **Halftone**: Print-media effect using dots, lines, or squares.
  - **Woodcut**: Artistic thresholding.
- **Adjustments**:
  - **Curves**: Advanced tone mapping (Photoshop-style curves).
  - **HSL**: Hue, Saturation, Lightness controls.
  - **Contrast & Brightness**.
  - **Fine Tune**: Map specific luminance ranges to custom colors (Gradient Maps).

### 3. Palette Management
- **Extraction**: Automatically analyze the image to extract dominant color palettes using K-Means clustering.
- **Library**: Save your favorite generated palettes to a local library.
- **Sorting**: Order palette colors by Luminance, Hue, or Saturation.

---

## 🔧 Technical Architecture

This project implements several advanced software engineering patterns to ensure performance and maintainability.

### ⚡ Performance: Web Workers
The most critical technical feature is the use of **Web Workers**.
- **Off-Main-Thread Processing**: Image processing (looping through millions of pixels) is computationally expensive. To prevent the UI from freezing, all pixel manipulation happens in a background thread (`imageWorker.ts`).
- **Asynchronous Messaging**: The React UI communicates with the worker via a messaging system, sending configuration data and receiving processed `ImageData`.

### 🏗️ Design Patterns
- **Feature-Based Architecture**: The codebase is organized by domain features (`features/effects`, `features/palette`) rather than technical type, making it scalable and easier to navigate.
- **Chain of Responsibility**: The effect processing engine applies transformations sequentially.
- **Strategy Pattern**: Algorithms for Dithering and other effects are implemented as interchangeable strategies, allowing the worker to switch methods dynamically based on user input.
- **Custom React Hooks**: Complex logic (like worker communication and canvas interaction) is encapsulated in hooks like `useImageWorker` and `useCanvasInteraction`.

---

## 🚀 Getting Started

To run this experiment locally:

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository into your workspace.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the displayed URL (usually `http://localhost:5173`).

---

## License

This project is open-source and available under the [MIT License](LICENSE).
