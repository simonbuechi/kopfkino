import type { PollinationsModel } from '../types/types';

export type { PollinationsModel };

export const POLLINATIONS_MODELS: { value: PollinationsModel; label: string }[] = [
    { value: 'zimage',         label: 'Z-Image Turbo (default)' },
    { value: 'flux',           label: 'Flux Schnell' },
    { value: 'klein',          label: 'FLUX.2 Klein' },
    { value: 'gptimage',       label: 'GPT Image 1 Mini' },
    { value: 'gptimage-large', label: 'GPT Image 1.5' },
    { value: 'wan-image',      label: 'Wan 2.7 Image' },
    { value: 'qwen-image',     label: 'Qwen Image Plus' },
    { value: 'kontext',        label: 'FLUX.1 Kontext' },
];

export interface GenerateImageParams {
    prompt: string;
    model: PollinationsModel;
    width: number;
    height: number;
    seed?: number;
    enhance: boolean;
}

export async function generateImageBlob(params: GenerateImageParams, apiKey: string): Promise<Blob> {
    const { prompt, model, width, height, seed, enhance } = params;

    const searchParams = new URLSearchParams({
        model,
        width: String(width),
        height: String(height),
        seed: seed !== undefined ? String(seed) : '-1',
    });

    if (enhance) searchParams.set('enhance', 'true');

    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${searchParams.toString()}`;

    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) throw new Error(`Generation failed: ${response.status} ${response.statusText}`);

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) throw new Error('Unexpected response from API');

    return response.blob();
}
