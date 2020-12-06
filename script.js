
var map; 
var start;
var destination;
var dirRenderer;
var latLngArray = [];
var elevationArray = [];
var startIndex = 0;
var batchSize = 100;

//--------------------------------------------------------------------------------------------------------------------------------------------
function showPage() {
  document.querySelector("#apiKeyPage").style.display = 'none';
  document.querySelector("#googleMapPage").style.display = 'block';
  document.querySelector("#map").style.display = 'block';
  positionMapDiv()
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function checkInput(input) {
  let setRule = new RegExp('(^[-+]?([0-9]+)(\.[0-9]+)?)$'); 
  if (input.match(setRule)){
    return true;
  } else {
    showAlert("danger", "Incorrect Input!")
  }
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function useStartLatLng(){
  let loc_Lat = document.querySelector("#startLat").value;
  let loc_Lng = document.querySelector("#startLng").value;
  if (checkInput(loc_Lat) && checkInput(loc_Lng)){
    if (!start) {
      start = new google.maps.Marker({
        position: new google.maps.LatLng(loc_Lat, loc_Lng),
        map:map
      });
      showAlert("success", "Start Marked!")
    }
  } 
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function useEndLatLng(){
  let loc_Lat = document.querySelector("#endLat").value;
  let loc_Lng = document.querySelector("#endLng").value;
  if (checkInput(loc_Lat) && checkInput(loc_Lng)){
    if (!destination){  
      destination = new google.maps.Marker({
      position: new google.maps.LatLng(loc_Lat, loc_Lng),
      map: map
      });
      showAlert("success", "Destination Marked!")
    }
  } 
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function resetMarker() {
  if (start) {
    start.setMap(null);
    start = null;
  }

  if (destination) {
    destination.setMap(null);
    destination = null;
  }
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function reset(){
  resetMarker()
  document.querySelector("#startLat").value = "";
  document.querySelector("#startLng").value = "";
  document.querySelector("#endLat").value = "";
  document.querySelector("#endLng").value = "";
  latLngArray = [];
  elevationArray = [];
  startIndex = 0;

  if (dirRenderer){
    dirRenderer.setMap(null);
  }
  showAlert("info", "Cleared All Fields!")
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function reLoad() {
  window.location.reload();
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function gm_authFailure() {
  showAlert("danger", "Enter a Valid Key!");
  setTimeout(reLoad, 3000);
};
  
//--------------------------------------------------------------------------------------------------------------------------------------------
function loadMap() {
  let key = document.querySelector("#apiKey").value
  if (key === "" || key == null) {
    showAlert("danger", "Please Enter a Key!");
    return 
  }
  // How to hide api key from CodingTrain??
  showPage()
  fetchData(function(){  
    let mapLocation = new google.maps.LatLng(23.8212, 78.74233); //14.6196, 74.8441
    let zoomVal = 4;
    let parameters = {
      center: mapLocation,
      zoom:zoomVal,
    }
    map = new google.maps.Map(document.getElementById("map"), parameters);
    map.setOptions({draggableCursor:'crosshair'});
    document.querySelector("#map").style.border = '1px solid';
    map.addListener("click", function (mouseClick) {
      if (!start) {
        start = new google.maps.Marker({
          position: mouseClick.latLng,
          map:map
        });

        let startLat = document.querySelector("#startLat").value;
        let startLng = document.querySelector("#startLng").value;
        if ((startLat == null && startLng == null)|| (startLat == "" && startLng == "")){
          document.querySelector("#startLat").value = roundTo(start.getPosition().lat(), 5);
          document.querySelector("#startLng").value = roundTo(start.getPosition().lng(), 5);
        }

      } else if (!destination){
        destination = new google.maps.Marker({
          position: mouseClick.latLng,
          map: map
        });

        let endLat = document.querySelector("#endLat").value;
        let endLng = document.querySelector("#endLng").value;
        if ((endLat == null && endLng == null)|| (endLat == "" && endLng == "")){
          document.querySelector("#endLat").value = roundTo(destination.getPosition().lat(), 5);
          document.querySelector("#endLng").value = roundTo(destination.getPosition().lng(), 5);
        }
      }
    });
  }, key);
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function fetchData(func, apiKey) { 
  let newTag, url;
  window.initMap = function() {
    func();
  }
  newTag = document.createElement("script");
  url = "https://maps.googleapis.com/maps/api/js?key=" + apiKey + "&callback=initMap&libraries=&v=weekly";
  newTag.src = url;
  document.body.appendChild(newTag);
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function renderPath() {
  let dirService = new google.maps.DirectionsService();
  let parameters = {
    'origin': start.getPosition(),
    'destination': destination.getPosition(),
    'travelMode': 'DRIVING'
  }
  dirRenderer = new google.maps.DirectionsRenderer();
  resetMarker()
  dirRenderer.setMap(map);
  dirService.route(parameters, function (result, status) {
    if (status == "OK") {
      dirRenderer.setDirections(result);
      getPathGeoCode(result.routes[0]);
    } else {
      showAlert("danger", getDirectionStatusText(status))
    }
  });
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function getPathGeoCode(route) {
  let routeLeg = route.legs[0];
  for (var i = 0; i < routeLeg.steps.length; i++) {
    let legsStep = routeLeg.steps[i];
    for (var j = 0; j < legsStep.path.length; j++){
     latLngArray.push(new google.maps.LatLng(legsStep.path[j].lat(),legsStep.path[j].lng()));
    }
  }
  getLocations();
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function getLocations() {
  let points = [];
  let endIndex = Math.min(latLngArray.length, batchSize + startIndex);
  for (let i = startIndex; i < endIndex; i++) {
    points.push(latLngArray[i]);
  }
  getElevation(points)
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function getElevation(points) {
  let parameters = {
    locations: points,
  };
  let elevaService = new google.maps.ElevationService();
  elevaService.getElevationForLocations(parameters, function (result, status) {
    if (status == "OK") {
      // console.log("adding to elevation array");
    for (let i = 0; i < result.length; i++) {
            elevationArray.push(result[i].elevation);
      }
        setTimeout(getNextLocations, 1000)
    // } else if (status == "INVALID_REQUEST") {
    //   console.log("INVALID_REQUEST")
    // } else if (status == "OVER_DAILY_LIMIT") {
    //   console.log("OVER_DAILY_LIMIT")
    // } else if (status == "OVER_QUERY_LIMIT") {
    //   console.log("OVER_QUERY_LIMIT")
    // } else if (status == "REQUEST_DENIED") {
    //   console.log("REQUEST_DENIED")
    // } else if (status == "UNKNOWN_ERROR") {
    //   console.log("UNKNOWN_ERROR")
    }
  });
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function getNextLocations() {
  startIndex += batchSize;
  if (startIndex < latLngArray.length) {
    getLocations();
    showAlert("warning", "Calculating!", 1000)
  } else {
    showAlert("success", "Done!")
  }
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function roundTo(num, place) {
  return Math.round(num * Math.pow(10, place)) / Math.pow(10, place)
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function writeCSV() {
  if ((latLngArray.length !== 0) && (elevationArray.length !== 0)) {
    let csv;
    csv = "Latitude,Longitude,Elevation (meters)\n"
    for (let i = 0; i < elevationArray.length; i++) {
      csv += roundTo(latLngArray[i].lat(), 5) + "," + roundTo(latLngArray[i].lng(), 5) + "," + roundTo(elevationArray[i], 1) + "\n";
    }
    let csvData = new Blob([csv], { type: 'text/csv' }); 
    let csvUrl = window.URL.createObjectURL(csvData); 
    let a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', csvUrl);
    a.setAttribute('download', 'data.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function showAlert(type, message, t = 3000){
  let content = '<div class="alert alert-' + type + '"' +'role="alert">' + message + '</div>';
  document.querySelector("#showAlert").innerHTML = content;
  setTimeout(removeAlert, t)
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function removeAlert() {
  document.querySelector("#showAlert").innerHTML = "";
}

//--------------------------------------------------------------------------------------------------------------------------------------------
window.onresize = function () {
  let topDivHeight = document.getElementById('googleMapPage').offsetHeight;
  let bottomDiv = document.getElementById('map');
  bottomDiv.style.top = topDivHeight + 80 + "px";
}

//--------------------------------------------------------------------------------------------------------------------------------------------
function positionMapDiv() {
  let topDivHeight = document.getElementById('googleMapPage').offsetHeight;
  let bottomDiv = document.getElementById('map');
  bottomDiv.style.top = topDivHeight + 80 + "px";
}