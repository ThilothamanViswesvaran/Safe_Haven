import pandas as pd
import requests
import time

# Replace with your Google Maps API Key
API_KEY = "AIzaSyBqOwO9I64f1mZiLidPnXqERvK5-zdzjsg"

# Function to get latitude and longitude from Google Maps API
def get_lat_lon(address):
    base_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": address, "key": API_KEY}
    
    response = requests.get(base_url, params=params)
    data = response.json()
    
    if data["status"] == "OK":
        location = data["results"][0]["geometry"]["location"]
        return location["lat"], location["lng"]
    else:
        print(f"Error for address: {address}, Status: {data['status']}")
        return None, None

# Load the dataset (Ensure your CSV has an 'Address' column)
file_path = "Trichy.csv"  # Change this to your file path
df = pd.read_csv(file_path)

# Apply geocoding function
df[["Latitude", "Longitude"]] = df["address"].apply(lambda x: pd.Series(get_lat_lon(x)))

# Save the output
output_file = "Coimbatore_police_stations_with_latlong.csv"
df.to_csv(output_file, index=False)

print(f"Geocoding completed. File saved as {output_file}.")
