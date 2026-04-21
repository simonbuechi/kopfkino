import React from 'react';

type TokenType =
    | 'title-page'
    | 'scene-heading'
    | 'action'
    | 'character'
    | 'dialogue'
    | 'parenthetical'
    | 'transition'
    | 'centered'
    | 'section'
    | 'synopsis'
    | 'note'
    | 'blank';

interface Token {
    type: TokenType;
    text: string;
    level?: number; // for sections
}

const SCENE_HEADING_RE = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.|EST\.)\s/i;
const TRANSITION_RE = /^[A-Z\s]+TO:$/;
const CHARACTER_RE = /^[A-Z][A-Z\s\-'.()@^]*$/;
const SECTION_RE = /^(#{1,3})\s+(.+)$/;
const SYNOPSIS_RE = /^=\s+(.+)$/;
const NOTE_RE = /^\[\[(.+)\]\]$/;
const CENTERED_RE = /^>(.+)<$/;

function tokenize(text: string): Token[] {
    const lines = text.split('\n');
    const tokens: Token[] = [];

    // Check for title page (key: value at the start before any blank line followed by content)
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
            // If next non-blank line doesn't match key: value, end title page
            const next = lines[i];
            if (!next || !/^[A-Za-z ]+:/.test(next)) {
                inTitlePage = false;
            }
        } else {
            inTitlePage = false;
        }
    }

    if (titleLines.length > 0) {
        const content = titleLines.filter(l => l.trim()).join('\n');
        tokens.push({ type: 'title-page', text: content });
    }

    // Parse remaining lines with state machine
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

        // Forced scene heading
        if (line.startsWith('.') && !line.startsWith('..')) {
            tokens.push({ type: 'scene-heading', text: line.slice(1).trim() });
            inDialogue = false;
            i++;
            continue;
        }

        // Scene heading
        if (SCENE_HEADING_RE.test(line)) {
            tokens.push({ type: 'scene-heading', text: line });
            inDialogue = false;
            i++;
            continue;
        }

        // Forced transition
        if (line.startsWith('>') && !line.endsWith('<')) {
            tokens.push({ type: 'transition', text: line.slice(1).trim() });
            inDialogue = false;
            i++;
            continue;
        }

        // Centered text
        if (CENTERED_RE.test(line)) {
            const match = line.match(CENTERED_RE)!;
            tokens.push({ type: 'centered', text: match[1].trim() });
            inDialogue = false;
            i++;
            continue;
        }

        // Transition
        if (TRANSITION_RE.test(line)) {
            tokens.push({ type: 'transition', text: line });
            inDialogue = false;
            i++;
            continue;
        }

        // Note
        if (NOTE_RE.test(line)) {
            const match = line.match(NOTE_RE)!;
            tokens.push({ type: 'note', text: match[1] });
            i++;
            continue;
        }

        // Section
        const sectionMatch = line.match(SECTION_RE);
        if (sectionMatch) {
            tokens.push({ type: 'section', text: sectionMatch[2], level: sectionMatch[1].length });
            inDialogue = false;
            i++;
            continue;
        }

        // Synopsis
        const synopsisMatch = line.match(SYNOPSIS_RE);
        if (synopsisMatch) {
            tokens.push({ type: 'synopsis', text: synopsisMatch[1] });
            i++;
            continue;
        }

        // Parenthetical (only inside dialogue)
        if (inDialogue && line.startsWith('(') && line.endsWith(')')) {
            tokens.push({ type: 'parenthetical', text: line });
            i++;
            continue;
        }

        // Forced action
        if (line.startsWith('!')) {
            tokens.push({ type: 'action', text: line.slice(1) });
            inDialogue = false;
            i++;
            continue;
        }

        // Character (all caps, preceded by blank, followed by non-blank)
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

        // Dialogue
        if (inDialogue) {
            tokens.push({ type: 'dialogue', text: line });
            i++;
            continue;
        }

        // Action
        tokens.push({ type: 'action', text: line });
        i++;
    }

    return tokens;
}

