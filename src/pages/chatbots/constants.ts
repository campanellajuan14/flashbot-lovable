
// Default values for new chatbots

export const defaultPersonality = {
  tone: "professional",
  style: "concise",
  language: "english",
  useEmojis: false,
  askQuestions: true,
  suggestSolutions: true,
  instructions: "",
  greeting: "Hello! How can I help you today?", // Default greeting in English
  usePersonality: false // Personality traits disabled by default
};

export const defaultSettings = {
  model: "claude-3-5-sonnet-20241022",
  temperature: 0.7,
  maxTokens: 500,
  includeReferences: true
};
