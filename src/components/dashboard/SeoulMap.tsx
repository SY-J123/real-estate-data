"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { Layer } from "leaflet";
import { MAP_CENTER, MAP_ZOOM, CHANGE_RATE_COLORS } from "@/constants";
import type { DistrictData, MetricType } from "@/types";
import { getChangeRate } from "@/types";
import "leaflet/dist/leaflet.css";

interface SeoulMapProps {
  districtData: DistrictData[];
  metric: MetricType;
}

export default function SeoulMap({ districtData, metric }: SeoulMapProps) {
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/seoul-districts.geojson")
      .then((res) => res.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  const getChangeColor = (changeRate: number): string => {
    if (changeRate > 5) return "#dc2626";
    if (changeRate > 2) return "#f87171";
    if (changeRate > 0) return "#fca5a5";
    if (changeRate > -2) return "#93c5fd";
    if (changeRate > -5) return "#60a5fa";
    return "#2563eb";
  };

  const getRatioColor = (ratio: number): string => {
    if (ratio >= 70) return "#7c3aed";
    if (ratio >= 60) return "#8b5cf6";
    if (ratio >= 55) return "#a78bfa";
    if (ratio >= 50) return "#c4b5fd";
    if (ratio >= 45) return "#ddd6fe";
    return "#ede9fe";
  };

  const isRatio = metric === "jeonseRatio";

  const style = (feature: GeoJSON.Feature | undefined) => {
    const name = feature?.properties?.name ?? "";
    const district = districtData.find((d) => d.gu === name);
    const rate = district ? getChangeRate(district, metric) : 0;

    return {
      fillColor: isRatio ? getRatioColor(rate) : getChangeColor(rate),
      weight: 1,
      opacity: 1,
      color: "#fff",
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: Layer) => {
    const name = feature.properties?.name ?? "";
    const district = districtData.find((d) => d.gu === name);

    if (district) {
      const districtRate = getChangeRate(district, metric);
      const label = isRatio
        ? `전세가율 ${districtRate.toFixed(1)}%`
        : `${districtRate > 0 ? "+" : ""}${districtRate.toFixed(1)}%`;

      layer.bindTooltip(
        `<strong>${name}</strong> ${label}`,
        { sticky: true }
      );
    }
  };

  if (!geoData) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-zinc-200 bg-white">
        <span className="text-sm text-zinc-400">지도 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="h-[500px] w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON data={geoData} style={style} onEachFeature={onEachFeature} />
      </MapContainer>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-2 border-t border-zinc-200 bg-white px-4 py-2">
        {isRatio ? (
          <>
            <span className="text-xs text-zinc-500">낮음</span>
            {["#ede9fe", "#ddd6fe", "#c4b5fd", "#a78bfa", "#8b5cf6", "#7c3aed"].map(
              (color) => (
                <div key={color} className="h-4 w-8 rounded" style={{ backgroundColor: color }} />
              )
            )}
            <span className="text-xs text-zinc-500">높음</span>
          </>
        ) : (
          <>
            <span className="text-xs text-zinc-500">하락</span>
            {["#2563eb", "#60a5fa", "#93c5fd", "#fca5a5", "#f87171", "#dc2626"].map(
              (color) => (
                <div key={color} className="h-4 w-8 rounded" style={{ backgroundColor: color }} />
              )
            )}
            <span className="text-xs text-zinc-500">상승</span>
          </>
        )}
      </div>
    </div>
  );
}
