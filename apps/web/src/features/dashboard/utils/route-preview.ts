type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

function buildRoutePreviewPath(coordinates: RouteCoordinate[] | undefined) {
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  const sampleEvery = Math.max(1, Math.floor(coordinates.length / 24));
  const sampled = coordinates.filter((_, index) => index % sampleEvery === 0);
  const latitudes = sampled.map((point) => point.latitude);
  const longitudes = sampled.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudeRange = maxLatitude - minLatitude || 1;
  const longitudeRange = maxLongitude - minLongitude || 1;

  return sampled
    .map((point, index) => {
      const x = 8 + ((point.longitude - minLongitude) / longitudeRange) * 72;
      const y = 8 + (1 - (point.latitude - minLatitude) / latitudeRange) * 48;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export { buildRoutePreviewPath };
