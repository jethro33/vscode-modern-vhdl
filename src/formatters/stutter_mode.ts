// Copyright (c) 2019 Rich J. Young

import {
    languages,
    Position,
    ProviderResult,
    Range,
    TextDocument,
    TextEdit,
    workspace
} from 'vscode';

const triggerCharacters = [';', '.', "'", ',', '[', ']', '-', '\n'];

export const VhdlStutterModeFormattingEditProvider = languages.registerOnTypeFormattingEditProvider(
    { scheme: '*', language: 'vhdl' },
    {
        provideOnTypeFormattingEdits(
            document: TextDocument,
            position: Position,
            ch: string
        ): ProviderResult<TextEdit[]> {
            const conf = workspace.getConfiguration('vhdl', document.uri);
            let inComment = document.lineAt(position).text.match(/^.*--.*$/);
            let linePrefix = document.lineAt(position).text.substr(0, position.character);

            switch (ch) {
                case "'":
                    if (!conf.get('enableStutterDelimiters')) break;
                    if (inComment) break;
                    if (linePrefix.endsWith("''")) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                '"'
                            )
                        ];
                    }
                    break;

                case ';':
                    if (!conf.get('enableStutterDelimiters')) break;
                    if (inComment) break;
                    if (linePrefix.endsWith(': ;')) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                '= '
                            )
                        ];
                    } else if (linePrefix.match(/\s;;/)) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                ': '
                            )
                        ];
                    } else if (linePrefix.endsWith(';;')) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                ' : '
                            )
                        ];
                    }
                    break;

                case '.':
                    if (!conf.get('enableStutterDelimiters')) break;
                    if (inComment) break;
                    if (linePrefix.match(/\s\.\./)) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                '=> '
                            )
                        ];
                    } else if (linePrefix.endsWith('..')) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                ' => '
                            )
                        ];
                    }
                    break;

                case ',':
                    if (!conf.get('enableStutterDelimiters')) break;
                    if (inComment) break;
                    if (linePrefix.match(/\s,,/)) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                '<= '
                            )
                        ];
                    } else if (linePrefix.endsWith(',,')) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                ' <= '
                            )
                        ];
                    }
                    break;

                case '[':
                    if (!conf.get('enableStutterBrackets')) break;
                    if (inComment) break;
                    if (linePrefix.endsWith('([')) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                '['
                            )
                        ];
                    } else if (linePrefix.endsWith('[')) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -1), position.with()),
                                '('
                            )
                        ];
                    }
                    break;

                case ']':
                    if (!conf.get('enableStutterBrackets')) break;
                    if (inComment) break;
                    if (linePrefix.endsWith(')]')) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -2), position.with()),
                                ']'
                            )
                        ];
                    } else if (linePrefix.endsWith(']')) {
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -1), position.with()),
                                ')'
                            )
                        ];
                    }
                    break;

                case '-':
                    if (!conf.get('enableStutterComments')) break;
                    let width: number = conf.get('stutterCompletionsBlockWidth');
                    if (linePrefix.match(/^\s*----+$/)) {
                        let indent = linePrefix.match(/^(\s*).*$/)[1];
                        return [
                            TextEdit.replace(
                                new Range(position.translate(0, -1), position.with()),
                                (document.eol == 1 ? '\n' : '\r\n') + indent + '-- '
                            ),
                            TextEdit.insert(
                                new Position(position.line + 1, 0),
                                indent + '-'.repeat(width) + (document.eol == 1 ? '\n' : '\r\n')
                            )
                        ];
                    } else if (linePrefix.match(/^\s*---$/)) {
                        return [TextEdit.insert(position.with(), '-'.repeat(width - 3))];
                    }
                    break;

                case '\n':
                    if (!conf.get('enableStutterComments')) break;
                    if (linePrefix.match(/^\s*$/)) {
                        let prevLineIsComment = document
                            .lineAt(position.line - 1)
                            .text.match(/^\s*(--[^-]\s*)\S+.*$/);
                        let prevLineIsEmptyComment = document
                            .lineAt(position.line - 1)
                            .text.match(/^\s*--\s*$/);
                        if (prevLineIsComment) {
                            return [TextEdit.insert(position.with(), prevLineIsComment[1])];
                        } else if (prevLineIsEmptyComment) {
                            return [
                                TextEdit.delete(
                                    new Range(position.translate(-1, 0), position.with())
                                )
                            ];
                        }
                    }
                    break;
            }
            return [];
        }
    },
    triggerCharacters[0],
    ...triggerCharacters.slice(1)
);
