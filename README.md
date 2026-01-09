
Geo Roughness Analyzer

Geo Roughness Analyzer is a Python + Web-based application for geometric surface roughness analysis of 3D meshes (.glb).
It computes standard surface roughness metrics on the top surface of a mesh and provides interactive 3D visualization via a modern web UI.
This project is designed for engineering, manufacturing, and research workflows, with a modular backend and a real-time frontend.

✨ Key Features

🔍 Roughness Analysis

Top-surface extraction from 3D meshes

Standard roughness metrics:

Sa – Arithmetic Mean Height

Sq – Root Mean Square Height

Sz – Maximum Height

Vertex-level residual (height deviation) computation

🎨 3D Visualization

Interactive Three.js viewer in the browser

ISO-style color mapping for surface roughness

Orbit, zoom, pan controls

Clean engineering-focused visuals

📊 UI Capabilities

Upload .glb files directly in the browser

Unit toggle (meters ↔ micrometers)

Color legend for roughness scale

Material information panel (e.g. AlSi10Mg alloy)

🧱 Architecture

FastAPI backend for computation

React + Vite + Three.js frontend

Modular Python package structure

Easily extensible (materials, metrics, visualization styles)

📂 Project Structure

```bash

geo_roughness/
│
├── frontend/                     # React + Three.js frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── ThreeViewer.jsx
│   │   ├── RoughnessLegend.jsx
│   │   ├── MaterialPanel.jsx
│   │   └── ErrorBoundary.jsx
│   ├── index.html
│   └── vite.config.js
│
├── geo_roughness/                # Python backend package
│   ├── api.py                    # FastAPI application
│   ├── roughness/
│   │   └── surface.py            # Roughness computation logic
│   ├── materials/
│   │   └── alsi10mg.py            # Material properties (AlSi10Mg)
│   ├── visualization/
│   │   └── vtk_viewer.py          # Optional VTK/PyVista visualization
│   └── io/
│       └── glb_loader.py
│
├── scripts/
│   └── visualize.py               # Offline visualization/testing script
│
├── requirements.txt
├── pyproject.toml
├── README.md
└── LICENSE

```
⚙️ Installation

1. Clone the repository
```bash
git clone https://github.com/RuchaKathe/geo_roughness.git
cd geo_roughness
```
2️. Create and activate virtual environment
```bash
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
.venv\Scripts\activate      # Windows
```
3. Install backend dependencies
```bash
pip install -r requirements.txt

```
🚀 Running the Application

▶ Frontend (React + Three.js)

1. From the project root
```bash
uvicorn geo_roughness.api:app --reload
```
2. Backend will be available at:
```bash  
http://127.0.0.1:8000

```
▶ Frontend (React + Three.js)

```bash  
cd frontend
npm install
npm run dev
```
1. Frontend will run at:
```bash
http://localhost:5173

```
🧪 API Overview

POST /analyze

Uploads a .glb mesh and returns:

  Roughness metrics (Sa, Sq, Sz)

  Vertex-level roughness values

  Top surface vertex indices

  Mesh geometry

  Material metadata (if enabled)

  🧱 Material Support

Currently included:

AlSi10Mg aluminum alloy

Mechanical, thermal, electrical properties

Designed for additive manufacturing contexts

Material data is displayed in the frontend via a click-to-expand Material Panel.

📐 Scientific Notes

Roughness is computed on the top surface only

Plane fitting + residual analysis is used

Units are SI (meters internally)

Visualization scaling does not affect numerical results


🔍 Offline Visualization (Optional)

In addition to the web-based UI, this project provides an offline visualization script for quickly inspecting surface roughness results using Python.

```bash
scripts/visualize.py

```
▶ How to Run visualize.py

Make sure you are in the project root directory and your virtual environment is activated.

1. Activate virtual environment
```bash
.venv\Scripts\activate        # Windows
# or
source .venv/bin/activate    # macOS/Linux

```
2. Run the script
   ```bash
   python scripts/visualize.py

   
📊 What visualize.py Does

Loads a .glb mesh file

Computes top-surface roughness

Prints numerical roughness metrics:

Sa – Arithmetic Mean Height

Sz – Maximum Height

Opens an interactive 3D visualization window (VTK / PyVista)

