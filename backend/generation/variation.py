"""
Variation system - prompt transformations for "darker", "brighter", etc.
Where model doesn't support audio conditioning, we transform prompt.
"""

from typing import Dict

VARIATION_PRESETS = {
    "darker": {
        "add": ["darker", "deeper", "more ominous", "low frequency", "minor key"],
        "remove": ["bright", "happy", "major", "high pitched"]
    },
    "brighter": {
        "add": ["brighter", "more uplifting", "high frequency", "major key", "shimmering"],
        "remove": ["dark", "deep", "ominous", "low"]
    },
    "heavier": {
        "add": ["heavier", "more distorted", "aggressive", "powerful", "thick", "saturated"],
        "remove": ["light", "soft", "gentle"]
    },
    "lighter": {
        "add": ["lighter", "softer", "gentle", "airy", "delicate"],
        "remove": ["heavy", "distorted", "aggressive"]
    },
    "slower": {
        "add": ["slower", "more gradual", "slow evolving", "half tempo"],
        "remove": ["fast", "quick", "rapid"]
    },
    "faster": {
        "add": ["faster", "more energetic", "rapid", "double tempo"],
        "remove": ["slow", "gradual", "evolving"]
    },
    "more_percussion": {
        "add": ["more percussion", "strong rhythmic", "driving beat", "pronounced drums"],
        "remove": ["no percussion", "without drums"]
    },
    "less_percussion": {
        "add": ["less percussion", "minimal drums", "no beat", "ambient"],
        "remove": ["percussion", "drums", "beat", "rhythmic"]
    },
    "more_cinematic": {
        "add": ["more cinematic", "epic", "orchestral", "trailer-like", "dramatic"],
        "remove": []
    },
    "more_atmospheric": {
        "add": ["more atmospheric", "spacious", "reverb", "ethereal", "ambient texture"],
        "remove": []
    },
    "more_distorted": {
        "add": ["more distorted", "saturated", "gritty", "overdriven"],
        "remove": ["clean", "pure"]
    },
    "variation": {
        "add": ["variation", "alternative take", "slightly different"],
        "remove": []
    }
}

def apply_variation(prompt: str, variation_type: str) -> str:
    """Apply variation transformation to prompt"""
    if variation_type not in VARIATION_PRESETS:
        # Generic: just add variation_type as descriptor
        return f"{prompt}, {variation_type.replace('_', ' ')}"
    
    preset = VARIATION_PRESETS[variation_type]
    result = prompt.lower()
    
    # Remove unwanted terms
    for term in preset.get("remove", []):
        result = result.replace(term, "")
    
    # Clean double commas/spaces
    result = result.replace(",,", ",").replace("  ", " ").strip(" ,")
    
    # Add new terms
    add_terms = preset.get("add", [])
    if add_terms:
        result = result + ", " + ", ".join(add_terms)
    
    # Clean again
    result = result.replace(",,", ",").replace("  ", " ").strip(" ,")
    
    return result

def generate_variations(base_prompt: str, types: list = None) -> Dict[str, str]:
    """Generate multiple variations of a prompt"""
    if types is None:
        types = list(VARIATION_PRESETS.keys())
    
    variations = {}
    for vtype in types:
        variations[vtype] = apply_variation(base_prompt, vtype)
    
    return variations

def get_variation_buttons():
    """Return list of variation buttons for UI"""
    return [
        {"id": "variation", "label": "Generate Variation", "icon": "🔀"},
        {"id": "darker", "label": "Darker", "icon": "🌑"},
        {"id": "brighter", "label": "Brighter", "icon": "☀️"},
        {"id": "heavier", "label": "Heavier", "icon": "💥"},
        {"id": "lighter", "label": "Lighter", "icon": "🪶"},
        {"id": "slower", "label": "Slower", "icon": "🐢"},
        {"id": "faster", "label": "Faster", "icon": "⚡"},
        {"id": "more_percussion", "label": "More Percussion", "icon": "🥁"},
        {"id": "less_percussion", "label": "Less Percussion", "icon": "🎧"},
        {"id": "more_cinematic", "label": "More Cinematic", "icon": "🎬"},
        {"id": "more_atmospheric", "label": "More Atmospheric", "icon": "🌫️"},
    ]
