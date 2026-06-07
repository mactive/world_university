import maplibregl, { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";
import type { University } from "../types";

interface Props {
  universities: University[];
  selected?: University;
  onSelect: (university: University) => void;
}

export function UniversityMap({ universities, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const universitiesRef = useRef(universities);
  const onSelectRef = useRef(onSelect);

  universitiesRef.current = universities;
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [13, 27],
      zoom: 1.35,
      minZoom: 1,
      maxZoom: 16,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: "UniScope" }),
      "bottom-left",
    );

    map.on("load", () => {
      map.addSource("universities", {
        type: "geojson",
        data: toGeoJson(universitiesRef.current),
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 48,
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "universities",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#153f34",
          "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 50, 32],
          "circle-stroke-width": 5,
          "circle-stroke-color": "rgba(211, 239, 145, .42)",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "universities",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 13,
        },
        paint: { "text-color": "#f7f5ed" },
      });
      map.addLayer({
        id: "university-points",
        type: "circle",
        source: "universities",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "countryCode"],
            "US",
            "#d56846",
            "CA",
            "#768dcb",
            "UK",
            "#8c6cb1",
            "AU",
            "#d3a24f",
            "SG",
            "#3d9d85",
            "HK",
            "#c65a78",
            "#153f34",
          ],
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 6, 6, 10],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fffdf4",
        },
      });

      map.on("click", "clusters", async (event) => {
        const features = map.queryRenderedFeatures(event.point, { layers: ["clusters"] });
        const feature = features[0];
        const clusterId = Number(feature?.properties?.cluster_id);
        const source = map.getSource("universities") as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center: coordinates, zoom });
      });

      map.on("click", "university-points", (event) => {
        const id = String(event.features?.[0]?.properties?.id ?? "");
        const university = universitiesRef.current.find((item) => item.id === id);
        if (university) onSelectRef.current(university);
      });

      for (const layer of ["clusters", "university-points"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource("universities") as GeoJSONSource | undefined;
    source?.setData(toGeoJson(universities));
  }, [universities]);

  useEffect(() => {
    if (!selected || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(mapRef.current.getZoom(), 7),
      duration: 900,
      essential: true,
    });
  }, [selected]);

  return <div className="map-canvas" ref={containerRef} />;
}

function toGeoJson(universities: University[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: universities.map((university) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [university.longitude, university.latitude],
      },
      properties: {
        id: university.id,
        countryCode: university.countryCode,
        rank: university.qsRank ?? 999,
      },
    })),
  };
}
