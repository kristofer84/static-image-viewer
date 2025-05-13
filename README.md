# Static Image Viewer

A lightweight, static web app for browsing images in a directory. Built with Vue 3 and Vite.

## Features

* Displays images from a specified folder
* Parses EXIF metadata, including GPS location if available
* Minimalist interface for easy navigation
* No backend required; runs entirely in the browser

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed.

### Installation

```bash
git clone https://github.com/kristofer84/static-image-viewer.git
cd static-image-viewer
pnpm install
```

### Development Server

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

## Usage

1. Start the development server or build for production.
2. Open the app in your browser and open a folder.
3. EXIF metadata, including GPS coordinates, will be read and can be used to show image locations.

## License

This project is licensed under the MIT License.
