
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
    peopleIds?: string[];
    assetIds?: string[];
    shots?: Shot[];
    length?: number;
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

export type PollinationsModel = 'zimage' | 'flux' | 'klein' | 'gptimage' | 'gptimage-large' | 'wan-image' | 'qwen-image' | 'kontext';

export interface Settings {
    pollinationsModel: PollinationsModel;
    pollinationsSizeIndex: number;
    pollinationsEnhance: boolean;
    pollinationsSeed?: number;
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
    ownerId?: string;
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

export interface Act {
    id: string;
    projectId: string;
    name: string;
    description: string;
    order: number;
}

export interface Beat {
    id: string;
    projectId: string;
    actId: string;
    name: string;
    description: string;
    order: number;
    sceneRefs?: string[];
}

export interface ScriptRevision {
    id: string;
    projectId: string;
    name: string;
    content: string;
    createdAt: number;
}

