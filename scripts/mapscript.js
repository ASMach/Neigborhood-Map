var map;

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;

// TODO: Move these locations into an external MySQL database
var locations = [
                 {title: '6045 Shadygrove Drive', location: {lat: 37.314316, lng: -122.008423}},
                 {title: '10798 Stokes Avenue', location: {lat: 37.33107589999999, lng: -122.05861119999997}},
                 {title: '22293 McClellan Road', location: {lat: 37.314686, lng: -122.06510760000003}},
                 {title: '21491 Columbus Ave', location: {lat: 37.308121, lng: -122.05015400000002}},
                 {title: '10686 Johansen Drive', location: {lat: 37.3129266, lng: -122.0066923}}
                 ];


// Create a styles array to use with the map.
var styles = [
              {
              featureType: 'water',
              stylers: [
                        { color: '#19a0d8' }
                        ]
              },{
              featureType: 'administrative',
              elementType: 'labels.text.stroke',
              stylers: [
                        { color: '#ffffff' },
                        { weight: 6 }
                        ]
              },{
              featureType: 'administrative',
              elementType: 'labels.text.fill',
              stylers: [
                        { color: '#ef3131' }
                        ]
              },{
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [
                        { color: '#efe9e4' },
                        { lightness: -40 }
                        ]
              },{
              featureType: 'transit.station',
              stylers: [
                        { weight: 9 },
                        { hue: '#019a93' }
                        ]
              },{
              featureType: 'road.highway',
              elementType: 'labels.icon',
              stylers: [
                        { visibility: 'off' }
                        ]
              },{
              featureType: 'water',
              elementType: 'labels.text.stroke',
              stylers: [
                        { lightness: 100 }
                        ]
              },{
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [
                        { lightness: -100 }
                        ]
              },{
              featureType: 'poi',
              elementType: 'geometry',
              stylers: [
                        { visibility: 'on' },
                        { color: '#f0e4d3' }
                        ]
              },{
              featureType: 'road.highway',
              elementType: 'labels.icon',
              stylers: [
                        { hue: -31 },
                        { saturation: -40 },
                        { lightness: 2.8 },
                        { visibility: 'on' }
                        ]
              },{
              featureType: 'road.highway',
              elementType: 'geometry.fill',
              stylers: [
                        { color: '#ef3131' },
                        { lightness: -25 }
                        ]
              }
              ];


// Add map to Knockout

ko.bindingHandlers.map = {
    
init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
    var mapObj = ko.utils.unwrapObservable(valueAccessor());
    var latLng = new google.maps.LatLng(
                                        ko.utils.unwrapObservable(mapObj.lat),
                                        ko.utils.unwrapObservable(mapObj.lng));
    var mapOptions = { center: latLng,
    zoom: 13,
    styles: styles,
        mapTypeControl: true};
    
    mapObj.googleMap = new google.maps.Map(element, mapOptions);
    
    // We need a reference to mapObj.googleMap for convenience
    map = mapObj.googleMap;
    
    $("#" + element.getAttribute("id")).data("mapObj",mapObj);
}
};

// Helper functions

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
                                                  'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
                                                  '|40|_|%E2%80%A2',
                                                  new google.maps.Size(21, 34),
                                                  new google.maps.Point(0, 0),
                                                  new google.maps.Point(10, 34),
                                                  new google.maps.Size(21,34));
    return markerImage;
}

