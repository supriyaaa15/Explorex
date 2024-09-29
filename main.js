var map = L.map('map').setView([22.3511148, 78.6677428], 5); // Center of India

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: ' <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var baseLayers = {
    "Streets": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
    "Satellite": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png')
};

L.control.layers(baseLayers).addTo(map);


map.locate({setView: true, maxZoom: 16});

var currentMarker;
var currentCircle;

function onLocationFound(e) {
    var radius = e.accuracy / 2;

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }
    if (currentCircle) {
        map.removeLayer(currentCircle);
    }

    var customMarker = L.divIcon({
        className: 'custom-marker',
        html: '<div></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    currentMarker=L.marker(e.latlng, {icon: customMarker}).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();
        
        currentCircle=L.circle(e.latlng,{
            radius: radius,
            color: '#ADD8E6',
            fillColor: '#ADD8E6',   // Fill color
            fillOpacity: 0.5
        }).addTo(map);

    // L.marker(e.latlng, { icon: customMarker }).addTo(map)
    //     .bindPopup("You are within " + radius + " meters from this point")
       currentMarker.on('click', function() {
            map.flyTo(e.latlng, 15, { animate: true, duration: 2 }); // Smooth zoom animation

    
        })   
}

function onLocationError(e) {
    alert('Geolocation error: ' + e.message);
    // Fallback to default location
    var defaultLatLng = { lat: 22.3511148, lng: 78.6677428 }; // Center of India
    onLocationFound({ latlng: defaultLatLng, accuracy: 1000 });
}

function locateUser() {
    navigator.geolocation.getCurrentPosition(function(position) {
        var latlng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        onLocationFound({
            latlng: latlng,
            accuracy: position.coords.accuracy
        });
    }, onLocationError, {
        enableHighAccuracy: false, // Set to false for faster response
        timeout: 20000, // Increase timeout value
        maximumAge: 0
    });
}

map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);

// Initial attempt to locate user
locateUser();

var control = L.Routing.control({
    waypoints: [],
    routeWhileDragging: true,
    geocoder: L.Control.Geocoder.nominatim()
}).addTo(map);

async function planRoute() {
    var start = document.getElementById('start').value;
    var end = document.getElementById('end').value;

    // Geocode the start and end locations
    const startCoords = await geocode(start);
    const endCoords = await geocode(end);

    if (startCoords && endCoords) {
        const directions = await fetchDirections(startCoords, endCoords);
        if (directions) {
            const routeCoordinates = directions.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            const routePolyline=L.polyline(routeCoordinates, { color: 'blue' }).addTo(map);

            const bounds = L.latLngBounds([startCoords[1], startCoords[0]], [endCoords[1], endCoords[0]]); 
            map.fitBounds(bounds);

            map.fitBounds(routePolyline.getBounds());
        } else {
            alert('Could not fetch directions.');
        }
    } else {
        alert('Could not geocode one or both locations.');
    }
}

async function geocode(location) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
    const results = await response.json();
    if (results.length > 0) {
        return [results[0].lat, results[0].lon];
    }
    return null;
}

async function fetchDirections(startCoords, endCoords) {
    try {
        const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': '5b3ce3597851110001cf6248f2927f3bb059485bbb10a4cf56656eb8'
            },
            body: JSON.stringify({
                coordinates: [startCoords, endCoords]
            })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching directions:', error);
        return null;
    }
}
   
  // Function to search for a place using Nominatim (OpenStreetMap geocoding)
  async function searchPlace() {
    var searchInput = document.getElementById('searchInput').value;
    if (!searchInput) {
        alert("Please enter a location.");
        return;
    }
try{
    // Use Nominatim OpenStreetMap API for geocoding
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchInput)}`);
    const results = await response.json();

    if (results.length > 0) {
        const lat = results[0].lat;
        const lon = results[0].lon;
        const placeName = results[0].display_name;

// Fetch weather data using OpenWeatherMap API
const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=4edae025e8f4db3bc4af7d2fb2aad71a&units=metric`);
const weatherData = await weatherResponse.json();

// Extract relevant weather information
const temperature = weatherData.main.temp;
const weatherDescription = weatherData.weather[0].description;

        // Center the map at the search result location
        map.setView([lat, lon], 13);

        // Add a marker at the search result location
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${placeName}</b>
                 <b>Temperature:</b> ${temperature}°C<br>
                    <b>Weather:</b> ${weatherDescription}`)
            .openPopup();
    } else {
        alert("Location not found. Try searching for another place.");
    }}
    catch(error){
        console.error("Error fetching location data:", error);
            alert("An error occurred while searching for the location. Please try again.");
    }
};
