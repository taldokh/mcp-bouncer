import * as z from 'zod/v4';

export const FindingKindSchema = z.enum(['hidden-unicode', 'suspicious-phrase', 'mentions-other-tool', 'too-long']);
export type FindingKind = z.infer<typeof FindingKindSchema>;

export interface Finding {
    location: string;   // where: "get-order-status.inputSchema.properties.orderId"
    kind: FindingKind;  // what kind: "hidden-unicode", "suspicious-phrase", ...
    detail: string;     // what exactly: "zero-width", "Do not tell the user", ...
}

export interface ScannableTool {
    name: string;
    [field: string]: unknown;
}

// Characters that are invisible to the user but still read by the model
const HIDDEN_CHARS: { name: string; pattern: RegExp }[] = [
    { name: 'zero-width', pattern: /[\u200B-\u200D\u2060\uFEFF]/u },
    { name: 'bidi-control', pattern: /[\u202A-\u202E\u2066-\u2069]/u },
    { name: 'unicode-tag', pattern: /[\u{E0000}-\u{E007F}]/u },
    { name: 'variation-selector', pattern: /[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/u },
];

const ALL_HIDDEN_CHARS = new RegExp(HIDDEN_CHARS.map(({ pattern }) => pattern.source).join('|'), 'gu');

const SUSPICIOUS_PHRASES: RegExp[] = [
    /ignore (all |any )?(previous|prior|above) (instructions|messages)/i,
    /do not (tell|inform|mention|reveal)( this)?( step)?( to)? the user/i,
    /before (using|calling) this tool/i,
    /<\/?(important|system|instructions?)>/i,
    /^\s*system\s*:/im,
];

const MAX_DESCRIPTION_LENGTH = 1000;

const TAG_CHARS = /[\u{E0020}-\u{E007E}]/gu;

export function normalize(text: string): string {
    return text
        .replace(TAG_CHARS, c => String.fromCodePoint(c.codePointAt(0)! - 0xE0000))
        .replace(ALL_HIDDEN_CHARS, '')
        .normalize('NFKC');
}

export function collectStrings(value: unknown, path: string): { path: string; text: string }[] {
    if (typeof value === 'string') return [{ path, text: value }];
    if (typeof value !== 'object' || value === null) return [];

    const texts: { path: string; text: string }[] = [];
    for (const [key, child] of Object.entries(value)) {
        const childPath = `${path}.${key}`;
        if (!Array.isArray(value)) texts.push({ path: `${childPath} (key)`, text: key });
        texts.push(...collectStrings(child, childPath));
    }
    return texts;
}

export function scanText(text: string, location: string, otherToolNames: string[]): Finding[] {
    const findings: Finding[] = [];

    for (const { name, pattern } of HIDDEN_CHARS) {
        if (pattern.test(text)) findings.push({ location, kind: 'hidden-unicode', detail: name });
    }

    const normalized = normalize(text);

    for (const pattern of SUSPICIOUS_PHRASES) {
        const match = normalized.match(pattern);
        if (match) findings.push({ location, kind: 'suspicious-phrase', detail: match[0].trim() });
    }

    for (const other of otherToolNames) {
        if (normalized.includes(other)) findings.push({ location, kind: 'mentions-other-tool', detail: other });
    }

    if (text.length > MAX_DESCRIPTION_LENGTH) {
        findings.push({ location, kind: 'too-long', detail: `${text.length} chars` });
    }

    return findings;
}

export function scan(tool: ScannableTool, allToolNames: string[]): Finding[] {
    const { name, ...fields } = tool;
    const otherToolNames = allToolNames.filter(other => other !== name);

    // The name is checked without tool mentions, since names like get-order and get-order-status overlap
    const nameFindings = scanText(name, `${name}.name`, []);
    const fieldFindings = collectStrings(fields, name)
        .flatMap(({ path, text }) => scanText(text, path, otherToolNames));

    return [...nameFindings, ...fieldFindings];
}