// Knockout data model for our map system
function MapDataModel(title)
{
    // Get reference to self first
    var self = this;
    
    // Setup initial map
    self.mapObj = ko.observable({
                               lat: ko.observable(37.3230),
                               lng: ko.observable(-122.0322)
                               });
    
    // This global polygon variable is to ensure only ONE polygon is rendered.
    var polygon = null;
    
    // We need this drawing manager to be set later
    var drawingManager = null;

    // Create a new blank array for all the listing markers.
    self.markers = ko.observableArray();
    
    // Create placemarkers array to use in multiple functions to have control
    // over the number of places that show.
    self.placeMarkers = ko.observableArray();
    
    // Observable array operations
    self.addMarker = function(marker) {
        self.markers.push(marker);
    }
    self.removeMarker = function(marker) { self.markers.remove(marker) }
    
    self.addPlaceMarker = function(marker) {
        self.placeMarkers.push(new marker);
    }
    self.removePlaceMarker = function(marker) { self.placeMarkers.remove(marker) }
    
    // Menu visibility
    
    self.showMenu = ko.observable(false); // It's hidden by default
    
    self.toggleMenu = function() {
        $(".modal").modal();
        self.showMenu(!self.showMenu());
        // alert('showRow is now ' + self.showMenu()); // Uncomment for test purposes
    };
    
    // This function will loop through the listings and hide them all.
    self.hideMarkers = function hideMarkers(markers) {
        for (var i = 0; i < self.markers().length; i++) {
            self.markers()[i].setMap(null);
        }
    }
    

    // This shows and hides (respectively) the drawing options.
    self.toggleDrawing = function toggleDrawing(drawingManager) {
        if (drawingManager !== null)
        {
            if (drawingManager.map)
            {
                self.drawingManager.setMap(null);
                // In case the user drew anything, get rid of the polygon
                if (self.polygon !== null)
                {
                    self.polygon.setMap(null);
                }
            }
            else
            {
                if (map !== null)
                {
                    self.drawingManager.setMap(map);
                }
                else
                {
                    window.alert('Map has not been set!');
                }
            }
        }
        else
        {
            window.alert('No drawing manager found!');
        }
    }
    
    // This function allows the user to input a desired travel time, in
    // minutes, and a travel mode, and a location - and only show the listings
    // that are within that travel time (via that travel mode) of the location
    self.searchWithinTime = function searchWithinTime() {
        // Initialize the distance matrix service.
        var distanceMatrixService = new google.maps.DistanceMatrixService;
        var address = document.getElementById('search-within-time-text').value;
        // Check to make sure the place entered isn't blank.
        if (address == '') {
            window.alert('You must enter an address.');
        } else {
            self.hideMarkers(self.markers());
            // Use the distance matrix service to calculate the duration of the
            // routes between all our markers, and the destination address entered
            // by the user. Then put all the origins into an origin matrix.
            var origins = [];
            for (var i = 0; i < self.markers().length; i++) {
                origins[i] = self.markers()[i].position;
            }
            var destination = address;
            var mode = document.getElementById('mode').value;
            // Now that both the origins and destination are defined, get all the
            // info for the distances between them.
            distanceMatrixService.getDistanceMatrix({
                                                    origins: origins,
                                                    destinations: [destination],
                                                    travelMode: google.maps.TravelMode[mode],
                                                    unitSystem: google.maps.UnitSystem.IMPERIAL,
                                                    }, function(response, status) {
                                                    if (status !== google.maps.DistanceMatrixStatus.OK) {
                                                    window.alert('Distance matrix error was: ' + status);
                                                    } else {
                                                    displayMarkersWithinTime(response);
                                                    }
                                                    });
        }
    }
    
    // This function will go through each of the results, and,
    // if the distance is LESS than the value in the picker, show it on the map.
    function displayMarkersWithinTime(response) {
        var maxDuration = document.getElementById('max-duration').value;
        var origins = response.originAddresses;
        var destinations = response.destinationAddresses;
        // Parse through the results, and get the distance and duration of each.
        // Because there might be  multiple origins and destinations we have a nested loop
        // Then, make sure at least 1 result was found.
        var atLeastOne = false;
        for (var i = 0; i < origins.length; i++) {
            var results = response.rows[i].elements;
            for (var j = 0; j < results.length; j++) {
                var element = results[j];
                if (element.status === "OK") {
                    // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
                    // the function to show markers within a user-entered DISTANCE, we would need the
                    // value for distance, but for now we only need the text.
                    var distanceText = element.distance.text;
                    // Duration value is given in seconds so we make it MINUTES. We need both the value
                    // and the text.
                    var duration = element.duration.value / 60;
                    var durationText = element.duration.text;
                    if (duration <= maxDuration) {
                        //the origin [i] should = the markers[i]
                        self.markers()[i].setMap(map);
                        atLeastOne = true;
                        // Create a mini infowindow to open immediately and contain the
                        // distance and duration
                        var infowindow = new google.maps.InfoWindow({
                                                                    content: durationText + ' away, ' + distanceText +
                                                                    '<div><input type=\"button\" value=\"View Route\" onclick =' +
                                                                    '\"displayDirections(&quot;' + origins[i] + '&quot;);\"></input></div>'
                                                                    });
                        infowindow.open(map, self.markers()[i]);
                        // Put this in so that this small window closes if the user clicks
                        // the marker, when the big infowindow opens
                        self.markers()[i].infowindow = infowindow;
                        google.maps.event.addListener(self.markers()[i], 'click', function() {
                                                      this.infowindow.close();
                                                      });
                    }
                }
            }
        }
        if (!atLeastOne) {
            window.alert('We could not find any locations within that distance!');
        }
    }
    
    // This function is in response to the user selecting "show route" on one
    // of the markers within the calculated distance. This will display the route
    // on the map.
    function displayDirections(origin) {
        hideMarkers(self.markers());
        var directionsService = new google.maps.DirectionsService;
        // Get the destination address from the user entered value.
        var destinationAddress =
        document.getElementById('search-within-time-text').value;
        // Get mode again from the user entered value.
        var mode = document.getElementById('mode').value;
        directionsService.route({
                                // The origin is the passed in marker's position.
                                origin: origin,
                                // The destination is user entered address.
                                destination: destinationAddress,
                                travelMode: google.maps.TravelMode[mode]
                                }, function(response, status) {
                                if (status === google.maps.DirectionsStatus.OK) {
                                var directionsDisplay = new google.maps.DirectionsRenderer({
                                                                                           map: map,
                                                                                           directions: response,
                                                                                           draggable: true,
                                                                                           polylineOptions: {
                                                                                           strokeColor: 'green'
                                                                                           }
                                                                                           });
                                } else {
                                window.alert('Directions request failed due to ' + status);
                                }
                                });
    }
    
    // This function fires when the user selects a searchbox picklist item.
    // It will do a nearby search using the selected query string or place.
    function searchBoxPlaces(searchBox) {
        hideMarkers(self.placeMarkers());
        var places = searchBox.getPlaces();
        if (places.length == 0) {
            window.alert('We did not find any places matching that search!');
        } else {
            // For each place, get the icon, name and location.
            createMarkersForPlaces(places);
        }
    }

    
    // This function creates markers for each place found in either places search.
    function createMarkersForPlaces(places) {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < places.length; i++) {
            var place = places[i];
            var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
            };
            // Create a marker for each place.
            var marker = new google.maps.Marker({
                                                map: map,
                                                icon: icon,
                                                title: place.name,
                                                position: place.geometry.location,
                                                id: place.place_id
                                                });
            // Create a single infowindow to be used with the place details information
            // so that only one is open at once.
            var placeInfoWindow = new google.maps.InfoWindow();
            // If a marker is clicked, do a place details search on it in the next function.
            marker.addListener('click', function() {
                               if (placeInfoWindow.marker == this) {
                               console.log("This infowindow already is on this marker!");
                               } else {
                               getPlacesDetails(this, placeInfoWindow);
                               }
                               });
            addPlaceMarkers(marker);
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        }
        map.fitBounds(bounds);
    }
    
    // This is the PLACE DETAILS search - it's the most detailed so it's only
    // executed when a marker is selected, indicating the user wants more
    // details about that place.
    function getPlacesDetails(marker, infowindow) {
        var service = new google.maps.places.PlacesService(map);
        service.getDetails({
                           placeId: marker.id
                           }, function(place, status) {
                           if (status === google.maps.places.PlacesServiceStatus.OK) {
                           // Set the marker property on this infowindow so it isn't created again.
                           infowindow.marker = marker;
                           var innerHTML = '<div>';
                           if (place.name) {
                           innerHTML += '<strong>' + place.name + '</strong>';
                           }
                           if (place.formatted_address) {
                           innerHTML += '<br>' + place.formatted_address;
                           }
                           if (place.formatted_phone_number) {
                           innerHTML += '<br>' + place.formatted_phone_number;
                           }
                           if (place.opening_hours) {
                           innerHTML += '<br><br><strong>Hours:</strong><br>' +
                           place.opening_hours.weekday_text[0] + '<br>' +
                           place.opening_hours.weekday_text[1] + '<br>' +
                           place.opening_hours.weekday_text[2] + '<br>' +
                           place.opening_hours.weekday_text[3] + '<br>' +
                           place.opening_hours.weekday_text[4] + '<br>' +
                           place.opening_hours.weekday_text[5] + '<br>' +
                           place.opening_hours.weekday_text[6];
                           }
                           if (place.photos) {
                           innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
                                                                                      {maxHeight: 100, maxWidth: 200}) + '">';
                           }
                           innerHTML += '</div>';
                           infowindow.setContent(innerHTML);
                           infowindow.open(map, marker);
                           // Make sure the marker property is cleared if the infowindow is closed.
                           infowindow.addListener('closeclick', function() {
                                                  infowindow.marker = null;
                                                  });
                           }
                           });
    }
    
    // This function will loop through the markers array and display them all.
    self.showListings = function showListings() {
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < self.markers().length; i++) {
            self.markers()[i].setMap(map);
            bounds.extend(self.markers()[i].position);
        }
        map.fitBounds(bounds);
    }
    
    // This function will loop through the listings and hide them all.
    self.hideListings = function hideListings() {
        for (var i = 0; i < self.markers().length; i++) {
            self.markers()[i].setMap(null);
        }
    }
}

