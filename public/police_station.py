import requests
import json
import time

# Replace with your actual API key
API_KEY = "AIzaSyB38DDVaEpSQJN8kH5sol9ECGumiqOOiBs"

def get_police_stations_in_trichy(api_key):
    base_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    query = "Police station in Trichy"
    params = {
        "query": query,
        "key": api_key,
        "region": "in"
    }
    
    all_results = []
    
    while True:
        response = requests.get(base_url, params=params)
        data = response.json()
        
        if data["status"] != "OK":
            print(f"Error: {data['status']}")
            break
            
        for place in data["results"]:
            all_results.append({
                "name": place.get("name", ""),
                "address": place.get("formatted_address", ""),
                "latitude": place["geometry"]["location"]["lat"],
                "longitude": place["geometry"]["location"]["lng"]
            })
        
        if "next_page_token" not in data:
            break
            
        time.sleep(2)
        params["pagetoken"] = data["next_page_token"]
    
    return all_results

def get_police_stations_by_areas(api_key):
    trichy_areas = [
        "Srirangam", "Woraiyur", "Cantonment", "Golden Rock",
    "K.K. Nagar", "Thillai Nagar", "Puthur", "Ariyamangalam",
    "Ponmalai", "Manachanallur", "Manikandam", "Thiruverumbur",
    "Mathur", "Karumandapam", "Panjappur", "Thiruvanaikoil",
    "Edamalaipatti Pudur", "Samayapuram", "Kattur", "Vayalur Road",
    "Karur Bye Pass Road", "Pichandarkovil", "Trichy Dindugal NH",
    "Perambalur Road", "Lalgudi Road", "Trichy Madurai Road",
    "Shanmuga Nagar", "Allithurai", "Ramalinga Nagar", "Anna Nagar",
    "Salai Road", "Pettavaithalai", "Ayyappa Nagar", "Vasan Nagar",
    "Mutharasanallur", "Thuvakudi", "Annamalai Nagar", "Crawford",
    "Pallpannai", "Subramaniapuram", "Melapudur", "Senthaneerpuram",
    "Thangeswari Nagar", "Kalkandar Kottai", "Ex-servicemen Colony"
    ]
    
    all_results = []
    
    for area in trichy_areas:
        query = f"Police station in {area}, Trichy"
        params = {
            "query": query,
            "key": api_key,
            "region": "in"
        }
        
        response = requests.get(base_url, params=params)
        data = response.json()
        
        if data["status"] == "OK":
            for place in data["results"]:
                all_results.append({
                    "name": place.get("name", ""),
                    "address": place.get("formatted_address", ""),
                    "latitude": place["geometry"]["location"]["lat"],
                    "longitude": place["geometry"]["location"]["lng"]
                })
            print(f"Found {len(data['results'])} in {area}")
        else:
            print(f"Error in {area}: {data['status']}")
    
    return all_results

# Get the data
police_stations = get_police_stations_in_trichy(API_KEY)
# police_stations = get_police_stations_by_areas(API_KEY)  # Alternative area-wise search

# Remove duplicates
unique_stations = []
seen = set()

for station in police_stations:
    identifier = (station["name"], station["address"])
    if identifier not in seen:
        seen.add(identifier)
        unique_stations.append(station)

# Save to JSON file in the exact requested format
with open("trichy_police_stations.json", "w") as f:
    json.dump(unique_stations, f, indent=2)

print(f"Found {len(unique_stations)} police stations in Trichy")