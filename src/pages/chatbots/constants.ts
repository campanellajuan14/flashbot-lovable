
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
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "Rápido y económico" },
    { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", description: "Equilibrio entre velocidad y capacidad" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "El más potente" }
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o", description: "El más recomendado" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Potente y rápido" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "El más rápido" }
  ]
};
