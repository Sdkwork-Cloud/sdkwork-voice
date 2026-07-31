import { AudioLines } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { CapabilityUnavailablePage } from "@sdkwork/ui-mobile-react";

export function AIVoiceSynthPage() {
  const { t } = useTranslation("voice_synth");
  const navigate = useNavigate();

  return (
    <CapabilityUnavailablePage
      icon={AudioLines}
      message={t("unavailable")}
      onBack={() => navigate(-1)}
      title={t("title")}
    />
  );
}
