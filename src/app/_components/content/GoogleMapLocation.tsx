"use client";

import React, { useState } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
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

const darkModeStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a3a3a3" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#737373" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#262626" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#525252" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2e2e2e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3d3d3d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a3a3a3" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2e2e2e" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#737373" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0d0d0d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#404040" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0d0d0d" }],
  },
];

const GoogleMapLocation: React.FC<GoogleMapProps> = ({
  center = { lat: 40.7128, lng: -74.006 },
  zoom = 10,
  markers = [],
  height = 400,
  width = "100%",
  className = "",
  mapOptions = {},
  onMapLoad,
  darkMode = true,
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: PUBLIC_GOOGLE_MAP_API_KEY!,
  });

  const [activeMarker, setActiveMarker] = useState<number | null>(null);

  if (loadError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height, width }}
      >
        <div className="text-red-500 text-center p-4">
          <p className="font-semibold">Error loading map</p>
          <p className="text-sm mt-1">Failed to load Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ height, width }}
      >
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerClassName={className}
      mapContainerStyle={{ height, width }}
      center={center}
      zoom={zoom}
      options={{
        mapTypeId: "hybrid",
        styles: darkMode ? darkModeStyles : undefined,
        ...mapOptions,
      }}
      onLoad={onMapLoad}
    >
      {markers.map((marker, index) => {
        // Build icon configuration
        let markerIcon:
          | string
          | google.maps.Icon
          | google.maps.Symbol
          | undefined;

        if (marker.customIcon) {
          markerIcon = {
            url: marker.customIcon.url,
            scaledSize: new google.maps.Size(
              marker.customIcon.scaledSize?.width || 32,
              marker.customIcon.scaledSize?.height || 32
            ),
            anchor: marker.customIcon.anchor
              ? new google.maps.Point(
                  marker.customIcon.anchor.x,
                  marker.customIcon.anchor.y
                )
              : undefined,
            origin: marker.customIcon.origin
              ? new google.maps.Point(
                  marker.customIcon.origin.x,
                  marker.customIcon.origin.y
                )
              : new google.maps.Point(0, 0),
          };
        } else if (marker.icon) {
          markerIcon = marker.icon;
        }

        return (
          <React.Fragment key={index}>
            <Marker
              position={marker.position}
              title={marker.title}
              icon={markerIcon}
              onClick={() => marker.info && setActiveMarker(index)}
            />
            {activeMarker === index && marker.info && (
              <InfoWindow
                position={marker.position}
                onCloseClick={() => setActiveMarker(null)}
              >
                <div>{marker.info}</div>
              </InfoWindow>
            )}
          </React.Fragment>
        );
      })}
    </GoogleMap>
  );
};

export default GoogleMapLocation;