// Create a reference for our knockout view
mapView = new MapDataModel();

// Google Maps drawing functions

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
                               infowindow.marker = null;
                               });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        
        // Prepare CORS for Zillow
        // https://www.html5rocks.com/en/tutorials/cors/
        
        function createCORSRequest(method, url) {
            var xhr = new XMLHttpRequest();
            if ("withCredentials" in xhr) {
                // XHR for Chrome/Firefox/Opera/Safari.
                xhr.open(method, url, true);
            } else if (typeof XDomainRequest != "undefined") {
                // XDomainRequest for IE.
                xhr = new XDomainRequest();
                xhr.open(method, url);
            } else {
                // CORS not supported.
                xhr = null;
            }
            return xhr;
        }
        
        // Get walkability data
        
        var walkabilityDiv;
        
        walkabilityURL = 'http://api.walkscore.com/score?format=json&address=' + marker.title.split(' ').join('%20') + '%20Cupertino%20CA%95014' + '&lat=' + marker.getPosition().lat() + '&lon=' + marker.getPosition().lng() + '&transit=1&bike=1&wsapikey=2dec8712bf40d6202544462a8f334836';
        
        $.ajax({
               type: "GET",
               dataType: "josn",
               url: walkabilityURL,
               success: function (json) {
               result = '<div>Walkcore: ' + json["walkscore"] + '</div>';
               walkabilityDiv = '<div>Estimated Market Value (Zillow)</div>' + result;

               },
               error: function (json) {
               window.alert('Walkscore error was: ' + json.status + ' ' + json.statusText + ' at ' + walkabilityURL);
               walkabilityDiv = '<div>Cannot find walk score!</div>';
               }
               });
        
        // Get zillow information and store it here
        var zillowDiv;
        
        // Get XML for the marker's location from Zillow
        var zillowURL = 'http://www.zillow.com/webservice/GetSearchResults.htm?zws-id=X1-ZWz1fu8vullzpn_9od0r&address=' + marker.title.split(' ').join('+') + '&citystatezip=Cupertino%2C+CA';
        
        encodedurl = encodeURIComponent(zillowURL);
        
        // We are passing the Zillow URL through a third-party proxy server as per a tutorial at http://gis.yohman.com/up206b/tutorials/4-2-zillow-web-setting-up-a-proxy/
        
        $.ajax({
               type: "GET",
               url: "proxy.php?url=" + encodedurl,
               dataType: "xml",
               success: function (xml) {
               result = '<div>' + '$' + $(xml).find("amount").text() + '</div>';
               zillowDiv = '<div>Estimated Market Value (Zillow)</div>' + result;
               },
               error: function (xml) {
               window.alert('Zillow error was: ' + xml.status + ' ' + xml.statusText);
               zillowDiv = '<div>Cannot access Zillow API</div>';
               }
               });
        
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                                                                            nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>' + zillowDiv + walkabilityDiv);
                var panoramaOptions = {
                position: nearStreetViewLocation,
                pov: {
                heading: heading,
                pitch: 30
                }
                };
                var panorama = new google.maps.StreetViewPanorama(
                                                                  document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent('<div>' + marker.title + '</div>' +
                                      '<div>No Street View Found</div>' + zillowDiv + walkabilityDiv);
            }
        }
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
}

