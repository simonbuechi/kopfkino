
export interface Location {
    id: string;
    projectId: string;
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
    projectId: string;
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
    projectId?: string; // Optional for compatibility with embedded shots
    number?: string;
    name: string;
    description: string;
    visualizationUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    length?: number;
    audio?: boolean;
    notes?: string;
}

export type AspectRatio = '1:1' | '16:9';

export interface Settings {
    aspectRatio: AspectRatio;
    useRandomSeed: boolean;
    customSeed?: number;
    aiApiKey?: string;
}

export type CharacterType = 'main' | 'supporting' | 'background' | 'special';

export interface Character {
    id: string;
    projectId: string;
    name: string;
    description: string;
    comment?: string;
    imageUrl?: string;
    type?: CharacterType;
    order?: number;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
    url?: string;
}

