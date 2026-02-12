
export interface Location {
    id: string;
    name: string;
    description: string;
    geolocation?: string;
    comment?: string;
    thumbnailUrl?: string;
    images?: string[];
    order?: number;
}

export interface Scene {
    id: string;
    number: string;
    name: string;
    description: string;
    comment?: string;
    locationId: string;
    characters?: string[];
    shots?: Shot[];
    order?: number;
}

export interface Shot {
    id: string;
    number?: string;
    name: string;
    description: string;
    visualizationUrl?: string;
    imageUrl?: string;
}

export type AspectRatio = '1:1' | '16:9';

export interface Settings {
    aspectRatio: AspectRatio;
    useRandomSeed: boolean;
    customSeed?: number;
}

export interface Character {
    id: string;
    name: string;
    description: string;
    comment?: string;
    imageUrl?: string;
    order?: number;
}
