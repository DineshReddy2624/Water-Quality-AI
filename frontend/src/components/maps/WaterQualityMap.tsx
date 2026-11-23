import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { WaterLocation, WaterSample } from '../../types';

interface WaterQualityMapProps {
  locations: WaterLocation[];
  samples?: WaterSample[];
  selectedLocation?: string | null;
  onSelectLocation?: (locationName: string) => void;
  height?: string;
}

export const WaterQualityMap: React.FC<WaterQualityMapProps> = ({
  locations,
  samples = [],
  selectedLocation,
  onSelectLocation,
  height = '480px'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to center on India
      const defaultCenter: [number, number] = [20.5937, 78.9629];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 5,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();
    const latLngs: [number, number][] = [];

    locations.forEach((loc) => {
      if (loc.latitude && loc.longitude) {
        latLngs.push([loc.latitude, loc.longitude]);

        // Find samples from this location to determine severity status
        const locSamples = samples.filter(s => s.location_name === loc.location_name || s.water_source_name === loc.name);
        const hasContamination = locSamples.some(s => s.analysis?.predicted_category === 'Potentially Contaminated');
        const hasPoor = locSamples.some(s => s.analysis?.predicted_category === 'Poor Quality');
        const hasAnomalies = loc.abnormal_count > 0 || loc.has_repeated_abnormal;

        const markerColor = hasContamination ? '#EF4444' : (hasPoor || hasAnomalies ? '#F59E0B' : '#10B981');
        const pulseEffect = (hasContamination || loc.has_repeated_abnormal) ? 'animate-pulse' : '';

        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px;" class="${pulseEffect}">
              ${loc.sample_count}
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon });

        const popupContent = `
          <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 4px; min-width: 180px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px; color: #0F172A;">${loc.name}</div>
            <div style="color: #64748B; margin-bottom: 6px;">${loc.location_name} &bull; <span style="text-transform: capitalize;">${loc.water_type}</span></div>
            <div style="background: #F1F5F9; padding: 6px; border-radius: 6px; margin-bottom: 8px;">
              <div><b>Samples Monitored:</b> ${loc.sample_count}</div>
              <div><b>Abnormal Detections:</b> <span style="color: ${loc.abnormal_count > 0 ? '#DC2626' : '#16A34A'}; font-weight: 600;">${loc.abnormal_count}</span></div>
              ${loc.has_repeated_abnormal ? '<div style="color: #DC2626; font-weight: 600; margin-top: 2px;">⚠️ Repeated Abnormal Readings</div>' : ''}
            </div>
            ${loc.description ? `<p style="margin: 0; color: #475569; font-style: italic;">${loc.description}</p>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectLocation) {
            onSelectLocation(loc.location_name);
          }
        });

        markersRef.current?.addLayer(marker);
      }
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [locations, samples, onSelectLocation]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <div ref={mapContainerRef} style={{ height }} />
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] space-y-1 shadow-md">
        <div className="font-semibold text-slate-700 dark:text-slate-300">Station Quality Status</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Good / Baseline</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Moderate / Review</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <span>High Severity / Anomaly</span>
        </div>
      </div>
    </div>
  );
};
