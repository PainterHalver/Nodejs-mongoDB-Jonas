import mapboxgl from "mapbox-gl";

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiY2FscHV0ZXIiLCJhIjoiY2t5a3dxbDJxMzBneTJ2bjAxOTRsNXZmayJ9.R89TGMjEtQ_TqSXA4aMx-Q";

  var map = new mapboxgl.Map({
    container: "map", // put the map on element with id of 'map'
    style: "mapbox://styles/calputer/ckymmgj5092mo14pp2w7qn5ba",
    scrollZoom: false,
    // center: [105.7852037, 21.0385921], // [long, lat]
    // zoom: 15,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Add marker
    const el = document.createElement("div");
    el.className = "marker";

    new mapboxgl.Marker({
      Element: el,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  // Nice zoom in animation
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
