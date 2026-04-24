import { useRef, useCallback } from 'react';
import type React from 'react';
import toast from 'react-hot-toast';

export interface CsvColumnDef<T> {
    header: string;
    getValue: (item: T) => string;
}

export interface UseCSVImportExportOptions<T> {
    items: T[];
    replaceItems: (items: T[]) => void;
    columns: CsvColumnDef<T>[];
    buildItem: (row: Record<string, string>) => T | null;
    entityName: string;
    filename: string;
    confirmImport?: (message: string) => Promise<boolean>;
}

// RFC 4180-compliant CSV parser
function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { field += '"'; i += 2; }
                else { inQuotes = false; i++; }
            } else {
                field += ch; i++;
            }
        } else {
            if (ch === '"') { inQuotes = true; i++; }
            else if (ch === ',') { row.push(field); field = ''; i++; }
            else if (ch === '\r' && text[i + 1] === '\n') { row.push(field); field = ''; rows.push(row); row = []; i += 2; }
            else if (ch === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; }
            else { field += ch; i++; }
        }
    }
    if (field || row.length > 0) { row.push(field); rows.push(row); }
    return rows;
}

function escapeCsvField(value: string): string {
    const s = String(value);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function useCSVImportExport<T>({
    items,
    replaceItems,
    columns,
    buildItem,
    entityName,
    filename,
    confirmImport,
}: UseCSVImportExportOptions<T>) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = useCallback(async () => {
        const plural = `${entityName}s`;
        const message = `WARNING: Importing a CSV will PERMANENTLY DELETE all existing ${plural}. Proceed?`;
        const ok = confirmImport
            ? await confirmImport(message)
            : confirm(message);
        if (ok) fileInputRef.current?.click();
    }, [entityName, confirmImport]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            if (!text) return;
            try {
                const rows = parseCsv(text);
                const nonEmpty = rows.filter(r => r.some(v => v.trim()));
                if (nonEmpty.length < 2) { toast.error('No data found in CSV.'); return; }

                const headers = nonEmpty[0].map(h => h.trim().toLowerCase());
                const built: T[] = [];

                for (let i = 1; i < nonEmpty.length; i++) {
                    const values = nonEmpty[i];
                    const row: Record<string, string> = {};
                    headers.forEach((h, idx) => { row[h] = values[idx]?.trim() ?? ''; });
                    const item = buildItem(row);
                    if (item) built.push(item);
                }

                if (built.length === 0) { toast.error(`No valid ${entityName}s found in CSV.`); return; }
                replaceItems(built);
                toast.success(`Imported ${built.length} ${entityName}${built.length !== 1 ? 's' : ''}.`);
            } catch (err) {
                console.error(err);
                toast.error('Failed to parse CSV.');
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsText(file);
    }, [buildItem, entityName, replaceItems]);

    const handleExportClick = useCallback(() => {
        if (items.length === 0) { toast.error(`No ${entityName}s to export.`); return; }
        const csv = [
            columns.map(c => c.header).join(','),
            ...items.map(item => columns.map(c => escapeCsvField(c.getValue(item))).join(',')),
        ].join('\n');
        downloadCsv(csv, filename);
    }, [items, columns, entityName, filename]);

    return { fileInputRef, handleImportClick, handleFileChange, handleExportClick };
}
