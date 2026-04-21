import { createContext } from 'react';
import type { Location, Scene, Shot, Settings, Character, Schedule, Asset, Person, Script } from '../types/types';

export interface StoreContextType {
    locations: Location[];
    scenes: Scene[];
    characters: Character[];
    schedules: Schedule[];
    assets: Asset[];
    people: Person[];
    settings: Settings;
    script: Script | null;
    addLocation: (loc: Location) => Promise<void>;
    deleteLocation: (id: string) => Promise<void>;
    replaceLocations: (locations: Location[]) => Promise<void>;
    reorderLocations: (newOrder: Location[]) => Promise<void>;
    addScene: (scene: Scene) => Promise<void>;
    deleteScene: (id: string) => Promise<void>;
    replaceScenes: (scenes: Scene[]) => Promise<void>;
    reorderScenes: (newOrder: Scene[]) => Promise<void>;
    addShotToScene: (sceneId: string, shot: Shot) => Promise<void>;
    deleteShotFromScene: (sceneId: string, shotId: string) => Promise<void>;
    updateShotInScene: (sceneId: string, shot: Shot) => Promise<void>;
    reorderShotsInScene: (sceneId: string, newShots: Shot[]) => Promise<void>;
    addCharacter: (character: Character) => Promise<void>;
    deleteCharacter: (id: string) => Promise<void>;
    updateCharacter: (character: Character) => Promise<void>;
    replaceCharacters: (characters: Character[]) => Promise<void>;
    reorderCharacters: (newOrder: Character[]) => Promise<void>;
    updateSettings: (settings: Settings) => Promise<void>;
    addSchedule: (schedule: Schedule) => Promise<void>;
    deleteSchedule: (id: string) => Promise<void>;
    updateSchedule: (schedule: Schedule) => Promise<void>;
    addAsset: (asset: Asset) => Promise<void>;
    deleteAsset: (id: string) => Promise<void>;
    updateAsset: (asset: Asset) => Promise<void>;
    reorderAssets: (newOrder: Asset[]) => Promise<void>;
    addPerson: (person: Person) => Promise<void>;
    deletePerson: (id: string) => Promise<void>;
    updatePerson: (person: Person) => Promise<void>;
    reorderPeople: (newOrder: Person[]) => Promise<void>;
    saveScript: (content: string) => Promise<void>;
    setScriptFrozen: (frozen: boolean) => Promise<void>;
}

export const StoreContext = createContext<StoreContextType | undefined>(undefined);
