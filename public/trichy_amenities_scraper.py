import requests
import json
import time
from collections import defaultdict

# Configuration
API_KEY = "AIzaSyB38DDVaEpSQJN8kH5sol9ECGumiqOOiBs"
TRICHY_AREAS = [
    {"name": "Srirangam", "location": "10.8636,78.6918"},
    {"name": "Woraiyur", "location": "10.8184,78.6903"},
    {"name": "Cantonment", "location": "10.8283,78.6939"},
    {"name": "K.K. Nagar", "location": "10.8042,78.6614"},
    {"name": "Puthur", "location": "10.7950,78.6760"},
    {"name": "Thillai Nagar", "location": "10.8081,78.6810"},
    {"name": "Ponmalai", "location": "10.7856,78.7058"},
    {"name": "Karumandapam", "location": "10.7765,78.6954"},
    {"name": "Panjappur", "location": "10.7250,78.7030"},
    {"name": "Thiruvanaikoil", "location": "10.8530,78.7050"},
    {"name": "Edamalaipatti Pudur", "location": "10.7900,78.6700"},
    {"name": "Subramaniapuram", "location": "10.8100,78.6800"},
    {"name": "Melapudur", "location": "10.8200,78.6900"},
    {"name": "Pallpannai", "location": "10.8300,78.7000"},
    {"name": "Thiruverumbur", "location": "10.7800,78.7200"},
    {"name": "Vayalur", "location": "10.8500,78.6500"},
    {"name": "Samayapuram", "location": "10.9200,78.7300"},
    {"name": "Kattur", "location": "10.8300,78.6800"},
    {"name": "Crawford", "location": "10.8000,78.6700"},
    {"name": "Anna Nagar", "location": "10.8100,78.6900"},
    {"name": "Ayyappa Nagar", "location": "10.8200,78.7000"},
    {"name": "Vasan Nagar", "location": "10.8300,78.7100"},
    {"name": "Mutharasanallur", "location": "10.8400,78.7200"},
    {"name": "Thuvakudi", "location": "10.7700,78.7300"},
    {"name": "Manikandam", "location": "10.7500,78.7400"},
    {"name": "Annamalai Nagar", "location": "10.7600,78.7500"},
    {"name": "Mannachanallur", "location": "10.9300,78.8000"},
    {"name": "Ramalinga Nagar", "location": "10.8000,78.6800"},
    {"name": "Pettavaithalai", "location": "10.9500,78.8100"},
    {"name": "Shanmuga Nagar", "location": "10.9600,78.8200"},
    {"name": "Allithurai", "location": "10.9700,78.8300"},
    {"name": "Ariyamangalam", "location": "10.9800,78.8400"},
    {"name": "Pichandarkovil", "location": "10.9900,78.8500"},
    {"name": "Karur Bye Pass Road", "location": "11.0000,78.8600"},
    {"name": "Trichy Dindugal NH", "location": "11.0100,78.8700"},
    {"name": "Lalgudi Road", "location": "11.0200,78.8800"},
    {"name": "Perambalur Road", "location": "11.0300,78.8900"},
    {"name": "Vasan City", "location": "11.0400,78.9000"},
    {"name": "Salai Road", "location": "11.0500,78.9100"},
    {"name": "Puthur Salai Road", "location": "11.0600,78.9200"},
    {"name": "Pettavaithalai", "location": "11.0700,78.9300"},
    {"name": "Ayyappa Nagar", "location": "11.0800,78.9400"},
    {"name": "Vasan Nagar", "location": "11.0900,78.9500"},
    {"name": "Mutharasanallur", "location": "11.1000,78.9600"},
    {"name": "Thuvakudi", "location": "11.1100,78.9700"},
    {"name": "Manikandam", "location": "11.1200,78.9800"},
    {"name": "Annamalai Nagar", "location": "11.1300,78.9900"},
    {"name": "Mannachanallur", "location": "11.1400,79.0000"},
    {"name": "Crawford", "location": "11.1500,79.0100"},
    {"name": "Ramalinga Nagar", "location": "11.1600,79.0200"},
    {"name": "Anna Nagar", "location": "11.1700,79.0300"},
    {"name": "Pettavaithalai", "location": "11.1800,79.0400"},
    {"name": "Shanmuga Nagar", "location": "11.1900,79.0500"},
    {"name": "Allithurai", "location": "11.2000,79.0600"},
    {"name": "Ariyamangalam", "location": "11.2100,79.0700"},
    {"name": "Pichandarkovil", "location": "11.2200,79.0800"},
    {"name": "Karur Bye Pass Road", "location": "11.2300,79.0900"},
    {"name": "Trichy Dindugal NH", "location": "11.2400,79.1000"},
    {"name": "Lalgudi Road", "location": "11.2500,79.1100"},
    {"name": "Perambalur Road", "location": "11.2600,79.1200"},
    {"name": "Vasan City", "location": "11.2700,79.1300"},
    {"name": "Salai Road", "location": "11.2800,79.1400"}
]
AMENITY_TYPES = ["supermarket", "atm", "school"]
RADIUS = 2000  # meters (2km around each area center)

def get_places_near_location(api_key, location, radius, amenity_type):
    endpoint = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        'location': location,
        'radius': radius,
        'type': amenity_type,
        'key': api_key
    }
    
    all_results = []
    while True:
        response = requests.get(endpoint, params=params)
        results = response.json()
        
        if 'results' in results:
            all_results.extend(results['results'])
        
        if 'next_page_token' not in results:
            break
            
        params['pagetoken'] = results['next_page_token']
        time.sleep(2)  # Required delay for page tokens
    
    return all_results

def process_place(place):
    return {
        "name": place.get('name'),
        "address": place.get('vicinity', place.get('formatted_address', '')),
        "latitude": place['geometry']['location']['lat'],
        "longitude": place['geometry']['location']['lng'],
        "rating": place.get('rating', None),
        "types": place.get('types', [])
    }

def scrape_trichy_amenities():
    trichy_data = defaultdict(lambda: defaultdict(list))
    
    for area in TRICHY_AREAS:
        area_name = area['name']
        location = area['location']
        
        print(f"Processing area: {area_name}...")
        
        for amenity in AMENITY_TYPES:
            print(f"  - Collecting {amenity}s...")
            places = get_places_near_location(API_KEY, location, RADIUS, amenity)
            
            for place in places:
                processed_place = process_place(place)
                trichy_data[area_name][amenity].append(processed_place)
            
            time.sleep(1)  # Be gentle with the API
    
    return trichy_data

def save_to_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    print("Starting Trichy amenities scraping...")
    amenities_data = scrape_trichy_amenities()
    save_to_json(amenities_data, "trichy_amenities_by_area.json")
    print("Scraping completed. Data saved to trichy_amenities_by_area.json")