import { FileAudio2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { CapabilityUnavailablePage } from "@sdkwork/ui-mobile-react";

export function VoiceSummaryApp() {
  const { t } = useTranslation("voice_summary");
  const navigate = useNavigate();

  return (
    <CapabilityUnavailablePage
      icon={FileAudio2}
      message={t("unavailable")}
      onBack={() => navigate(-1)}
      title={t("title")}
    />
  );
}
