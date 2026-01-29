'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ActivityMapProps {
    geoJson: any; // GeoJSON object
}

export default function ActivityMap({ geoJson }: ActivityMapProps) {
    if (!geoJson) return <div className="h-full w-full bg-gray-100 flex items-center justify-center">No Map Data</div>;

    // Extract coordinates from GeoJSON LineString
    // @ts-ignore
    const feature = geoJson.features?.find((f: any) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString');
    if (!feature) return <div className="h-full w-full bg-gray-100 flex items-center justify-center">Invalid Map Data</div>;

    // Leaflet expects [lat, lng], GeoJSON is [lng, lat]
    const positions = feature.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]) as [number, number][];

    if (positions.length === 0) return null;

    // Calculate bounds safely
    const bounds = L.latLngBounds(positions);

    return (
        <MapContainer bounds={bounds} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={positions} color="blue" weight={5} />
            <Marker position={positions[0]}>
                <Popup>Start</Popup>
            </Marker>
            <Marker position={positions[positions.length - 1]}>
                <Popup>End</Popup>
            </Marker>
        </MapContainer>
    );
}
