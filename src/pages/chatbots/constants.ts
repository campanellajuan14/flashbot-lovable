
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

// Add available AI models
export const availableModels = {
  claude: [
    { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "🚀 Smartest model available", cost: "$$$" },
    { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "⚡ Fastest model for quick responses", cost: "$$" },
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet v2", description: "✨ Previous version, very capable", cost: "$$" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "🧠 Powerful for complex tasks", cost: "$$$" },
    { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", description: "⚖️ Balance of intelligence and speed", cost: "$$" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "🔋 Fast and efficient", cost: "$" }
  ],
  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Most powerful OpenAI model",
      cost: "Premium"
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini", 
      description: "Balance of performance and cost",
      cost: "Standard"
    },
    {
      id: "gpt-3.5-turbo-1106",
      name: "GPT-3.5 Turbo",
      description: "Fast and cost-effective",
      cost: "Basic"
    }
  ]
};
