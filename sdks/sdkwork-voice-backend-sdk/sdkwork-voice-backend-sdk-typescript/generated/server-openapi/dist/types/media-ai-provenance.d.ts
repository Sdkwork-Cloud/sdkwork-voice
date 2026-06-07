export interface MediaAiProvenance {
    provenance?: 'uploaded' | 'generated' | 'edited' | 'imported' | 'recorded';
    provider?: string;
    model?: string;
    promptId?: string;
    generationTaskId?: string;
    sourceMediaIds?: string[];
    seed?: string;
    moderationStatus?: 'unknown' | 'pending' | 'approved' | 'rejected' | 'blocked';
    safetyLabels?: string[];
}
//# sourceMappingURL=media-ai-provenance.d.ts.map