function renderInline(text: string): React.ReactNode {
    // Bold italic: ***text***
    // Bold: **text**
    // Italic: *text*
    // Underline: _text_
    // Note inline: [[text]]
    const parts: React.ReactNode[] = [];
    const remaining = text;
    let key = 0;

    const re = /(\*{3}(.+?)\*{3}|\*{2}(.+?)\*{2}|\*(.+?)\*|_(.+?)_|\[\[(.+?)\]\])/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = re.exec(remaining)) !== null) {
        if (match.index > lastIndex) {
            parts.push(remaining.slice(lastIndex, match.index));
        }
        if (match[2]) {
            parts.push(<strong key={key++}><em>{match[2]}</em></strong>);
        } else if (match[3]) {
            parts.push(<strong key={key++}>{match[3]}</strong>);
        } else if (match[4]) {
            parts.push(<em key={key++}>{match[4]}</em>);
        } else if (match[5]) {
            parts.push(<span key={key++} className="underline">{match[5]}</span>);
        } else if (match[6]) {
            parts.push(<span key={key++} className="text-primary-400 dark:text-primary-500 text-xs">[{match[6]}]</span>);
        }
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < remaining.length) {
        parts.push(remaining.slice(lastIndex));
    }

    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

interface FountainRendererProps {
    content: string;
}

export const FountainRenderer: React.FC<FountainRendererProps> = ({ content }) => {
    const tokens = tokenize(content);

    return (
        <div className="font-mono text-sm leading-relaxed max-w-[600px] mx-auto px-8 py-8 text-primary-900 dark:text-primary-100">
            {tokens.map((token, idx) => {
                switch (token.type) {
                    case 'title-page':
                        return (
                            <div key={idx} className="text-center mb-12 pb-8 border-b border-primary-200 dark:border-primary-700">
                                {token.text.split('\n').map((line, li) => (
                                    <div key={li} className="text-primary-600 dark:text-primary-300 font-semibold">
                                        {renderInline(line)}
                                    </div>
                                ))}
                            </div>
                        );

                    case 'scene-heading':
                        return (
                            <div key={idx} className="mt-8 mb-2 font-bold uppercase tracking-wide text-primary-900 dark:text-white">
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'action':
                        return (
                            <div key={idx} className="mb-3 text-primary-800 dark:text-primary-200">
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'character':
                        return (
                            <div key={idx} className="mt-6 mb-0 ml-40 font-bold text-primary-900 dark:text-white uppercase tracking-wider">
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'dialogue':
                        return (
                            <div key={idx} className="mb-1 ml-24 mr-24 text-primary-800 dark:text-primary-200">
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'parenthetical':
                        return (
                            <div key={idx} className="mb-1 ml-32 mr-32 italic text-primary-500 dark:text-primary-400">
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'transition':
                        return (
                            <div key={idx} className="mt-6 mb-2 text-right font-bold uppercase text-primary-600 dark:text-primary-400 tracking-widest">
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'centered':
                        return (
                            <div key={idx} className="my-3 text-center text-primary-800 dark:text-primary-200">
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'section':
                        return (
                            <div
                                key={idx}
                                className={`mt-10 mb-2 font-bold text-accent border-b border-accent/30 pb-1 ${
                                    token.level === 1 ? 'text-lg' : token.level === 2 ? 'text-base' : 'text-sm'
                                }`}
                            >
                                {'#'.repeat(token.level ?? 1)} {renderInline(token.text)}
                            </div>
                        );

                    case 'synopsis':
                        return (
                            <div key={idx} className="my-2 italic text-primary-400 dark:text-primary-500 text-xs">
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'note':
                        return (
                            <div key={idx} className="my-1 text-primary-400 dark:text-primary-600 text-xs italic">
                                [[{renderInline(token.text)}]]
                            </div>
                        );

                    case 'blank':
                        return <div key={idx} className="h-3" />;

                    default:
                        return null;
                }
            })}
        </div>
    );
};
