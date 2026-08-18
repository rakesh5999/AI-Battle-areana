import { ChatCohere } from "@langchain/cohere";
import { ChatGoogle } from "@langchain/google";
import { ChatMistralAI } from "@langchain/mistralai";
import config from "../config/config.js";

export const geminiModel = new ChatGoogle({
   model: "gemini-3.5-flash",
   apiKey: config.GEMINI_API_KEY,
   temperature: 0,
   maxRetries: 1
})

export const mistralModel = new ChatMistralAI({
   model: "mistral-medium-latest",
   apiKey: config.MISTRAL_API_KEY,
   maxRetries: 1
})

export const cohereModel = new ChatCohere({
   model: "command-a-03-2025",
   apiKey: config.COHERE_API_KEY,
   maxRetries: 1
})