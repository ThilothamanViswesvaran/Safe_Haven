import json
import random
import requests
from collections import defaultdict

# Google Maps API configuration
GOOGLE_MAPS_API_KEY = "AIzaSyB38DDVaEpSQJN8kH5sol9ECGumiqOOiBs"  # Replace with your actual API key
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

# Area boundaries for random coordinate generation (latitude, longitude ranges)
AREA_BOUNDS = {
    "Thillai Nagar": {"lat_range": (10.833, 10.835), "lng_range": (78.655, 78.657)},
    "Woraiyur": {"lat_range": (10.829, 10.832), "lng_range": (78.681, 78.684)},
    "Kajamalai": {"lat_range": (10.774, 10.777), "lng_range": (78.691, 78.694)},
    "Puthanampatti": {"lat_range": (11.065, 11.068), "lng_range": (78.685, 78.688)},
    "Srirangam": {"lat_range": (10.857, 10.860), "lng_range": (78.683, 78.686)},
    "Ariyamangalam": {"lat_range": (10.805, 10.808), "lng_range": (78.731, 78.734)},
    "Cantonment": {"lat_range": (10.785, 10.788), "lng_range": (78.696, 78.699)},
    "Edamalaipatti Pudur": {"lat_range": (10.775, 10.778), "lng_range": (78.685, 78.688)},
    "Kattur": {"lat_range": (10.845, 10.848), "lng_range": (78.685, 78.688)},
    "Karumandapam": {"lat_range": (10.790, 10.793), "lng_range": (78.696, 78.699)},
    "K.K. Nagar": {"lat_range": (10.798, 10.801), "lng_range": (78.682, 78.685)},
    "Palakkarai": {"lat_range": (10.800, 10.803), "lng_range": (78.703, 78.706)},
    "Puthur": {"lat_range": (10.805, 10.808), "lng_range": (78.685, 78.688)},
    "Ramalinga Nagar": {"lat_range": (10.810, 10.813), "lng_range": (78.682, 78.685)},
    "Sangiliyandapuram": {"lat_range": (10.795, 10.798), "lng_range": (78.710, 78.713)},
    "T.V.S. Nagar": {"lat_range": (10.820, 10.823), "lng_range": (78.690, 78.693)},
    "Tiruvanaikoil": {"lat_range": (10.860, 10.863), "lng_range": (78.693, 78.696)},
    "Varaganeri": {"lat_range": (10.805, 10.808), "lng_range": (78.710, 78.713)},
    "Vayalur": {"lat_range": (10.785, 10.788), "lng_range": (78.670, 78.673)},
    "Melapudur": {"lat_range": (10.790, 10.793), "lng_range": (78.704, 78.707)},
    "Manachanallur": {"lat_range": (10.890, 10.893), "lng_range": (78.710, 78.713)},
    "Thiruverumbur": {"lat_range": (10.765, 10.768), "lng_range": (78.780, 78.783)},
    "Golden Rock": {"lat_range": (10.780, 10.783), "lng_range": (78.720, 78.723)},
    "Bheema Nagar": {"lat_range": (10.805, 10.808), "lng_range": (78.690, 78.693)},
    "Crawford": {"lat_range": (10.790, 10.793), "lng_range": (78.680, 78.683)},
    "Gandhi Market": {"lat_range": (10.800, 10.803), "lng_range": (78.710, 78.713)},
    "Ponmalai": {"lat_range": (10.780, 10.783), "lng_range": (78.710, 78.713)},
    "Subramaniapuram": {"lat_range": (10.795, 10.798), "lng_range": (78.685, 78.688)},
    "Thennur": {"lat_range": (10.815, 10.818), "lng_range": (78.685, 78.688)},
    "Vasantha Nagar": {"lat_range": (10.820, 10.823), "lng_range": (78.685, 78.688)},
    "Vayalur Road": {"lat_range": (10.790, 10.793), "lng_range": (78.675, 78.678)},
    "Woriur": {"lat_range": (10.830, 10.833), "lng_range": (78.680, 78.683)},
}


def extract_locations(content):
    """Extract location names from crime content"""
    locations = []
    content_lower = content.lower()

    # Check for known areas
    for area in AREA_BOUNDS:
        if area.lower() in content_lower:
            locations.append(area)

    # Handle common variations
    if "thillai" in content_lower and "nagar" in content_lower:
        locations.append("Thillai Nagar")
    if "nsb" in content_lower and "road" in content_lower:
        locations.append("NSB Road")

    return list(set(locations))

def get_coordinates(address):
    """Get coordinates using Google Maps Geocoding API"""
    params = {
        "address": address + ", Tiruchirappalli, Tamil Nadu",
        "key": GOOGLE_MAPS_API_KEY
    }
    response = requests.get(GEOCODE_URL, params=params)
    if response.status_code == 200:
        results = response.json().get("results", [])
        if results:
            location = results[0]["geometry"]["location"]
            return (location["lat"], location["lng"])
    return None

def process_crimes(input_file, output_file):
    """Process crime data and extract all locations with coordinates"""
    with open(input_file, encoding="utf-8") as f:
        crimes = json.load(f)

    # Dictionary to store unique locations and coordinates
    location_coords = {}

    for crime in crimes:
        locations = extract_locations(crime["content"])
        for location in locations:
            if location not in location_coords:
                if location in AREA_BOUNDS:
                    # Generate random coordinates within area bounds
                    lat_range = AREA_BOUNDS[location]["lat_range"]
                    lng_range = AREA_BOUNDS[location]["lng_range"]
                    location_coords[location] = {
                        "lat": random.uniform(*lat_range),
                        "lng": random.uniform(*lng_range),
                    }
                else:
                    # Use Google Maps API to fetch coordinates
                    coords = get_coordinates(location)
                    if coords:
                        location_coords[location] = {"lat": coords[0], "lng": coords[1]}
                    else:
                        print(f"Warning: Could not get coordinates for {location}")

    # Save extracted locations and coordinates
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({"locations": location_coords}, f, indent=2)

    print(f"Extracted {len(location_coords)} unique locations.")
    return location_coords

if __name__ == "__main__":
    input_file = "Trichy_Crime_Data.json"
    output_file = "trichy_locations.json"

    locations = process_crimes(input_file, output_file)

    # Print all extracted locations
    print("\nExtracted Locations with Coordinates:")
    for location, coord in locations.items():
        print(f"{location}: {coord}")
