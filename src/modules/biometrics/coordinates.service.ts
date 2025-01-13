import { Injectable } from "@nestjs/common";

@Injectable()
export class CoordinatesService {
    private predefinedCoordinates: { latitude: number; longitude: number }[] = [
        { latitude: 25.188737, longitude: 55.2671323 }, //DAT Opus Tower 
        { latitude: 24.499101, longitude: 54.403901 },//DATP Abu Dhabi
        { latitude: 25.1859260, longitude: 55.2761674 }, //Dubai Approvals Team Opal Tower
    ];

    validateProximity(userLatitude: number, userLongitude: number): boolean {

        const proximityThreshold = 0.08; // 0.1 degrees is approximately 11.1 km
        for (const predefinedCoord of this.predefinedCoordinates) {
            if (this.calculateHaversineDistance(userLatitude, userLongitude, predefinedCoord.latitude, predefinedCoord.longitude) <= proximityThreshold) {
                return true;
            }
        }

        return false;
    }

    private calculateHaversineDistance(lat1: number,lon1: number,lat2: number,lon2: number): number {
        const R = 6371; // Earth radius in kilometers

        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return Math.abs(distance);
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }
}