// UI helper utility functions

export const getQEIColor = (qei) => {
  if (qei >= 85) return 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 text-yellow-200'; // Gold - Elite (achievable threshold)
  if (qei >= 75) return 'bg-gradient-to-r from-gray-300/30 to-gray-400/30 text-gray-200'; // Silver - Excellent
  if (qei >= 65) return 'bg-gradient-to-r from-amber-600/30 to-amber-700/30 text-amber-200'; // Bronze - Very Good
  if (qei >= 55) return 'bg-gradient-to-r from-green-500/30 to-green-600/30 text-green-200'; // Green - Good
  if (qei >= 45) return 'bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-blue-200'; // Blue - Average
  return 'bg-white/10 text-white'; // Below Average
};

export const getCurrentPresetDescription = (currentPreset, philosophyPresets) => {
  console.log('Current preset:', currentPreset);
  
  if (currentPreset === 'custom') {
    return "Custom settings - adjust sliders to match your QB evaluation philosophy";
  }
  
  const preset = philosophyPresets[currentPreset];
  if (preset && preset.description) {
    return preset.description;
  }
  
  return "Custom settings";
}; 