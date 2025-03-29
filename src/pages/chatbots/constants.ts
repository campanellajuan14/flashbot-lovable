
import { Personality, Settings } from "./types";

export const defaultPersonality: Personality = {
  tone: "professional",
  style: "concise",
  language: "english",
  instructions: "",
  greeting: "¡Hola! Soy un asistente virtual. ¿En qué puedo ayudarte hoy?"
};

export const defaultSettings: Settings = {
  model: "claude-3-haiku-20240307",
  temperature: 0.7,
  maxTokens: 1000,
  includeReferences: true
};

export const availableModels = {
  claude: [
    { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "Our smartest model yet" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Our fastest model" },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet v2", description: "Previous version of our smartest model" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Powerful model for complex tasks" },
    { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", description: "Balance of intelligence and speed" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "Fast and efficient" }
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o", description: "Most recommended" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Powerful and fast" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fastest option" }
  ]
};
