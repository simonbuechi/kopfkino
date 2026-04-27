import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LineType =
    | 'title'
    | 'title-page'
    | 'scene-heading'
    | 'character'
    | 'dialogue'
    | 'parenthetical'
    | 'transition'
    | 'centered'
    | 'section'
    | 'synopsis'
    | 'note'
    | 'action'
    | 'blank';

export interface Token {
    type: LineType;
    text: string;
    level?: number;
}

// ---------------------------------------------------------------------------
// Regexes
// ---------------------------------------------------------------------------

export const SCENE_RE = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.|EST\.)\s/i;
export const TRANSITION_RE = /^[A-Z\s]+TO:$/;
export const CHARACTER_RE = /^[A-Z@][A-Z\s\-'.()@^]*$/;
export const SECTION_RE = /^(#{1,3})\s+(.+)$/;
export const SYNOPSIS_RE = /^=\s+(.+)$/;
export const NOTE_RE = /^\[\[(.+)\]\]$/;
export const CENTERED_RE = /^>(.+)<$/;

// ---------------------------------------------------------------------------
// Colors — one canonical set used by both editor and renderer
// ---------------------------------------------------------------------------

export const LINE_CLASS: Record<LineType, string> = {
    'title': 'text-primary-500 dark:text-primary-400',
    'title-page': 'text-primary-600 dark:text-primary-300 font-semibold',
    'scene-heading': 'text-violet-600 dark:text-violet-400 font-bold',
    'character': 'text-rose-600 dark:text-rose-400 font-bold',
    'dialogue': 'text-primary-900 dark:text-primary-100',
    'parenthetical': 'text-primary-500 dark:text-primary-400 italic',
    'transition': 'text-violet-600 dark:text-violet-400 font-bold',
    'centered': 'text-primary-700 dark:text-primary-300',
    'section': 'text-fuchsia-600 dark:text-fuchsia-400 font-bold',
    'synopsis': 'text-primary-400 dark:text-primary-500 italic',
    'note': 'text-primary-400 dark:text-primary-600 italic',
    'action': 'text-primary-800 dark:text-primary-200',
    'blank': '',
};

export const LINE_INDENT: Partial<Record<LineType, { paddingLeft?: string; paddingRight?: string; textAlign?: string }>> = {
    character: { paddingLeft: '20ch' },
    dialogue: { paddingLeft: '10ch', paddingRight: '10ch' },
    parenthetical: { paddingLeft: '15ch', paddingRight: '15ch' },
    transition: { textAlign: 'right' },
    centered: { textAlign: 'center' },
};

// ---------------------------------------------------------------------------
// classifyLines — returns a LineType per input line (used by the editor)
// ---------------------------------------------------------------------------

export function classifyLines(text: string): LineType[] {
    const lines = text.split('\n');
    const types: LineType[] = [];

    let titleEnd = 0;
    for (let i = 0; i < lines.length; i++) {
        if (/^[A-Za-z][A-Za-z ]*:/.test(lines[i])) {
            titleEnd = i + 1;
        } else if (lines[i].trim() === '' && titleEnd > 0) {
            titleEnd = i + 1;
        } else {
            break;
        }
    }

    let inDialogue = false;

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();

        if (i < titleEnd && /^[A-Za-z][A-Za-z ]*:/.test(trimmed)) {
            types.push('title');
            continue;
        }

        if (trimmed === '') {
            types.push('blank');
            inDialogue = false;
            continue;
        }

        if (SCENE_RE.test(trimmed) || (trimmed.startsWith('.') && !trimmed.startsWith('..'))) {
            types.push('scene-heading');
            inDialogue = false;
            continue;
        }

        if (trimmed.startsWith('>') && trimmed.endsWith('<')) {
            types.push('centered');
            continue;
        }

        if (trimmed.startsWith('>') || TRANSITION_RE.test(trimmed)) {
            types.push('transition');
            inDialogue = false;
            continue;
        }

        if (trimmed.startsWith('#')) {
            types.push('section');
            continue;
        }

        if (trimmed.startsWith('= ')) {
            types.push('synopsis');
            continue;
        }

        if (/^\[\[.+\]\]$/.test(trimmed)) {
            types.push('note');
            continue;
        }

        if (inDialogue && trimmed.startsWith('(') && trimmed.endsWith(')')) {
            types.push('parenthetical');
            continue;
        }

        if (trimmed.startsWith('!')) {
            types.push('action');
            inDialogue = false;
            continue;
        }

        const prev = types[types.length - 1];
        const isAfterBlank = !prev || prev === 'blank' || prev === 'title';
        const nextTrimmed = lines[i + 1]?.trim();
        const hasFollow = nextTrimmed !== undefined && nextTrimmed !== '';

        if (isAfterBlank && hasFollow && CHARACTER_RE.test(trimmed)) {
            types.push('character');
            inDialogue = true;
            continue;
        }

        if (inDialogue) {
            types.push('dialogue');
            continue;
        }

        types.push('action');
    }

    return types;
}

// ---------------------------------------------------------------------------
// tokenize — collapses lines into Token objects with text (used by renderer)
// ---------------------------------------------------------------------------

export function tokenize(text: string): Token[] {
    const lines = text.split('\n');
    const tokens: Token[] = [];

    let i = 0;
    const titleLines: string[] = [];
    let inTitlePage = true;

    while (i < lines.length && inTitlePage) {
        const line = lines[i];
        if (/^[A-Za-z ]+:/.test(line)) {
            titleLines.push(line);
            i++;
        } else if (line.trim() === '' && titleLines.length > 0) {
            titleLines.push(line);
            i++;
            const next = lines[i];
            if (!next || !/^[A-Za-z ]+:/.test(next)) inTitlePage = false;
        } else {
            inTitlePage = false;
        }
    }

    if (titleLines.length > 0) {
        tokens.push({ type: 'title-page', text: titleLines.filter(l => l.trim()).join('\n') });
    }

    let inDialogue = false;

    while (i < lines.length) {
        const raw = lines[i];
        const line = raw.trim();

        if (line === '') {
            tokens.push({ type: 'blank', text: '' });
            inDialogue = false;
            i++;
            continue;
        }

        if (line.startsWith('.') && !line.startsWith('..')) {
            tokens.push({ type: 'scene-heading', text: line.slice(1).trim() });
            inDialogue = false;
            i++;
            continue;
        }

        if (SCENE_RE.test(line)) {
            tokens.push({ type: 'scene-heading', text: line });
            inDialogue = false;
            i++;
            continue;
        }

        if (line.startsWith('>') && !line.endsWith('<')) {
            tokens.push({ type: 'transition', text: line.slice(1).trim() });
            inDialogue = false;
            i++;
            continue;
        }

        if (CENTERED_RE.test(line)) {
            const match = line.match(CENTERED_RE)!;
            tokens.push({ type: 'centered', text: match[1].trim() });
            inDialogue = false;
            i++;
            continue;
        }

        if (TRANSITION_RE.test(line)) {
            tokens.push({ type: 'transition', text: line });
            inDialogue = false;
            i++;
            continue;
        }

        if (NOTE_RE.test(line)) {
            const match = line.match(NOTE_RE)!;
            tokens.push({ type: 'note', text: match[1] });
            i++;
            continue;
        }

        const sectionMatch = line.match(SECTION_RE);
        if (sectionMatch) {
            tokens.push({ type: 'section', text: sectionMatch[2], level: sectionMatch[1].length });
            inDialogue = false;
            i++;
            continue;
        }

        const synopsisMatch = line.match(SYNOPSIS_RE);
        if (synopsisMatch) {
            tokens.push({ type: 'synopsis', text: synopsisMatch[1] });
            i++;
            continue;
        }

        if (inDialogue && line.startsWith('(') && line.endsWith(')')) {
            tokens.push({ type: 'parenthetical', text: line });
            i++;
            continue;
        }

        if (line.startsWith('!')) {
            tokens.push({ type: 'action', text: line.slice(1) });
            inDialogue = false;
            i++;
            continue;
        }

        const prevToken = tokens[tokens.length - 1];
        const nextLine = lines[i + 1]?.trim();
        const isAfterBlank = !prevToken || prevToken.type === 'blank' || prevToken.type === 'title-page';
        const hasDialogueFollow = nextLine !== undefined && nextLine !== '';
        const isForced = line.startsWith('@');
        const charLine = isForced ? line.slice(1).trim() : line;

        if (isAfterBlank && hasDialogueFollow && (isForced || CHARACTER_RE.test(charLine))) {
            tokens.push({ type: 'character', text: charLine });
            inDialogue = true;
            i++;
            continue;
        }

        if (inDialogue) {
            tokens.push({ type: 'dialogue', text: line });
            i++;
            continue;
        }

        tokens.push({ type: 'action', text: line });
        i++;
    }

    return tokens;
}

// ---------------------------------------------------------------------------
// renderInline — bold/italic/underline/note inline markup
// ---------------------------------------------------------------------------

export function renderInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const re = /(\*{3}(.+?)\*{3}|\*{2}(.+?)\*{2}|\*(.+?)\*|_(.+?)_|\[\[(.+?)\]\])/g;
    let lastIndex = 0;
    let key = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(text)) !== null) {
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        if (match[2]) parts.push(<strong key={key++}><em>{match[2]}</em></strong>);
        else if (match[3]) parts.push(<strong key={key++}>{match[3]}</strong>);
        else if (match[4]) parts.push(<em key={key++}>{match[4]}</em>);
        else if (match[5]) parts.push(<span key={key++} className="underline">{match[5]}</span>);
        else if (match[6]) parts.push(<span key={key++} className="text-primary-400 dark:text-primary-500 text-xs">[{match[6]}]</span>);
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}
