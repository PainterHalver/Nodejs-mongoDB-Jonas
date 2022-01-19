const locations = JSON.parse(document.getElementById("map").dataset.locations);

console.log(locations);
// BUGGING

mapboxgl.accessToken =
  "pk.eyJ1IjoiY2FscHV0ZXIiLCJhIjoiY2t5a3dxbDJxMzBneTJ2bjAxOTRsNXZmayJ9.R89TGMjEtQ_TqSXA4aMx-Q";

var map = new mapboxgl.Map({
  container: "map", // put the map on element with id of 'map'
  style: "mapbox://styles/mapbox/streets-v11",
});
