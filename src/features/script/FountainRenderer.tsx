import React from 'react';
import { LINE_CLASS, tokenize, renderInline } from './fountainParser.tsx';

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
                                    <div key={li} className={LINE_CLASS['title-page']}>
                                        {renderInline(line)}
                                    </div>
                                ))}
                            </div>
                        );

                    case 'scene-heading':
                        return (
                            <div key={idx} className={`mt-8 mb-2 uppercase tracking-wide ${LINE_CLASS['scene-heading']}`}>
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'action':
                        return (
                            <div key={idx} className={`mb-3 ${LINE_CLASS['action']}`}>
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'character':
                        return (
                            <div key={idx} className={`mt-6 mb-0 ml-40 uppercase tracking-wider ${LINE_CLASS['character']}`}>
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'dialogue':
                        return (
                            <div key={idx} className={`mb-1 ml-24 mr-24 ${LINE_CLASS['dialogue']}`}>
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'parenthetical':
                        return (
                            <div key={idx} className={`mb-1 ml-32 mr-32 ${LINE_CLASS['parenthetical']}`}>
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'transition':
                        return (
                            <div key={idx} className={`mt-6 mb-2 text-right uppercase tracking-widest ${LINE_CLASS['transition']}`}>
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'centered':
                        return (
                            <div key={idx} className={`my-3 text-center ${LINE_CLASS['centered']}`}>
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'section':
                        return (
                            <div
                                key={idx}
                                className={`mt-10 mb-2 border-b border-current/30 pb-1 ${LINE_CLASS['section']} ${
                                    token.level === 1 ? 'text-lg' : token.level === 2 ? 'text-base' : 'text-sm'
                                }`}
                            >
                                {'#'.repeat(token.level ?? 1)} {renderInline(token.text)}
                            </div>
                        );

                    case 'synopsis':
                        return (
                            <div key={idx} className={`my-2 ${LINE_CLASS['synopsis']}`}>
                                {renderInline(token.text)}
                            </div>
                        );

                    case 'note':
                        return (
                            <div key={idx} className={`my-1 ${LINE_CLASS['note']}`}>
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
