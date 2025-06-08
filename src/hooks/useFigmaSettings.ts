
import { useState, useEffect } from "react";

interface FigmaSettings {
  token: string;
  apiUrl: string;
  exportFormat: string;
}

export function useFigmaSettings() {
  const [settings, setSettings] = useState<FigmaSettings>({
    token: "",
    apiUrl: "https://api.figma.com/v1",
    exportFormat: "react"
  });

  const hasValidToken = () => {
    return settings.token && settings.token.length > 0;
  };

  const updateSettings = (newSettings: Partial<FigmaSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings,
    hasValidToken
  };
}
