export interface VoiceSummaryRecord {
  id: string;
  title: string;
  date: string;
  duration: string;
  summary: string;
  keywords: string[];
}

export class VoiceSummaryCapabilityUnavailableError extends Error {
  constructor() {
    super("Voice summary is unavailable because the Voice owner SDK is not composed.");
    this.name = "VoiceSummaryCapabilityUnavailableError";
  }
}

export class VoiceSummaryService {
  static async getSummaries(): Promise<VoiceSummaryRecord[]> {
    throw new VoiceSummaryCapabilityUnavailableError();
  }

  static async addSummary(
    _summary: Omit<VoiceSummaryRecord, "id">,
  ): Promise<VoiceSummaryRecord> {
    throw new VoiceSummaryCapabilityUnavailableError();
  }
}
