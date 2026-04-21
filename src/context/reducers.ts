import type { Location, Scene, Character, Schedule, Asset, Person, Settings, Project, Script } from '../types/types';

// ---------------------------------------------------------------------------
// Store reducer
// ---------------------------------------------------------------------------

export type StoreState = {
    locations: Location[];
    scenes: Scene[];
    characters: Character[];
    schedules: Schedule[];
    assets: Asset[];
    people: Person[];
    settings: Settings;
    script: Script | null;
};

export type StoreAction =
    | { type: 'SET_LOCATIONS'; payload: Location[] }
    | { type: 'SET_SCENES'; payload: Scene[] }
    | { type: 'SET_CHARACTERS'; payload: Character[] }
    | { type: 'SET_SCHEDULES'; payload: Schedule[] }
    | { type: 'SET_ASSETS'; payload: Asset[] }
    | { type: 'SET_PEOPLE'; payload: Person[] }
    | { type: 'SET_SETTINGS'; payload: Settings }
    | { type: 'SET_SCRIPT'; payload: Script | null }
    | { type: 'RESET' };

export const DEFAULT_SETTINGS: Settings = {
    aspectRatio: '16:9',
    useRandomSeed: true,
};

export const storeInitialState: StoreState = {
    locations: [],
    scenes: [],
    characters: [],
    schedules: [],
    assets: [],
    people: [],
    settings: DEFAULT_SETTINGS,
    script: null,
};

export function storeReducer(state: StoreState, action: StoreAction): StoreState {
    switch (action.type) {
        case 'SET_LOCATIONS': return { ...state, locations: action.payload };
        case 'SET_SCENES': return { ...state, scenes: action.payload };
        case 'SET_CHARACTERS': return { ...state, characters: action.payload };
        case 'SET_SCHEDULES': return { ...state, schedules: action.payload };
        case 'SET_ASSETS': return { ...state, assets: action.payload };
        case 'SET_PEOPLE': return { ...state, people: action.payload };
        case 'SET_SETTINGS': return { ...state, settings: action.payload };
        case 'SET_SCRIPT': return { ...state, script: action.payload };
        case 'RESET': return storeInitialState;
        default: return state;
    }
}

// ---------------------------------------------------------------------------
// Project reducer
// ---------------------------------------------------------------------------

export type ProjectState = {
    projects: Project[];
    activeProjectId: string | null;
    loading: boolean;
};

export type ProjectAction =
    | { type: 'SET_DATA'; payload: Partial<ProjectState> }
    | { type: 'RESET' };

export const projectInitialState: ProjectState = {
    projects: [],
    activeProjectId: null,
    loading: true,
};

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
    switch (action.type) {
        case 'SET_DATA':
            return { ...state, ...action.payload };
        case 'RESET':
            return { projects: [], activeProjectId: null, loading: false };
        default:
            return state;
    }
}
