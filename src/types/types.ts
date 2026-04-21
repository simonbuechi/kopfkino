
export type LocationType = 'INT.' | 'EXT.' | 'INT./EXT.';

export interface Location {
    id: string;
    projectId: string;
    name: string;
    description: string;
    geolocation?: string;
    comment?: string;
    thumbnailUrl?: string;
    images?: string[];
    type?: LocationType;
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

export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface ProjectMember {
    role: ProjectRole;
    email: string;
    displayName: string;
    addedAt: number;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
    url?: string;
    ownerId: string;
    members: Record<string, ProjectMember>;
}

export interface ProjectRef {
    projectId: string;
    role: ProjectRole;
}

export interface Invitation {
    id: string;
    email: string;
    projectId: string;
    role: ProjectRole;
    invitedBy: string;
    createdAt: number;
    status: 'pending' | 'accepted';
}

export type ScheduleItemType = 'shot' | 'special';
export type SpecialItemType = 'break' | 'lunch' | 'set up' | 'call time' | 'wrap out' | 'other';

export interface ScheduleItem {
    id: string;
    time: string;
    duration: number; // in minutes
    notes?: string;
    type: ScheduleItemType;
    shotId?: string; // if type === 'shot'
    specialType?: SpecialItemType; // if type === 'special'
}

export interface Schedule {
    id: string;
    projectId: string;
    date: string;
    name: string;
    notes?: string;
    items: ScheduleItem[];
    createdAt: number;
    updatedAt: number;
}

export type AssetType = 'Equipment' | 'Props' | 'Expendables' | 'Other';

export interface Asset {
    id: string;
    projectId: string;
    name: string;
    description: string;
    type: AssetType;
    owner: string;
    comment?: string;
    imageUrl?: string;
    order?: number;
}

export type PersonType = 'Actor' | 'Crew' | 'Other';

export interface Person {
    id: string;
    projectId: string;
    name: string;
    description: string;
    type: PersonType;
    role: string;
    phone: string;
    email: string;
    comment?: string;
    imageUrl?: string;
    order?: number;
}

export interface Script {
    projectId: string;
    content: string;
    updatedAt: number;
    frozen?: boolean;
}

