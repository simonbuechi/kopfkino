import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import jsPDF from 'jspdf';
import { useStore } from '../../hooks/useStore';
import { useProjects } from '../../hooks/useProjects';
import { useDebounce } from '../../hooks/useDebounce';
import { Link } from 'react-router-dom';
import { FileText, Lock, Unlock, User, MapPin, Clapperboard, ChevronDown, ChevronRight, Code, BookOpen, Info, X, CheckCircle, AlertCircle, Download, BarChart2 } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { Button } from '../../components/ui/Button';
import type { Character, Location } from '../../types/types';

const AUTOSAVE_DELAY = 1500;

type LineType = 'title' | 'scene-heading' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'centered' | 'section' | 'synopsis' | 'note' | 'action' | 'blank';

const SCENE_RE = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.|EST\.)\s/i;
const TRANSITION_RE = /^[A-Z\s]+TO:$/;
const CHAR_RE = /^[A-Z@][A-Z\s\-'.()@^]*$/;

// Classifies each line of a Fountain-format screenplay into a LineType.
// Rules applied in priority order: title page block → blank → scene heading
// (INT./EXT. prefix or leading dot) → centered (>…<) → transition → section (#)
// → synopsis (= ) → note ([[…]]) → parenthetical → forced action (!) →
// character (ALL CAPS after blank, followed by non-blank) → dialogue
// (continuation inside dialogue block) → action (default).
function classifyLines(text: string): LineType[] {
    const lines = text.split('\n');
    const types: LineType[] = [];

    // Detect title page block at the top
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

        if (isAfterBlank && hasFollow && CHAR_RE.test(trimmed)) {
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

const LINE_CLASS: Record<LineType, string> = {
    'title':         'text-primary-500 dark:text-primary-400',
    'scene-heading': 'text-amber-600 dark:text-amber-400 font-bold',
    'character':     'text-blue-600 dark:text-blue-400 font-bold',
    'dialogue':      'text-primary-900 dark:text-primary-100',
    'parenthetical': 'text-primary-500 dark:text-primary-400 italic',
    'transition':    'text-violet-600 dark:text-violet-400 font-bold',
    'centered':      'text-primary-700 dark:text-primary-300',
    'section':       'text-fuchsia-600 dark:text-fuchsia-400 font-bold',
    'synopsis':      'text-primary-400 dark:text-primary-500 italic',
    'note':          'text-primary-400 dark:text-primary-600 italic',
    'action':        'text-primary-800 dark:text-primary-200',
    'blank':         '',
};

const LINE_INDENT: Partial<Record<LineType, { paddingLeft?: string; paddingRight?: string; textAlign?: string }>> = {
    character:     { paddingLeft: '20ch' },
    dialogue:      { paddingLeft: '10ch', paddingRight: '10ch' },
    parenthetical: { paddingLeft: '15ch', paddingRight: '15ch' },
    transition:    { textAlign: 'right' },
    centered:      { textAlign: 'center' },
};

// ---------------------------------------------------------------------------
// PDF / Print export
// ---------------------------------------------------------------------------

function cleanLine(raw: string, type: LineType): string {
    const t = raw.trim();
    switch (type) {
        case 'scene-heading': return t.startsWith('.')  ? t.slice(1).trim() : t;
        case 'transition':    return t.startsWith('>')  ? t.slice(1).trim() : t;
        case 'character':     return t.startsWith('@')  ? t.slice(1).trim() : t;
        case 'action':        return t.startsWith('!')  ? t.slice(1).trim() : t;
        case 'centered':      return t.replace(/^>\s*/, '').replace(/\s*<$/, '');
        case 'synopsis':      return t.replace(/^=\s+/, '');
        case 'section':       return t.replace(/^#+\s*/, '');
        default:              return raw;
    }
}

function generateScreenplayPdf(text: string, title: string): jsPDF {
    // Page geometry (points; 72 pt = 1 inch)
    // WGA/industry standard: left 1.5in (binding), all others 1in
    const PW = 612, PH = 792;
    const ML = 108, MR = 72, MT = 72, MB = 72;
    const TW = PW - ML - MR; // 432 pt = 6in text area
    const LH = 12;            // 12 pt line height = 6 lines/inch (Courier standard)
    const FS = 12;

    type Spec = { l?: number; r?: number; align?: 'left' | 'right' | 'center' };
    const SPECS: Partial<Record<LineType, Spec>> = {
        'scene-heading': {},
        'action':        {},
        'character':     { l: 158 },
        'dialogue':      { l: 72,  r: 108 },
        'parenthetical': { l: 115, r: 144 },
        'transition':    { align: 'right' },
        'centered':      { align: 'center' },
        'section':       {},
        'synopsis':      {},
    };

    const lines = text.split('\n');
    const types = classifyLines(text);

    let bodyStart = 0;
    const titleMap = new Map<string, string>();
    for (let i = 0; i < lines.length; i++) {
        if (types[i] === 'title') {
            const m = lines[i].match(/^([^:]+):\s*(.*)$/);
            if (m) titleMap.set(m[1].trim().toLowerCase(), m[2].trim());
            bodyStart = i + 1;
        } else if (types[i] === 'blank' && bodyStart > 0) {
            bodyStart = i + 1;
        } else {
            break;
        }
    }

    const scriptTitle  = titleMap.get('title') ?? title;
    const author       = titleMap.get('author') ?? titleMap.get('written by') ?? titleMap.get('by') ?? '';
    const hasTitlePage = titleMap.size > 0;
    const contactKeys  = [...titleMap.keys()].filter(k => !['title', 'author', 'written by', 'by'].includes(k));

    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'letter' });

    let scriptPage = hasTitlePage ? 0 : 1;
    let y = MT + FS;

    const writePageNum = () => {
        if (scriptPage > 1) {
            doc.setFont('courier', 'normal');
            doc.setFontSize(FS);
            doc.text(scriptPage + '.', PW - MR, MT - 10, { align: 'right' });
        }
    };

    const nextPage = () => {
        doc.addPage();
        scriptPage++;
        y = MT + FS;
        writePageNum();
    };

    const ensureRoom = (n: number) => {
        if (y + LH * n > PH - MB) nextPage();
    };

    if (hasTitlePage) {
        const mid = PH / 2;
        doc.setFont('courier', 'bold');
        doc.setFontSize(14);
        doc.text(scriptTitle.toUpperCase(), PW / 2, mid - 14, { align: 'center' });
        doc.setFont('courier', 'normal');
        doc.setFontSize(FS);
        doc.text('Written by', PW / 2, mid + 6, { align: 'center' });
        if (author) doc.text(author, PW / 2, mid + 20, { align: 'center' });
        if (contactKeys.length > 0) {
            doc.setFontSize(11);
            let cy = PH - MB - contactKeys.length * 16;
            contactKeys.forEach(k => {
                doc.text(titleMap.get(k) ?? '', ML, cy);
                cy += 16;
            });
        }
        doc.addPage();
        scriptPage = 1;
        y = MT + FS;
    }

    for (let i = bodyStart; i < lines.length; i++) {
        const type = types[i] ?? 'action';
        if (type === 'note' || type === 'title') continue;
        if (type === 'blank') {
            if (y <= PH - MB) y += LH; else nextPage();
            continue;
        }
        const spec  = SPECS[type] ?? {};
        const l     = spec.l ?? 0;
        const r     = spec.r ?? 0;
        const align = spec.align ?? 'left';
        const bold  = type === 'scene-heading' || type === 'character';
        if (type === 'scene-heading' || type === 'character') ensureRoom(3);
        doc.setFont('courier', bold ? 'bold' : 'normal');
        doc.setFontSize(FS);
        const content = cleanLine(lines[i], type);
        const wrapped = doc.splitTextToSize(content || ' ', TW - l - r) as string[];
        for (const wline of wrapped) {
            if (y > PH - MB) nextPage();
            if (align === 'right') {
                doc.text(wline, PW - MR, y, { align: 'right' });
            } else if (align === 'center') {
                doc.text(wline, PW / 2, y, { align: 'center' });
            } else {
                doc.text(wline, ML + l, y);
            }
            y += LH;
        }
    }

    return doc;
}
function applyLineStyle(el: HTMLElement, type: LineType) {
    el.className = LINE_CLASS[type];
    el.style.paddingLeft = '';
    el.style.paddingRight = '';
    el.style.textAlign = '';
    const s = LINE_INDENT[type];
    if (!s) return;
    if (s.paddingLeft)  el.style.paddingLeft  = s.paddingLeft;
    if (s.paddingRight) el.style.paddingRight = s.paddingRight;
    if (s.textAlign)    el.style.textAlign    = s.textAlign;
}

function buildEditorDOM(el: HTMLElement, text: string) {
    const lines = text.split('\n');
    const types = classifyLines(text);
    el.innerHTML = '';
    lines.forEach((line, i) => {
        const div = document.createElement('div');
        applyLineStyle(div, types[i] ?? 'action');
        if (line) { div.textContent = line; }
        else       { div.appendChild(document.createElement('br')); }
        el.appendChild(div);
    });
}

function refreshLineStyles(el: HTMLElement, text: string) {
    const types = classifyLines(text);
    Array.from(el.children).forEach((child, i) =>
        applyLineStyle(child as HTMLElement, types[i] ?? 'action')
    );
}

function extractEditorText(el: HTMLElement): string {
    return Array.from(el.children).map(d => d.textContent ?? '').join('\n');
}

interface EditorProps {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
}

const useAutoResize = (ref: React.RefObject<HTMLTextAreaElement | null>, value: string) => {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [value, ref]);
};

const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>, value: string, onChange: (v: string) => void) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const { selectionStart, selectionEnd } = el;
    const next = value.slice(0, selectionStart) + '    ' + value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = selectionStart + 4;
    });
};

