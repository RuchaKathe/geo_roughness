\# geo\_roughness
Geo Roughness is a Python package and command-line tool for geometric surface roughness analysis of 3D meshes (.glb files).
It computes standard roughness metrics and provides optional 3D visualization of surface deviations.
✨ Features
📦 Load .glb 3D mesh files
🔍 Compute top surface roughness
📊 Calculate standard roughness metrics:
Sa – Arithmetic mean roughness
Sz – Maximum height roughnes
🎨 Optional 3D roughness visualization
🖥️ Simple CLI interface
🧩 Modular, extensible Python package
Geometric roughness analysis and 3D visualization for GLB meshes.

geo_roughness/
│
├── geo_roughness/
│   ├── cli.py
│   ├── io/
│   │   └── glb_loader.py
│   ├── roughness/
│   │   └── surface.py
│   └── visualization/
│       └── mesh_plot.py
│
├── tests/
│   └── test_roughness.py
│
├── pyproject.toml
├── README.md
└── LICENSE



\## Features

\- Top surface roughness (Sa, Sz)

\- GLB mesh support

\- 3D roughness visualization

\- Command-line interface



\## Installation

```bash
git clone https://github.com/RuchaKathe/geo_roughness.git
cd geo_roughness


pip install -r requirements.txt
pip install -e .




