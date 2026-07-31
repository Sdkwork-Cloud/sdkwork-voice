import assert from "node:assert/strict";
import test from "node:test";

import {
  VoiceSummaryCapabilityUnavailableError,
  VoiceSummaryService,
} from "./VoiceSummaryService";

test("voice summary operations fail closed until the owner SDK is composed", async () => {
  await assert.rejects(
    VoiceSummaryService.getSummaries(),
    VoiceSummaryCapabilityUnavailableError,
  );
  await assert.rejects(
    VoiceSummaryService.addSummary({
      date: "now",
      duration: "0",
      keywords: [],
      summary: "test",
      title: "test",
    }),
    VoiceSummaryCapabilityUnavailableError,
  );
});
