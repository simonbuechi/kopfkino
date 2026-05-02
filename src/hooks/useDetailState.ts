import { useReducer } from 'react';

export type SaveStatus = 'saved' | 'saving' | 'error' | null;
type FieldValue = string | number | boolean | string[] | undefined;

export type DetailState<T> = T & { isDirty: boolean; saveStatus: SaveStatus };

export type DetailAction<T> =
    | { type: 'SET_FIELD'; field: string; value: FieldValue }
    | { type: 'SET_MULTIPLE'; payload: Partial<T> }
    | { type: 'TOGGLE_ID'; field: string; id: string }
    | { type: 'SET_STATUS'; status: SaveStatus }
    | { type: 'SAVED' }
    | { type: 'SYNC'; payload: Partial<T> }
    | { type: 'RESET' };

export function useDetailState<T extends object>(initial: T) {
    return useReducer(
        (state: DetailState<T>, action: DetailAction<T>): DetailState<T> => {
            switch (action.type) {
                case 'SET_FIELD':
                    return { ...state, [action.field]: action.value, isDirty: true, saveStatus: null };
                case 'SET_MULTIPLE':
                    return { ...state, ...action.payload, isDirty: true, saveStatus: null };
                case 'TOGGLE_ID': {
                    const arr = (state[action.field as keyof typeof state] as string[]) ?? [];
                    const next = arr.includes(action.id)
                        ? arr.filter(id => id !== action.id)
                        : [...arr, action.id];
                    return { ...state, [action.field]: next, isDirty: true, saveStatus: null };
                }
                case 'SET_STATUS':
                    return { ...state, saveStatus: action.status };
                case 'SAVED':
                    return { ...state, saveStatus: 'saved', isDirty: false };
                case 'SYNC':
                    return { ...state, ...action.payload, isDirty: false, saveStatus: null };
                case 'RESET':
                    return { ...initial, isDirty: false, saveStatus: null };
                default:
                    return state;
            }
        },
        { ...initial, isDirty: false, saveStatus: null as SaveStatus },
    );
}
