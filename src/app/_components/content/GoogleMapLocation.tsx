"use client";

import React, { useEffect, useRef, useState } from "react";
import { PUBLIC_GOOGLE_MAP_API_KEY } from "@/lib/services/env/public";

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    info?: string;
    icon?: string | google.maps.Icon | google.maps.Symbol;
    customIcon?: {
      url: string;
      scaledSize?: { width: number; height: number };
      anchor?: { x: number; y: number };
      origin?: { x: number; y: number };
    };
  }>;
  height?: string | number;
  width?: string | number;
  className?: string;
  mapOptions?: google.maps.MapOptions;
  onMapLoad?: (map: google.maps.Map) => void;
  darkMode?: boolean;
}

// Dark mode styles
const darkModeStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const GoogleMapLocation: React.FC<GoogleMapProps> = ({
  center = { lat: 40.7128, lng: -74.006 }, // Default to NYC
  zoom = 12,
  markers = [],
  height = 400,
  width = "100%",
  className = "",
  mapOptions = {},
  onMapLoad,
  darkMode = true,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string>("");

  const apiKey = PUBLIC_GOOGLE_MAP_API_KEY;

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key is required");
      return;
    }

    // Check if script already exists
    const existingScript = document.getElementById("google-maps-script");

    if (existingScript) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError("Failed to load Google Maps");
    };

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById("google-maps-script");
      if (scriptToRemove && !document.querySelector("[data-google-map]")) {
        scriptToRemove.remove();
      }
    };
  }, [apiKey]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      const googleMap = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: darkMode ? darkModeStyles : undefined,
        ...mapOptions,
      });

      setMap(googleMap);

      if (onMapLoad) {
        onMapLoad(googleMap);
      }
    } catch (err) {
      setError("Failed to initialize map");
      console.error("Google Maps initialization error:", err);
    }
  }, [isLoaded, center, zoom, mapOptions, onMapLoad, map, darkMode]);

  // Add markers
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    const markersArray: google.maps.Marker[] = [];

    markers.forEach(markerData => {
      // Build icon configuration
      let markerIcon:
        | string
        | google.maps.Icon
        | google.maps.Symbol
        | undefined;

      if (markerData.customIcon) {
        markerIcon = {
          url: markerData.customIcon.url,
          scaledSize: markerData.customIcon.scaledSize
            ? new google.maps.Size(
                markerData.customIcon.scaledSize.width,
                markerData.customIcon.scaledSize.height
              )
            : new google.maps.Size(32, 32), // Default size
          anchor: markerData.customIcon.anchor
            ? new google.maps.Point(
                markerData.customIcon.anchor.x,
                markerData.customIcon.anchor.y
              )
            : undefined,
          origin: markerData.customIcon.origin
            ? new google.maps.Point(
                markerData.customIcon.origin.x,
                markerData.customIcon.origin.y
              )
            : new google.maps.Point(0, 0),
        };
      } else if (markerData.icon) {
        markerIcon = markerData.icon;
      }

      const marker = new google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        icon: markerIcon,
      });

      // Add info window if info is provided
      if (markerData.info) {
        const infoWindow = new google.maps.InfoWindow({
          content: markerData.info,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      }

      markersArray.push(marker);
    });

    // Cleanup markers on unmount or update
    return () => {
      markersArray.forEach(marker => marker.setMap(null));
    };
  }, [map, markers]);

  // Update center when prop changes
  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  // Update zoom when prop changes
  useEffect(() => {
    if (map && zoom) {
      map.setZoom(zoom);
    }
  }, [map, zoom]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height, width }}
      >
        <div className="text-red-500 text-center p-4">
          <p className="font-semibold">Error loading map</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      data-google-map
      className={className}
      style={{ height, width }}
    />
  );
};

export default GoogleMapLocation;