// This function hides all markers outside the polygon,
// and shows only the ones within it. This is so that the
// user can specify an exact area of search.
function searchWithinPolygon() {
    for (var i = 0; i < mapView.markers().length; i++) {
        if (google.maps.geometry.poly.containsLocation(mapView.markers()[i].position, polygon)) {
            mapView.markers()[i].setMap(map);
        } else {
            mapView.markers()[i].setMap(null);
        }
    }
}

// Initial map setup
function initMap() {

    // Constructor creates a new map centered on Cupertino, CA.
    map = new google.maps.Map(document.getElementById('map'), {
                              center: {lat: 37.3230, lng: -122.0322},
                              zoom: 13,
                              styles: styles,
                              mapTypeControl: true
                              });
    
    // Apply Knockout bindings
    ko.applyBindings(mapView);
    
    // This autocomplete is for use in the search within time entry box.
    var timeAutocomplete = new google.maps.places.Autocomplete(document.getElementById('search-within-time-text'));
    // This autocomplete is for use in the geocoder entry box.
    //var zoomAutocomplete = new google.maps.places.Autocomplete(document.getElementById('zoom-to-area-text'));
    // Bias the boundaries within the map for the zoom to area text.
    //zoomAutocomplete.bindTo('bounds', map);
    
    // These are the real estate listings that will be shown to the user.
    // Normally we'd have these in a database instead.
    
    var largeInfowindow = new google.maps.InfoWindow();
    
    // Initialize the drawing manager.
    mapView.drawingManager = new google.maps.drawing.DrawingManager({
                                                                drawingMode: google.maps.drawing.OverlayType.POLYGON,
                                                                drawingControl: true,
                                                                drawingControlOptions: {
                                                                position: google.maps.ControlPosition.TOP_RIGHT,
                                                                drawingModes: [
                                                                               google.maps.drawing.OverlayType.POLYGON
                                                                               ]
                                                                }
                                                                });
    
    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('0091ff');
    
    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('FFFF24');
    
    // The following group uses the location array to create an array of markers on initialize.
    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array.
        var position = locations[i].location;
        var title = locations[i].title;
        // Create a marker per location, and put into markers array.
        var marker = new google.maps.Marker({
                                            position: position,
                                            title: title,
                                            animation: google.maps.Animation.DROP,
                                            icon: defaultIcon,
                                            id: i
                                            });
        // Push the marker to our array of markers.
        mapView.addMarker(marker);
        // Create an onclick event to open the large infowindow at each marker.
        marker.addListener('click', function() {
                           populateInfoWindow(this, largeInfowindow);
                           });
        // Two event listeners - one for mouseover, one for mouseout,
        // to change the colors back and forth.
        marker.addListener('mouseover', function() {
                           this.setIcon(highlightedIcon);
                           });
        marker.addListener('mouseout', function() {
                           this.setIcon(defaultIcon);
                           });
    }

    // Listen for the event fired when the user selects a prediction and clicks
    // "go" more details for that place.
    //document.getElementById('go-places').addEventListener('click', textSearchPlaces);
    
    // Add an event listener so that the polygon is captured,  call the
    // searchWithinPolygon function. This will show the markers in the polygon,
    // and hide any outside of it.
    mapView.drawingManager.addListener('overlaycomplete', function(event) {
                               // First, check if there is an existing polygon.
                               // If there is, get rid of it and remove the markers
                               if (polygon) {
                               polygon.setMap(null);
                               hideMarkers(self.markers());
                               }
                               // Switching the drawing mode to the HAND (i.e., no longer drawing).
                               mapView.drawingManager.setDrawingMode(null);
                               // Creating a new editable polygon from the overlay.
                               polygon = event.overlay;
                               polygon.setEditable(true);
                               // Searching within the polygon.
                               searchWithinPolygon(polygon);
                               // Make sure the search is re-done if the poly is changed.
                               polygon.getPath().addListener('set_at', searchWithinPolygon);
                               polygon.getPath().addListener('insert_at', searchWithinPolygon);
                               });
}
