document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM Loaded, initializing autocomplete...");
    initAutocomplete();
});

function initAutocomplete() {
    const input = document.getElementById("locationInput");

    if (!input) {
        console.error("Location input field not found!");
        return;
    }

    const autocomplete = new google.maps.places.Autocomplete(input, {
        types: ["geocode"],
        componentRestrictions: { country: "IN" }
    });

    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();

        if (place.geometry) {
            console.log("Selected Place:", place.formatted_address);
            console.log("Coordinates:", place.geometry.location.lat(), place.geometry.location.lng());

            initMap(place.geometry.location.lat(), place.geometry.location.lng());
        } else {
            console.log("No details available for input:", input.value);
        }
    });
}

function initMap(lat = 13.0827, lng = 80.2707) {  // Default location: Chennai
    const map = new google.maps.Map(document.getElementById("map"), {
        center: { lat, lng },
        zoom: 14
    });

    new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: "Selected Location"
    });

    drawCircle(map, lat, lng);
}

function drawCircle(map, lat, lng) {
    const range = parseInt(document.getElementById("rangeInput").value.trim());

    if (!isNaN(range) && range >= 1 && range <= 10) {
        new google.maps.Circle({
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35,
            map,
            center: { lat, lng },
            radius: range * 1000 // Convert km to meters
        });
    }
}

document.getElementById("searchButton").addEventListener("click", function () {
    let location = document.getElementById("locationInput").value.trim();
    let range = document.getElementById("rangeInput").value.trim();

    if (!location) {
        alert("Please enter a location!");
        return;
    }
    if (!range || isNaN(range) || range < 1 || range > 10) {
        alert("Please enter a valid range between 1 - 10 Km!");
        return;
    }

    window.location.href = `analytics.html?location=${encodeURIComponent(location)}&range=${range}`;
});

document.getElementById("rangeInput").addEventListener("input", function (event) {
    let value = event.target.value.replace(/\D/g, ""); // Allow only numbers
    if (value !== "" && (value < 1 || value > 10)) {
        event.target.value = ""; // Clear if out of range
    } else {
        event.target.value = value;
    }
});

document.getElementById("locationInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        document.getElementById("searchButton").click();
    }
});

document.getElementById("rangeInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        document.getElementById("searchButton").click();
    }
});


window.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const location = params.get("location");
    const range = params.get("range");

    if (location && range) {
        document.getElementById("selectedLocation").textContent = `Location: ${location}`;
        document.getElementById("selectedRange").textContent = `Range: ${range} Km`;

        // You can now use these values to fetch data or render map
        console.log("Location:", location);
        console.log("Range:", range);
    } else {
        console.error("Missing location or range in query parameters.");
    }
});
