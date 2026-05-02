const EARTH_RADIUS_METERS = 6_371_000;
const MAX_LATITUDE = 90;
const MIN_LATITUDE = -90;
const MAX_LONGITUDE = 180;
const MIN_LONGITUDE = -180;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function isValidCoordinates(coordinates: Coordinates): boolean {
  return (
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.latitude >= MIN_LATITUDE &&
    coordinates.latitude <= MAX_LATITUDE &&
    coordinates.longitude >= MIN_LONGITUDE &&
    coordinates.longitude <= MAX_LONGITUDE
  );
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceMeters(
  origin: Coordinates,
  destination: Coordinates,
): number {
  if (!isValidCoordinates(origin) || !isValidCoordinates(destination)) {
    throw new RangeError('Coordinates must be finite and inside WGS84 bounds.');
  }

  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const haversineValue =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return Math.round(EARTH_RADIUS_METERS * angularDistance);
}

export function isWithinRadius(
  coordinates: Coordinates,
  center: Coordinates,
  radiusMeters: number,
): boolean {
  return distanceMeters(coordinates, center) <= radiusMeters;
}
