
export interface Location {
    id: string;
    name: string;
    description: string;
    geolocation?: string;
    comment?: string;
    thumbnailUrl?: string;
    images?: string[];
}

export interface Scene {
    id: string;
    number: string;
    name: string;
    description: string;
    comment?: string;
    locationId: string;
}

export interface Shot {
    id: string;
    sceneId: string;
    number: string;
    name: string;
    description: string;
    visualizationUrl?: string;
}

export type AspectRatio = '1:1' | '16:9';

export interface Settings {
    aspectRatio: AspectRatio;
    useRandomSeed: boolean;
    customSeed?: number;
}
