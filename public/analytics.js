let map, heatmap, marker, circle;
let amenitiesData = null;
let allPoliceStations = [];
let policeStationMarkers = [];
let amenityMarkers = [];
let currentAmenityType = null;
let directionsService;
let directionsRenderer;
let currentRange = 5;
let currentLocation = null;

// API Endpoints
const CRIME_DATA_URL = '/trichy_crime_lat_long.json';
const POLICE_STATIONS_URL = '/trichy_police_stations.json';
const AMENITIES_URL = '/trichy_amenities_by_area.json';

// Initialize Map & Data Fetching
window.onload = async function() {
    try {
        // 1. Initialize map (wait for it to complete)
        await initMap();

        // 2. Verify everything loaded
        if (!map) throw new Error("Map failed to initialize");
        if (!amenitiesData) console.warn("Amenities data not loaded yet."); // Might load during initMap

        // 3. Setup UI interactions
        setupAmenityClickHandlers(); // Setup clicks AFTER map is ready

        console.log("Initialization complete. Amenities will be shown by processLocation.");

    } catch (error) {
        console.error("Initialization failed:", error);
        alert("Map initialization error. Please check console for details.");
    }
};

async function initMap() {
    // Default coordinates if none provided
    const defaultCenter = { lat: 10.7905, lng: 78.7047 };

    // Initialize map
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: defaultCenter,
        disableDefaultUI: true
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false
    });

    try {
        // Fetch all data in parallel
        const [crimeData, policeStations, amenities] = await Promise.all([
            fetchData(CRIME_DATA_URL),
            fetchData(POLICE_STATIONS_URL),
            fetchData(AMENITIES_URL)
        ]);

        console.log("All data loaded successfully");

        // Store data globally
        amenitiesData = amenities;
        allPoliceStations = policeStations;

        // Initialize visualizations
        initHeatmap(crimeData);
        displayAllPoliceStationsOnMap(allPoliceStations);

        // Get parameters from URL
        const params = new URLSearchParams(window.location.search);
        const location = params.get("location");
        const range = parseFloat(params.get("range")) || 5; // Get range from URL

        if (location) {
            console.log("Processing location:", location, "with range:", range);
            await processLocation(location, range);
            updateAmenitiesInfo(location, amenitiesData);
        }

    } catch (error) {
        console.error("Error in initialization:", error);
        alert("Failed to load map data. Please check your connection and try again.");
    }
    setupAmenityClickHandlers();
}

// Function to display all police stations on the map
function displayAllPoliceStationsOnMap(stations) {
    // Clear existing markers first
    clearPoliceStationMarkers();

    stations.forEach(station => {
        const marker = new google.maps.Marker({
            position: { lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) },
            map: map,
            title: station.name,
            icon: {
                url: "/assets/images/policeshield_89234.png",
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 32)
            }
        });
        policeStationMarkers.push(marker);
    });
}

// Function to clear all police station markers
function clearPoliceStationMarkers() {
    policeStationMarkers.forEach(marker => marker.setMap(null));
    policeStationMarkers = [];
}

// Function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Filter police stations by range and return with distance information
async function filterPoliceStations(location, rangeKm, allStations) {
    try {
        const geocoder = new google.maps.Geocoder();
        const result = await new Promise((resolve, reject) => {
            geocoder.geocode({ address: location }, (results, status) => {
                if (status === 'OK') resolve(results);
                else reject(status);
            });
        });

        const center = result[0].geometry.location;
        const centerLat = center.lat();
        const centerLng = center.lng();
        const rangeMeters = rangeKm * 1000;

        // Process stations with distance calculations
        const stationsWithDistance = allStations.map(station => {
            const stationLat = parseFloat(station.latitude);
            const stationLng = parseFloat(station.longitude);

            if (isNaN(stationLat) || isNaN(stationLng)) {
                console.warn(`Invalid coordinates for station: ${station.name}`);
                return {
                    ...station,
                    distance: Infinity,
                    distanceKm: "N/A",
                    withinRange: false
                };
            }

            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(centerLat, centerLng),
                new google.maps.LatLng(stationLat, stationLng)
            );

            return {
                ...station,
                distance: distance,
                distanceKm: (distance / 1000).toFixed(2),
                withinRange: distance <= rangeMeters
            };
        });

        // Return all stations but with distance info, sorted by distance
        return stationsWithDistance.sort((a, b) => a.distance - b.distance);

    } catch (error) {
        console.error("Geocoding error:", error);
        return allStations.map(station => ({
            ...station,
            distance: Infinity,
            distanceKm: "N/A",
            withinRange: false
        }));
    }
}

