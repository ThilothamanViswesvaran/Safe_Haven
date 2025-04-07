import json

# Load the JSON file
with open('trichy_amenities_by_area.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Count all "name" entries
name_count = 0

for area in data.values():  # Loop through each area (Srirangam, Woraiyur, etc.)
    for amenity_list in area.values():  # Loop through each amenity type (supermarket, atm, school)
        for place in amenity_list:  # Loop through each place
            if "name" in place:
                name_count += 1

print(f"Total 'name' entries in JSON: {name_count}")