
import { Personality, Settings } from "../types";
import { defaultPersonality, defaultSettings } from "../constants";

/**
 * Parse personality data from database response
 */
export const parsePersonalityData = (behavior: Record<string, unknown>): Personality => {
  return {
    tone: typeof behavior.tone === 'string' ? behavior.tone : defaultPersonality.tone,
    style: typeof behavior.style === 'string' ? behavior.style : defaultPersonality.style,
    language: typeof behavior.language === 'string' ? behavior.language : defaultPersonality.language,
    instructions: typeof behavior.instructions === 'string' ? behavior.instructions : defaultPersonality.instructions,
    greeting: typeof behavior.greeting === 'string' ? behavior.greeting : defaultPersonality.greeting,
    useEmojis: typeof behavior.useEmojis === 'boolean' ? behavior.useEmojis : defaultPersonality.useEmojis,
    askQuestions: typeof behavior.askQuestions === 'boolean' ? behavior.askQuestions : defaultPersonality.askQuestions,
    suggestSolutions: typeof behavior.suggestSolutions === 'boolean' ? behavior.suggestSolutions : defaultPersonality.suggestSolutions,
    usePersonality: typeof behavior.usePersonality === 'boolean' ? behavior.usePersonality : defaultPersonality.usePersonality
  };
};

/**
 * Parse settings data from database response
 */
export const parseSettingsData = (settings: Record<string, unknown>): Settings => {
  return {
    model: typeof settings.model === 'string' ? settings.model : defaultSettings.model,
    temperature: typeof settings.temperature === 'number' ? settings.temperature : defaultSettings.temperature,
    maxTokens: typeof settings.maxTokens === 'number' ? settings.maxTokens : defaultSettings.maxTokens,
    includeReferences: typeof settings.includeReferences === 'boolean' ? settings.includeReferences : defaultSettings.includeReferences
  };
};

/**
 * Determine AI provider based on model name
 */
export const determineAiProvider = (model?: string): "claude" | "openai" => {
  if (!model) {
    return "claude"; // Default to Claude
  }
  
  return model.includes('claude') ? "claude" : "openai";
};
