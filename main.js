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

// navigator.geolocation.watchPosition(function(position) {
//     var latlng = {
//         lat: position.coords.latitude,
//         lng: position.coords.longitude
//     };
//     // map.setView(latlng, 16);
//     // map.flyTo(latlng, 15, { animate: true, duration: 2 });
//     onLocationFound({
//         latlng: latlng,
//         accuracy: position.coords.accuracy
//     });
// }, function(error) {
//     onLocationError(error);
// }, {
//     enableHighAccuracy: true,
//     timeout: 10000,
//     maximumAge: 0
// });

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

var searchControl = L.esri.Geocoding.geosearch(
    {
        position: 'topright', // Position the search control
        placeholder: 'Search'
    }
).addTo(map);
var results = L.layerGroup().addTo(map);

searchControl.on('results', function(data) {
    results.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
        results.addLayer(L.marker(data.results[i].latlng));
    }
}); 
  var geocoderControl = document.querySelector('.geocoder-control');
        geocoderControl.classList.add('geocoder-control');
