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
  center = { lat: 40.7128, lng: -74.006 },
  zoom = 12,
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