const PlainEditor: React.FC<EditorProps> = ({ value, onChange, disabled }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useAutoResize(textareaRef, value);

    return (
        <div className="w-full font-mono text-sm leading-6">
            <div className="mx-auto py-10" style={{ width: '60ch' }}>
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => handleTabKey(e, value, onChange)}
                    readOnly={disabled}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    className="w-full min-h-[80vh] bg-transparent text-primary-900 dark:text-primary-100 caret-primary-900 dark:caret-primary-100 resize-none outline-none border-0 focus:ring-0 whitespace-pre-wrap overflow-hidden"
                    placeholder=""
                />
            </div>
        </div>
    );
};

const FormattedEditor: React.FC<EditorProps> = ({ value, onChange, disabled }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastUserValue = useRef('');

    // Initial render
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        lastUserValue.current = value;
        buildEditorDOM(el, value);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // External update (Firebase sync, undo, etc.) — skip echo of our own changes
    useEffect(() => {
        const el = editorRef.current;
        if (!el || value === lastUserValue.current) return;
        lastUserValue.current = value;
        buildEditorDOM(el, value);
    }, [value]);

    const handleInput = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;
        const text = extractEditorText(el);
        lastUserValue.current = text;
        refreshLineStyles(el, text); // only updates className/style — cursor is not reset
        onChange(text);
    }, [onChange]);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
        }
    }, []);

    return (
        <div className="w-full font-mono text-sm leading-6">
            <div className="mx-auto py-10" style={{ width: '60ch' }}>
                <div
                    ref={editorRef}
                    contentEditable={!disabled}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    className="outline-none min-h-[80vh]"
                    spellCheck={false}
                />
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Script info extraction
// ---------------------------------------------------------------------------

// Returns the primary location name from a scene heading, deliberately ignoring
// sub-locations and time-of-day qualifiers (e.g. "INT. OFFICE - LOBBY - DAY" → "OFFICE").
function extractLocation(heading: string): string {
    let h = heading.startsWith('.') ? heading.slice(1).trim() : heading;
    h = h.replace(/^(INT\.\/EXT\.|INT\.|EXT\.|I\/E\.|EST\.)\s*/i, '');
    h = h.replace(/^(INT\/EXT|INT|EXT|I\/E|EST)\s*[-–]\s*/i, '');
    return h.split(/\s*[-–]\s*/)[0]?.trim() ?? '';
}

function extractScriptInfo(text: string) {
    const lines = text.split('\n');
    const types = classifyLines(text);
    const characters = new Set<string>();
    const locations = new Set<string>();
    const scenes: string[] = [];

    lines.forEach((line, i) => {
        const trimmed = line.trim();
        const type = types[i];
        if (type === 'character') {
            const name = trimmed.replace(/\s*\^.*$/, '').replace(/\s*\(.*?\)\s*$/, '').trim();
            if (name) characters.add(name);
        }
        if (type === 'scene-heading') {
            scenes.push(trimmed.startsWith('.') ? trimmed.slice(1).trim() : trimmed);
            const loc = extractLocation(trimmed);
            if (loc) locations.add(loc);
        }
    });

    return {
        characters: [...characters].sort(),
        locations: [...locations].sort(),
        scenes,
    };
}

// ---------------------------------------------------------------------------
// Script analysis
// ---------------------------------------------------------------------------

interface ScriptAnalysis {
    dialog: number;
    action: number;
    other: number;
    dialogByChar: { name: string; percent: number; lines: number }[];
}

function analyzeScript(text: string): ScriptAnalysis {
    const lines = text.split('\n');
    const types = classifyLines(text);

    let dialogCount = 0;
    let actionCount = 0;
    let otherCount = 0;
    const dialogByChar: Record<string, number> = {};
    let currentChar = '';

    lines.forEach((line, i) => {
        const type = types[i];
        const trimmed = line.trim();
        if (type === 'dialogue' || type === 'parenthetical') {
            dialogCount++;
            if (type === 'dialogue' && currentChar) {
                dialogByChar[currentChar] = (dialogByChar[currentChar] ?? 0) + 1;
            }
        } else if (type === 'action') {
            actionCount++;
            currentChar = '';
        } else if (type === 'character') {
            currentChar = trimmed.replace(/\s*\^.*$/, '').replace(/\s*\(.*?\)\s*$/, '').trim();
        } else if (type === 'blank') {
            currentChar = '';
        } else if (type !== 'title' && type !== 'note') {
            otherCount++;
        }
    });

    const total = dialogCount + actionCount + otherCount;
    const sorted = Object.entries(dialogByChar).sort(([, a], [, b]) => b - a);
    const totalDialogLines = sorted.reduce((s, [, n]) => s + n, 0);

    return {
        dialog: total ? Math.round((dialogCount / total) * 100) : 0,
        action: total ? Math.round((actionCount / total) * 100) : 0,
        other:  total ? Math.round((otherCount  / total) * 100) : 0,
        dialogByChar: sorted.map(([name, count]) => ({
            name,
            lines: count,
            percent: totalDialogLines ? Math.round((count / totalDialogLines) * 100) : 0,
        })),
    };
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

const Tooltip = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="relative group">
        {children}
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-primary-900 dark:bg-primary-100 text-white dark:text-primary-900 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {label}
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface SidebarSectionProps {
    icon: React.ReactNode;
    title: string;
    items: string[];
    isOpen: boolean;
    onToggle: () => void;
    getLink?: (item: string) => string | null;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ icon, title, items, isOpen, onToggle, getLink }) => (
    <div>
        <button
            onClick={onToggle}
            className="w-full flex items-center gap-2 mb-1 px-3 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors group"
        >
            <span className="text-primary-500 dark:text-primary-400">{icon}</span>
            <h3 className="text-sm font-bold text-primary-800 dark:text-primary-200">{title}</h3>
            <span className="ml-auto text-xs text-primary-400 font-semibold">{items.length}</span>
            {isOpen
                ? <ChevronDown size={14} className="text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-300 shrink-0 transition-colors" />
                : <ChevronRight size={14} className="text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-300 shrink-0 transition-colors" />}
        </button>
        {isOpen && (
            items.length === 0 ? (
                <p className="text-xs text-primary-400 dark:text-primary-600 italic px-3 py-1">None found</p>
            ) : (
                <ul className="space-y-0">
                    {items.map((item, i) => {
                        const href = getLink?.(item);
                        const linked = !!href;
                        const row = (
                            <span className="flex items-center gap-2.5 w-full min-w-0">
                                {linked
                                    ? <CheckCircle size={13} className="shrink-0 text-green-500 dark:text-green-400" />
                                    : <AlertCircle size={13} className="shrink-0 text-amber-400 dark:text-amber-500" />
                                }
                                <span className="truncate text-sm">{item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()}</span>
                            </span>
                        );
                        return (
                            <li key={i}>
                                {href ? (
                                    <Link
                                        to={href}
                                        className="flex items-center gap-2.5 px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-200 text-primary-900 dark:text-white hover:bg-primary-100 dark:hover:bg-primary-900"
                                        title={item}
                                    >
                                        {row}
                                    </Link>
                                ) : (
                                    <div
                                        className="flex items-center gap-2.5 px-3 py-1 rounded-lg text-sm font-semibold text-primary-500 dark:text-primary-400"
                                        title={item}
                                    >
                                        {row}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )
        )}
    </div>
);

interface ScriptSidebarProps {
    characters: string[];
    locations: string[];
    scenes: string[];
    width: number;
    projectId: string;
    storeCharacters: Character[];
    storeLocations: Location[];
}

const ScriptSidebar: React.FC<ScriptSidebarProps> = ({
    characters, locations, scenes, width,
    projectId, storeCharacters, storeLocations,
}) => {
    const [open, setOpen] = useState({ characters: true, locations: true, scenes: true });

    const toggle = (key: keyof typeof open) =>
        setOpen(prev => ({ ...prev, [key]: !prev[key] }));

    const charNameToIdMap = useMemo(() => {
        const m = new Map<string, string>();
        storeCharacters.forEach(c => m.set(c.name.toLowerCase(), c.id));
        return m;
    }, [storeCharacters]);

    const locNameToIdMap = useMemo(() => {
        const m = new Map<string, string>();
        storeLocations.forEach(l => m.set(l.name.toLowerCase(), l.id));
        return m;
    }, [storeLocations]);

    return (
        <div style={{ width }} className="shrink-0 sticky top-0 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pl-4 pt-2 space-y-6">
            <SidebarSection
                icon={<User size={13} />}
                title="Characters"
                items={characters}
                isOpen={open.characters}
                onToggle={() => toggle('characters')}
                getLink={name => {
                    const id = charNameToIdMap.get(name.toLowerCase());
                    return id ? `/project/${projectId}/characters/${id}` : null;
                }}
            />
            <SidebarSection
                icon={<MapPin size={13} />}
                title="Locations"
                items={locations}
                isOpen={open.locations}
                onToggle={() => toggle('locations')}
                getLink={name => {
                    const id = locNameToIdMap.get(name.toLowerCase());
                    return id ? `/project/${projectId}/locations/${id}` : null;
                }}
            />
            <SidebarSection
                icon={<Clapperboard size={13} />}
                title="Scenes"
                items={scenes}
                isOpen={open.scenes}
                onToggle={() => toggle('scenes')}
            />
        </div>
    );
};

export const ScriptPage: React.FC = () => {
    const { script, saveScript, setScriptFrozen, characters: storeCharacters, locations: storeLocations } = useStore();
    const { activeProjectId, activeProject } = useProjects();
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [confirmFreezeOpen, setConfirmFreezeOpen] = useState(false);
    const [howtoOpen, setHowtoOpen] = useState(false);
    const [analysisOpen, setAnalysisOpen] = useState(false);
    const [mode, setMode] = useState<'plain' | 'formatted'>('formatted');
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const isResizing = useRef(false);
    const resizeStartX = useRef(0);
    const resizeStartWidth = useRef(0);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!isResizing.current) return;
            const delta = resizeStartX.current - e.clientX;
            setSidebarWidth(Math.min(480, Math.max(120, resizeStartWidth.current + delta)));
        };
        const onUp = () => {
            if (!isResizing.current) return;
            isResizing.current = false;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []);

    const handleResizeStart = (e: React.MouseEvent) => {
        isResizing.current = true;
        resizeStartX.current = e.clientX;
        resizeStartWidth.current = sidebarWidth;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    };

    const frozen = script?.frozen ?? false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setDraft(script?.content ?? ''); }, [script?.content]);

    const persistSave = useCallback(async (content: string) => {
        setSaving(true);
        await saveScript(content);
        setSaving(false);
    }, [saveScript]);

    const scheduleAutoSave = useAutoSave(persistSave, AUTOSAVE_DELAY);

    const handleChange = (value: string) => {
        if (frozen) return;
        setDraft(value);
        scheduleAutoSave(value);
    };

    const handleFreezeConfirm = async () => {
        setConfirmFreezeOpen(false);
        await setScriptFrozen(true);
    };

    const handleUnfreeze = async () => {
        await setScriptFrozen(false);
    };

    const isEmpty = !draft.trim();
    const debouncedDraft = useDebounce(draft, 500);
    const { characters, locations, scenes } = useMemo(() => extractScriptInfo(debouncedDraft), [debouncedDraft]);
    const analysis = useMemo(() => analyzeScript(debouncedDraft), [debouncedDraft]);

    const filename = activeProject?.name ?? 'script';

    const handleDownloadFountain = () => {
        const blob = new Blob([draft], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.fountain`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        generateScreenplayPdf(draft, filename).save(filename + '.pdf');
    };

    return (
        <div className="w-full">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-primary-900 dark:text-white">Script</h2>
                <div className="flex items-center gap-3">
                    <Tooltip label="Download script PDF">
                        <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
                            <Download size={14} />.pdf
                        </Button>
                    </Tooltip>
                    <Tooltip label="Download Fountain File">
                        <Button variant="outline" size="sm" onClick={handleDownloadFountain}>
                            <Download size={14} />.fountain
                        </Button>
                    </Tooltip>
                    <Tooltip label="Syntax How To">
                        <Button variant="outline" size="sm" onClick={() => setHowtoOpen(true)}>
                            <Info size={14} />Info
                        </Button>
                    </Tooltip>
                    <Tooltip label="Script analysis">
                        <Button variant="outline" size="sm" onClick={() => setAnalysisOpen(true)} disabled={isEmpty}>
                            <BarChart2 size={14} />Analysis
                        </Button>
                    </Tooltip>
                    {frozen && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                            <Lock size={12} /> Frozen — read only
                        </span>
                    )}
                    {!frozen && (
                        <span className="text-xs text-primary-400">
                            {saving ? 'Saving…' : draft.trim() ? 'Auto-saved' : ''}
                        </span>
                    )}
                    <div className="flex items-center gap-1 bg-primary-100 dark:bg-primary-800 p-1 rounded-lg">
                        <Tooltip label="Plain text">
                            <button
                                onClick={() => setMode('plain')}
                                className={`p-1.5 rounded-md transition-all ${mode === 'plain' ? 'bg-white dark:bg-primary-700 shadow-sm text-primary-900 dark:text-white' : 'text-primary-500 hover:text-primary-700 dark:hover:text-primary-300'}`}
                            >
                                <Code size={15} />
                            </button>
                        </Tooltip>
                        <Tooltip label="Formatted">
                            <button
                                onClick={() => setMode('formatted')}
                                className={`p-1.5 rounded-md transition-all ${mode === 'formatted' ? 'bg-white dark:bg-primary-700 shadow-sm text-primary-900 dark:text-white' : 'text-primary-500 hover:text-primary-700 dark:hover:text-primary-300'}`}
                            >
                                <BookOpen size={15} />
                            </button>
                        </Tooltip>
                    </div>
                    {frozen ? (
                        <Tooltip label="Make script editable">
                            <Button size="sm" variant="outline" onClick={handleUnfreeze}>
                                <Unlock size={14} /> Unfreeze
                            </Button>
                        </Tooltip>
                    ) : (
                        <Tooltip label="Make script uneditable">
                            <Button size="sm" variant="outline" onClick={() => setConfirmFreezeOpen(true)}>
                                <Lock size={14} /> Freeze
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Body: editor + resize handle + sidebar */}
            <div className="flex items-start">
                {/* Editor / Viewer */}
                <div className="flex-1 min-w-0 relative">
                    {isEmpty && !saving && (
                        <div className="absolute top-24 inset-x-0 flex flex-col items-center text-primary-400 dark:text-primary-600 pointer-events-none select-none gap-3">
                            <FileText size={48} className="opacity-30" />
                            <p className="text-sm">Start typing in Fountain notation…</p>
                            <p className="text-xs opacity-60">INT. LOCATION - DAY · CHARACTER · Dialogue</p>
                        </div>
                    )}
                    {mode === 'formatted'
                        ? <FormattedEditor value={draft} onChange={handleChange} disabled={frozen} />
                        : <PlainEditor value={draft} onChange={handleChange} disabled={frozen} />
                    }
                </div>

                {/* Resize handle */}
                <div
                    onMouseDown={handleResizeStart}
                    className="w-3 self-stretch cursor-col-resize flex items-start justify-center group pt-2 shrink-0"
                >
                    <div className="w-px h-full bg-primary-200 dark:bg-primary-800 group-hover:bg-primary-400 dark:group-hover:bg-primary-500 transition-colors" />
                </div>

                {/* Sidebar */}
                <ScriptSidebar
                    characters={characters}
                    locations={locations}
                    scenes={scenes}
                    width={sidebarWidth}
                    projectId={activeProjectId ?? ''}
                    storeCharacters={storeCharacters}
                    storeLocations={storeLocations}
                />
            </div>

            {/* Freeze confirmation dialog */}
            <Dialog open={confirmFreezeOpen} onClose={() => setConfirmFreezeOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-sm rounded-2xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <Lock size={20} className="text-amber-500 shrink-0" />
                            <DialogTitle className="text-lg font-semibold text-primary-900 dark:text-white">
                                Freeze script?
                            </DialogTitle>
                        </div>
                        <p className="text-sm text-primary-500 dark:text-primary-400 mb-6">
                            The script will be locked and cannot be edited until you unfreeze it.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" size="sm" onClick={() => setConfirmFreezeOpen(false)}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleFreezeConfirm}>
                                <Lock size={14} /> Yes, freeze
                            </Button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Analysis modal */}
            <Dialog open={analysisOpen} onClose={() => setAnalysisOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md rounded-2xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800 p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <DialogTitle className="text-lg font-semibold text-primary-900 dark:text-white flex items-center gap-2">
                                <BarChart2 size={18} className="text-primary-400" /> Script Analysis
                            </DialogTitle>
                            <Button variant="ghost" size="icon" onClick={() => setAnalysisOpen(false)}>
                                <X size={16} />
                            </Button>
                        </div>

                        {/* Dialog vs Action */}
                        <section className="mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-wide text-primary-500 dark:text-primary-400 mb-3">Dialog vs Action</h3>
                            <div className="space-y-2">
                                {([
                                    { label: 'Dialog', value: analysis.dialog, color: 'bg-violet-500' },
                                    { label: 'Action', value: analysis.action, color: 'bg-violet-300 dark:bg-violet-700' },
                                    { label: 'Other',  value: analysis.other,  color: 'bg-primary-300 dark:bg-primary-600' },
                                ] as const).map(({ label, value, color }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-primary-700 dark:text-primary-300">{label}</span>
                                            <span className="font-semibold text-primary-900 dark:text-white">{value}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-primary-100 dark:bg-primary-800 overflow-hidden">
                                            <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Dialog per character */}
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-wide text-primary-500 dark:text-primary-400 mb-3">Dialog per Character</h3>
                            {analysis.dialogByChar.length === 0 ? (
                                <p className="text-sm text-primary-400 italic">No dialogue found</p>
                            ) : (
                                <div className="space-y-2">
                                    {analysis.dialogByChar.map(({ name, percent }) => (
                                        <div key={name}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-primary-700 dark:text-primary-300 capitalize">{name.toLowerCase()}</span>
                                                <span className="font-semibold text-primary-900 dark:text-white">{percent}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-primary-100 dark:bg-primary-800 overflow-hidden">
                                                <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </DialogPanel>
                </div>
            </Dialog>

            {/* Fountain how-to modal */}
            <Dialog open={howtoOpen} onClose={() => setHowtoOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="relative w-full h-full rounded-2xl overflow-auto shadow-2xl bg-white dark:bg-primary-900 border border-primary-200 dark:border-primary-800">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setHowtoOpen(false)}
                            className="absolute top-3 right-3 z-10"
                        >
                            <X size={18} />
                        </Button>
                        <img
                            src="/assets/fountain-howto.webp"
                            alt="Fountain notation guide"
                            className="w-full h-auto block"
                        />
                    </DialogPanel>
                </div>
            </Dialog>
        </div>
    );
};
