var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: ' <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.locate({setView: true, maxZoom: 16});

function onLocationFound(e) {
    var radius = e.accuracy / 2;

    L.marker(e.latlng).addTo(map)
        .bindPopup("You are within " + radius + " meters from this point").openPopup();

    L.circle(e.latlng, radius).addTo(map);
}

map.on('locationfound', onLocationFound);

map.on('locationerror', function(e) {
    alert(e.message);
});

navigator.geolocation.watchPosition(function(position) {
    var latlng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    map.setView(latlng, 16);
    onLocationFound({
        latlng: latlng,
        accuracy: position.coords.accuracy
    });
}, function(error) {
    onLocationError(error);
}, {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
});

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
            L.polyline(routeCoordinates, { color: 'blue' }).addTo(map);
            map.fitBounds(L.polyline(routeCoordinates).getBounds());
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
        return [results[0].lon, results[0].lat];
    }
    return null;
}

async function fetchDirections(startCoords, endCoords) {
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
    return await response.json();
}




// if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(function(position) {
//         var lat = position.coords.latitude;
//         var lon = position.coords.longitude;
//         map.setView([lat, lon], 13);

//         L.marker([lat, lon]).addTo(map)
//             .bindPopup('You are here!')
//             .openPopup();
//     });
// }