// Enhanced police station display function for the sidebar (Box 2)
function displayPoliceStations(filteredStations) {
    const policeListElement = document.getElementById("police-list");
    policeListElement.innerHTML = "";

    if (!filteredStations || filteredStations.length === 0) {
        policeListElement.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <p>No police stations found within the specified area</p>
            </div>
        `;
        return;
    }

    // Create header with count
    const header = document.createElement("div");
    header.className = "stations-header";
    header.innerHTML = `
            <h3><i class="fas fa-shield-alt"></i> Nearby Police Stations</h3>
            <span class="badge">${filteredStations.length} found</span>
        `;
    policeListElement.appendChild(header);

    // Create list of stations
    const listContainer = document.createElement("div");
    listContainer.className = "stations-list";

    filteredStations.forEach(station => {
        const stationElement = document.createElement("div");
        stationElement.className = "station-card";
        stationElement.innerHTML = `
            <div class="station-header">
                <h4><i class="fas fa-building"></i> ${station.name}</h4>
                ${station.distanceKm ? `<span class="distance">${station.distanceKm} km</span>` : ''}
            </div>
            <div class="station-body">
                <p><i class="fas fa-map-marker-alt"></i> ${station.address}</p>
                ${station.phone ? `<p><i class="fas fa-phone"></i> ${station.phone}</p>` : ''}
            </div>
            <button class="btn directions-btn" onclick="showDirections(${station.latitude}, ${station.longitude})">
                <i class="fas fa-route"></i> Get Directions
            </button>
        `;
        listContainer.appendChild(stationElement);
    });

    policeListElement.appendChild(listContainer);
}

function createPoliceMarkers(userLocation, policeStations, selectedRange) {
    clearPoliceStationMarkers();
    const rangeMeters = selectedRange * 1000;

    policeStations.forEach(station => {
        // Only create markers for stations that are within range
        if (station.withinRange) {
            try {
                const stationLat = parseFloat(station.latitude);
                const stationLng = parseFloat(station.longitude);

                const marker = new google.maps.Marker({
                    position: { lat: stationLat, lng: stationLng },
                    map: map,
                    title: station.name,
                    icon: {
                        url: "/assets/images/policeshield_89234.png",
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 32)
                    }
                });

                // Info window content
                const infoContent = document.createElement('div');
                infoContent.innerHTML = `
                    <div class="info-window">
                        <h3>${station.name}</h3>
                        <p>${station.address || 'Address not available'}</p>
                        ${station.phone ? `<p><i class="fas fa-phone"></i> ${station.phone}</p>` : ''}
                        <p>Distance: ${station.distanceKm} km</p>
                        <button class="btn directions-btn" 
                            onclick="window.showDirections(${stationLat}, ${stationLng})">
                            <i class="fas fa-route"></i> Get Directions
                        </button>
                    </div>
                `;

                const infoWindow = new google.maps.InfoWindow({
                    content: infoContent
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                policeStationMarkers.push(marker);
            } catch (error) {
                console.error(`Error creating marker for station ${station.name}:`, error);
            }
        }
    });
}

// Function to calculate distance between two coordinates using Haversine formula
function haversineDistance(coord1, coord2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = toRadians(coord2.lat - coord1.lat);
    const dLng = toRadians(coord2.lng - coord1.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Convert degrees to radians
function toRadians(deg) {
    return deg * (Math.PI / 180);
}

// Function to show directions to a police station
function showDirections(lat, lng) {
    const params = new URLSearchParams(window.location.search);
    const originLocation = params.get("location");

    if (!originLocation) {
        alert("Please enter a location first");
        return;
    }

    const request = {
        origin: originLocation,
        destination: { lat: parseFloat(lat), lng: parseFloat(lng) },
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(result);

            // Optional: Scroll to the map box if it's not in view
            const mapElement = document.getElementById("map");
            if (mapElement) {
                mapElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        } else {
            console.error("Directions request failed due to ", status);
            alert("Failed to fetch directions. Please try again.");
        }
    });
}

async function processLocation(location, range) {
    try {
        const geocoder = new google.maps.Geocoder();
        console.log(`Geocoding: ${location}`);

        const result = await new Promise((resolve, reject) => {
            geocoder.geocode({ address: location }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    console.log("Geocoding successful:", results[0]);
                    resolve(results);
                } else {
                    console.error(`Geocoding failed for "${location}": ${status}`);
                    reject(new Error(`Geocoding failed: ${status}`));
                }
            });
        });

        const center = result[0].geometry.location;
        const lat = center.lat();
        const lng = center.lng();
        console.log("Extracted Coords - Lat:", lat, "Lng:", lng);

        currentLocation = location;
        currentRange = range;

        map.setCenter({ lat, lng });
        map.setZoom(14);

        marker = new google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: location,
            // You can add your marker icon here if needed
        });

        drawCircle(lat, lng, range);

        const nearbyStations = await filterPoliceStations(location, range, allPoliceStations);
        const stationsWithinRange = nearbyStations.filter(station => station.withinRange);
        displayPoliceStations(stationsWithinRange);
        createPoliceMarkers({ lat, lng }, stationsWithinRange, range);

        updateAmenitiesInfo(location, amenitiesData, range);

        // REMOVED: Initial amenity marker display

    } catch (error) {
        console.error("Error processing location:", error);
        currentLocation = null;
        currentRange = 5;
        alert(`Could not process the location "${location}". Please check the name or try again. Error: ${error.message}`);

        if (marker) marker.setMap(null);
        if (circle) circle.setMap(null);
        clearAmenityMarkers();
        clearPoliceStationMarkers();
        if (directionsRenderer) directionsRenderer.setDirections({ routes: [] });
    }
}

function drawCircle(lat, lng, range) {
    if (circle) circle.setMap(null);
    circle = new google.maps.Circle({
        map: map,
        center: { lat, lng },
        radius: range * 1000,
        strokeColor: "#007bff",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#007bff",
        fillOpacity: 0.2,
    });
}

function initHeatmap(crimeData) {
    if (!crimeData || !Array.isArray(crimeData)) {
        console.error("Invalid crime data format");
        return;
    }

    const heatmapData = crimeData.map(point =>
        new google.maps.LatLng(point.coordinates.lat, point.coordinates.lng)
    );

    heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 30
    });
}

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        throw error;
    }
}

function setupAmenityClickHandlers() {
    document.querySelectorAll('.amenity.clickable').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            const type = this.getAttribute('data-type');

            document.getElementById('map-container').scrollIntoView({
                behavior: 'smooth'
            });

            setTimeout(() => {
                 // Toggle logic: If clicked type is the same, clear markers and reset.
                if (currentAmenityType === type) {
                    clearAmenityMarkers();
                    currentAmenityType = null;
                } else {
                    // Otherwise, show markers for the new type.
                    showAmenities(type);
                    currentAmenityType = type;
                }
            }, 300);
        });
    });
}

// Update the showAmenities function
// Modify the showAmenities function to conditionally clear markers
// clearPreviousMarkers defaults to true if not provided
function showAmenities(type, clearPreviousMarkers = true) {
    // Use the globally set currentLocation and currentRange
    if (!currentLocation || !amenitiesData || !marker || !currentRange) {
        console.warn("showAmenities: Required data (currentLocation, amenitiesData, marker, currentRange) not available.");
        return;
    }

    // --- Conditional Clearing ---
    if (clearPreviousMarkers) {
        clearAmenityMarkers(); // Clear existing amenity markers
        currentAmenityType = type; // Set current type only when clearing others
    } else {
        // If not clearing, we are likely adding multiple types, so don't set a single currentAmenityType
        // Or, adjust logic if needed based on how you want currentAmenityType to behave during initial load
    }
    // --- End Conditional Clearing ---

    // Define icon configurations locally or determine them inline
    const commonScaledSize = new google.maps.Size(32, 32);
    let iconConfig = null;

    // Determine the icon based on the type
    if (type === 'supermarket') {
        iconConfig = { url: '/assets/images/supermarket.png', scaledSize: commonScaledSize };
    } else if (type === 'atm') {
        iconConfig = { url: '/assets/images/atm-location.png', scaledSize: commonScaledSize };
    } else if (type === 'school') {
        iconConfig = { url: '/assets/images/education.png', scaledSize: commonScaledSize };
    } else {
        console.warn(`showAmenities: No icon defined for amenity type: [${type}].`);
        // Decide if you want to skip or use a default marker if icon is unknown
        return; // Skip adding markers if type is unknown and has no icon
    }

    const areaName = currentLocation.split(',')[0].trim().toLowerCase();
    const matchedKey = Object.keys(amenitiesData).find(key => key.trim().toLowerCase() === areaName);

    if (!matchedKey || !amenitiesData[matchedKey] || !amenitiesData[matchedKey][type]) {
        console.warn(`showAmenities: No data found for ${type} in area key ${matchedKey || areaName}.`);
        return;
    }

    const amenities = amenitiesData[matchedKey][type];
    const center = marker.getPosition();
    const rangeMeters = currentRange * 1000; // Calculate range in meters once

    console.log(`Showing ${type} amenities within ${currentRange}km.`); // Log which type is being processed

    amenities.forEach(amenity => {
        try {
            const amenityLat = parseFloat(amenity.latitude);
            const amenityLng = parseFloat(amenity.longitude);

            if (isNaN(amenityLat) || isNaN(amenityLng)) {
                // console.warn(`showAmenities: Invalid coordinates for ${amenity.name || type}.`); // Can be verbose
                return;
            }

            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                center,
                new google.maps.LatLng(amenityLat, amenityLng)
            );

            if (distance <= rangeMeters) {
                // Icon config is already checked above
                const amenityMarker = new google.maps.Marker({
                    position: { lat: amenityLat, lng: amenityLng },
                    map: map,
                    title: `${type}: ${amenity.name || 'Unnamed'}`, // Add type to title for clarity
                    icon: iconConfig,
                    animation: google.maps.Animation.DROP
                });
                amenityMarkers.push(amenityMarker); // Add to the single list of amenity markers
            }
        } catch (error) {
            console.error(`showAmenities: Error processing or creating marker for ${type}:`, error);
        }
    });

    // Optional: Update counts if needed, though updateAmenitiesInfo should handle initial counts
    // updateAmenityCount(type, amenities); // Might need adjustment based on how counts are displayed
}

function handleAmenityClick(type) {
    // Get range from URL parameters
    const params = new URLSearchParams(window.location.search);
    const range = parseFloat(params.get("range")) || 5;

    // Scroll to map first
    document.getElementById('map-container').scrollIntoView({ behavior: 'smooth' });

    // Show markers after slight delay to ensure map is visible
    setTimeout(() => {
        showAmenities(type, range);
    }, 300);
}

// Update the setupAmenityClickHandlers function
function setupAmenityClickHandlers() {
    document.querySelectorAll('.amenity.clickable').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default anchor behavior

            const type = this.getAttribute('data-type');
            const params = new URLSearchParams(window.location.search);
            const range = parseFloat(params.get("range")) || 5;

            // Scroll to map first
            document.getElementById('map-container').scrollIntoView({
                behavior: 'smooth'
            });

            // Then show markers after a small delay to ensure map is visible
            setTimeout(() => {
                // Clear previous markers of this type if already shown
                if (currentAmenityType === type) {
                    clearAmenityMarkers();
                    currentAmenityType = null;
                    return;
                }

                // Show new markers
                showAmenities(type, range);
            }, 300);
        });
    });
}

function clearAmenityMarkers() {
    amenityMarkers.forEach(marker => marker.setMap(null));
    amenityMarkers = [];
}

function countAmenitiesInRange(amenities, center, range) {
    if (!amenities || !center) return 0;

    const rangeMeters = range * 1000;
    let count = 0;

    amenities.forEach(amenity => {
        try {
            const amenityLat = parseFloat(amenity.latitude);
            const amenityLng = parseFloat(amenity.longitude);

            if (isNaN(amenityLat) || isNaN(amenityLng)) return;

            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                center,
                new google.maps.LatLng(amenityLat, amenityLng)
            );

            if (distance <= rangeMeters) count++;
        } catch (error) {
            console.error("Error calculating distance:", error);
        }
    });

    return count;
}

function updateAmenityCount(type, amenities, highlight = false) {
    const element = document.getElementById(`${type}-count`);
    if (!element) return;

    if (!amenities || !marker) {
        element.textContent = amenities ? `${amenities.length} in area` : "N/A";
        return;
    }

    const center = marker.getPosition();
    const count = countAmenitiesInRange(amenities, center, currentRange);

    element.textContent = count > 0 ? `${count} within ${currentRange} km` : "None in range";

    if (highlight) {
        element.classList.add('highlight');
        setTimeout(() => element.classList.remove('highlight'), 1000);
    }
}

function updateAmenityTypeCount(type, amenities, element, range) {
    if (!amenities || !element) {
        element.textContent = "N/A";
        return;
    }

    // If no marker (no location selected), show total count
    if (!marker) {
        element.textContent = `${amenities.length} in area`;
        return;
    }

    const center = marker.getPosition();
    const rangeMeters = range * 1000;
    let count = 0;

    amenities.forEach(amenity => {
        try {
            const amenityLat = parseFloat(amenity.latitude);
            const amenityLng = parseFloat(amenity.longitude);

            if (isNaN(amenityLat) || isNaN(amenityLng)) return;

            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                center,
                new google.maps.LatLng(amenityLat, amenityLng)
            );

            if (distance <= rangeMeters) {
                count++;
            }
        } catch (error) {
            console.error(`Error processing ${type} amenity:`, error);
        }
    });

    element.textContent = count > 0 ? `${count} within ${range} km` : "None in range";
    element.classList.add('highlight');
    setTimeout(() => element.classList.remove('highlight'), 1000);
}

function resetAmenityCounts() {
    ['supermarket', 'atm', 'school'].forEach(type => {
        const element = document.getElementById(`${type}-count`);
        if (element) element.textContent = "N/A";
    });
}

function updateAmenitiesInfo(location, amenitiesData, range = currentRange) {
    if (!location || !amenitiesData) return;

    currentLocation = location;
    currentRange = range;

    const areaName = location.split(',')[0].trim().toLowerCase();
    const matchedKey = Object.keys(amenitiesData).find(
        key => key.trim().toLowerCase() === areaName
    );

    if (!matchedKey) {
        document.getElementById("area-name").textContent = `${areaName} (data not available)`;
        resetAmenityCounts();
        return;
    }

    const areaData = amenitiesData[matchedKey];
    document.getElementById("area-name").textContent = matchedKey;

    // Update counts for all amenity types immediately
    updateAmenityCount('supermarket', areaData.supermarket);
    updateAmenityCount('atm', areaData.atm);
    updateAmenityCount('school', areaData.school);
}

function ensureMapShowsAllMarkers() {
    if (marker && policeStationMarkers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(marker.getPosition());
        policeStationMarkers.forEach(m => bounds.extend(m.getPosition()));
        map.fitBounds(bounds);
    }
}