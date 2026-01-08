# AlSi10Mg_Alloy.py

class MaterialAlSi10Mg:
    def __init__(self):
        # Mechanical properties
        self.density = 2.67e3          # kg/m^3
        self.tensile_strength = 450e6  # Pa
        self.yield_strength = 285e6    # Pa
        self.elastic_modulus = 73.5e9  # Pa
        self.poisson_ratio = 0.33
        self.fatigue_strength = 110e6  # Pa

        # Thermal properties
        self.thermal_conductivity = 140            # W/m·K
        self.coefficient_thermal_expansion = 21e-6 # 1/K
        self.specific_heat_capacity = 915          # J/kg·K

        # Electrical properties
        self.electrical_conductivity = 2.1e6       # S/m

        # Chemical composition (wt.%)
        self.composition = {
            "Si": 6.5, "Mg": 0.45, "Cu": 0.05, "Fe": 0.15,
            "Mn": 0.1, "Ti": 0.05, "Others": 0.25
        }