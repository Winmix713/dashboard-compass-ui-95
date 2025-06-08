import { useState, useEffect } from 'react';

export interface FigmaSettings {
  accessToken: string;
  autoSaveTokens: boolean;
  enableVersionTracking: boolean;
  defaultExportFormat: string;
  colorExtractionEnabled: boolean;
  batchProcessingEnabled: boolean;
  shareableLinksEnabled: boolean;
}

const defaultSettings: FigmaSettings = {
  accessToken: '',
  autoSaveTokens: true,
  enableVersionTracking: true,
  defaultExportFormat: 'react',
  colorExtractionEnabled: true,
  batchProcessingEnabled: true,
  shareableLinksEnabled: true,
};

export const useFigmaSettings = () => {
  const [settings, setSettings] = useState<FigmaSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem('figma-converter-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
        setSettings(defaultSettings);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = (newSettings: Partial<FigmaSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (updatedSettings.autoSaveTokens) {
      localStorage.setItem('figma-converter-settings', JSON.stringify(updatedSettings));
    }
  };

  const getSavedToken = (): string => {
    return settings.accessToken;
  };

  const hasValidToken = (): boolean => {
    return settings.accessToken.length > 0;
  };

  const clearSettings = () => {
    localStorage.removeItem('figma-converter-settings');
    localStorage.removeItem('figma-token-last-validated');
    setSettings(defaultSettings);
  };

  return {
    settings,
    updateSettings,
    getSavedToken,
    hasValidToken,
    clearSettings,
    isLoaded,
  };
};