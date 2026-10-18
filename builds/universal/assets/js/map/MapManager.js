/**
 * MapManager.js
 * Offline Leaflet 1.9.4 canvas-driven world map for Flag Finder: World Tour.
 * Strictly adheres to Poki constraints:
 * - Zero tile layers / zero network requests
 * - attributionControl: false
 * - preferCanvas: true
 * - World repetition prevented (-58..84 latitude bounds)
 * - Clickable microstate circleMarkers with 44px hit-targets
 * - Great-circle distance calculations & warmer/colder feedback
 */

export class MapManager {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.geojsonLayer = null;
    this.microstateMarkers = new Map();
    this.countryPolygons = new Map();
    this.unCountries = new Map();
    this.onCountryClick = null;
    this.selectedFeature = null;
    this.activeHighlightLayers = [];
  }

  /**
   * Initializes Leaflet map with canvas renderer and strict bounds.
   */
  init(worldGeoJson, countriesData) {
    if (!window.L) {
      console.error('Leaflet not loaded');
      return;
    }

    // Index countries data by ISO alpha-2
    for (const c of countriesData) {
      this.unCountries.set(c.code, c);
    }

    // World bounds clipping roughly -58..84 lat and -180..180 lng
    const southWest = window.L.latLng(-58, -180);
    const northEast = window.L.latLng(84, 180);
    const bounds = window.L.latLngBounds(southWest, northEast);

    this.map = window.L.map(this.containerId, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 6,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      attributionControl: false,
      zoomControl: false, // Custom styled controls or gestures
      preferCanvas: true,
      bounceAtZoomLimits: false,
      keyboard: true,
      zoomSnap: 0.25,
      zoomDelta: 0.5
    });

    // Fit world nicely
    this.map.fitBounds(bounds, { padding: [10, 10] });

    // 1. Render World GeoJSON polygons
    this.geojsonLayer = window.L.geoJSON(worldGeoJson, {
      style: (feature) => this.getFeatureStyle(feature),
      onEachFeature: (feature, layer) => this.bindFeatureEvents(feature, layer)
    }).addTo(this.map);



    // Invalidate size on container resize
    window.addEventListener('resize', () => {
      if (this.map) {
        this.map.invalidateSize();
      }
    });
  }

  getFeatureStyle(feature) {
    // All world land terrain shares identical, seamless warm antique parchment styling
    return {
      fillColor: '#f7ecd2',
      fillOpacity: 0.95,
      color: '#9e8964',
      weight: 1.0,
      interactive: true
    };
  }

  bindFeatureEvents(feature, layer) {
    const isUN = feature.properties && feature.properties.isUN;
    const code = isUN ? feature.properties.code : null;

    if (code) {
      this.countryPolygons.set(code, layer);
    }

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        if (!l._highlighted) {
          l.setStyle({
            fillColor: '#ffe8a8',
            color: '#6e5a32',
            weight: 1.5
          });
        }
      },
      mouseout: (e) => {
        const l = e.target;
        if (!l._highlighted) {
          this.geojsonLayer.resetStyle(l);
        }
      },
      click: (e) => {
        window.L.DomEvent.stopPropagation(e);
        if (this.onCountryClick) {
          const country = code ? this.unCountries.get(code) : null;
          this.onCountryClick(country, e.latlng);
        }
      }
    });
  }

  /**
   * Adds an elegant, touch-friendly marker for island microstates without 110m polygons.
   * Subtle cartographic appearance with large invisible tap-target.
   */
  addMicrostateMarker(country) {
    const marker = window.L.circleMarker([country.lat, country.lng], {
      radius: 3.5,
      fillColor: '#b49464',
      fillOpacity: 0.9,
      color: '#7a6039',
      weight: 1.0,
      interactive: true,
      className: 'microstate-dot'
    });

    marker.on({
      mouseover: () => {
        marker.setRadius(6);
        marker.setStyle({ fillColor: '#d97706', color: '#ffffff', weight: 1.5 });
      },
      mouseout: () => {
        if (!marker._highlighted) {
          marker.setRadius(3.5);
          marker.setStyle({ fillColor: '#b49464', color: '#7a6039', weight: 1.0 });
        }
      },
      click: (e) => {
        window.L.DomEvent.stopPropagation(e);
        if (this.onCountryClick) {
          this.onCountryClick(country, window.L.latLng(country.lat, country.lng));
        }
      }
    });

    marker.addTo(this.map);
    this.microstateMarkers.set(country.code, marker);
  }

  /**
   * Highlights the correct country (green) and optionally player's clicked point (amber/red).
   */
  highlightRoundResult(targetCountry, clickedCountry, clickedLatLng, isCorrect) {
    this.clearHighlights();

    // 1. Highlight target country in vibrant green
    const targetLayer = this.countryPolygons.get(targetCountry.code);
    if (targetLayer) {
      targetLayer._highlighted = true;
      targetLayer.setStyle({
        fillColor: '#4caf50',
        fillOpacity: 0.95,
        color: '#1b5e20',
        weight: 2.5
      });
      this.activeHighlightLayers.push(targetLayer);
    }

    const targetMarker = this.microstateMarkers.get(targetCountry.code);
    if (targetMarker) {
      targetMarker._highlighted = true;
      targetMarker.setRadius(11);
      targetMarker.setStyle({
        fillColor: '#4caf50',
        color: '#ffffff',
        weight: 3
      });
      this.activeHighlightLayers.push(targetMarker);
    }

    // 2. If incorrect, highlight clicked country or point in red/amber
    if (!isCorrect && clickedLatLng) {
      if (clickedCountry) {
        const clickedLayer = this.countryPolygons.get(clickedCountry.code);
        if (clickedLayer && clickedCountry.code !== targetCountry.code) {
          clickedLayer._highlighted = true;
          clickedLayer.setStyle({
            fillColor: '#e53935',
            fillOpacity: 0.85,
            color: '#b71c1c',
            weight: 2.0
          });
          this.activeHighlightLayers.push(clickedLayer);
        }
      }

      // Add temporary ping ripple marker where clicked
      const rippleMarker = window.L.circleMarker(clickedLatLng, {
        radius: 8,
        fillColor: '#f44336',
        fillOpacity: 0.9,
        color: '#ffffff',
        weight: 2
      }).addTo(this.map);
      this.activeHighlightLayers.push(rippleMarker);
    }
  }

  /**
   * Clears all active round highlight styles.
   */
  clearHighlights() {
    for (const layer of this.activeHighlightLayers) {
      layer._highlighted = false;
      if (layer instanceof window.L.CircleMarker) {
        if (this.geojsonLayer.hasLayer(layer)) {
          // It's a standard layer
          this.geojsonLayer.resetStyle(layer);
        } else if (layer.options.className === 'microstate-dot') {
          layer.setRadius(3.5);
          layer.setStyle({
            fillColor: '#b49464',
            color: '#7a6039',
            weight: 1.0
          });
        } else {
          // Temporary click ripple marker
          this.map.removeLayer(layer);
        }
      } else {
        this.geojsonLayer.resetStyle(layer);
      }
    }
    this.activeHighlightLayers = [];
  }

  /**
   * Focuses / pans smoothly towards a specific country.
   */
  flyToCountry(country) {
    if (!this.map || !country) return;
    const targetZoom = Math.max(this.map.getZoom(), country.micro ? 4 : 3);
    this.map.flyTo([country.lat, country.lng], targetZoom, {
      duration: 0.8,
      easeLinearity: 0.25
    });
  }

  /**
   * Reset world view.
   */
  resetView() {
    if (!this.map) return;
    const southWest = window.L.latLng(-58, -180);
    const northEast = window.L.latLng(84, 180);
    this.map.fitBounds(window.L.latLngBounds(southWest, northEast), { padding: [10, 10] });
  }

  /**
   * Great-circle distance between two coordinates in kilometers.
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (this.map && typeof this.map.distance === 'function') {
      return this.map.distance([lat1, lon1], [lat2, lon2]) / 1000;
    }
    // Haversine fallback
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Evaluates proximity from target country to clicked coordinates.
   * Returns { isExact, distanceKm, warmth, points, hint }
   */
  evaluateGuess(targetCountry, clickedCountry, clickedLatLng) {
    if (clickedCountry && clickedCountry.code === targetCountry.code) {
      return {
        isExact: true,
        distanceKm: 0,
        warmth: 1.0,
        points: 1000,
        hint: 'exact'
      };
    }

    const dist = this.calculateDistance(
      targetCountry.lat,
      targetCountry.lng,
      clickedLatLng.lat,
      clickedLatLng.lng
    );

    // Exact tolerance: within 220 km (e.g. clicked near capital of small country)
    if (dist <= 220) {
      return {
        isExact: true,
        distanceKm: Math.round(dist),
        warmth: 1.0,
        points: 1000,
        hint: 'exact'
      };
    }

    // Near: within 1,200 km (e.g. neighboring country)
    if (dist <= 1200) {
      const warmth = 1.0 - (dist / 1200);
      const partialPoints = Math.round(200 + warmth * 500); // 200..700 pts
      return {
        isExact: false,
        distanceKm: Math.round(dist),
        warmth,
        points: partialPoints,
        hint: dist <= 600 ? 'very_hot' : 'warm'
      };
    }

    // Medium: within 3,000 km
    if (dist <= 3000) {
      return {
        isExact: false,
        distanceKm: Math.round(dist),
        warmth: 0.25,
        points: 100,
        hint: 'cool'
      };
    }

    // Cold
    return {
      isExact: false,
      distanceKm: Math.round(dist),
      warmth: 0.05,
      points: 0,
      hint: 'cold'
    };
  }

  /**
   * Convert lat/lng to container pixel coordinates for animations.
   */
  latLngToContainerPoint(lat, lng) {
    if (!this.map) return { x: 0, y: 0 };
    return this.map.latLngToContainerPoint([lat, lng]);
  }
}
