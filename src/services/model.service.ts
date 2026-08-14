import { ChatGoogle } from "@langchain/google";
import { ChatMistralAI } from "@langchain/mistralai";
import configs from "../config/config.js";

export const geminiModel = new ChatGoogle({
  model:"gemini-flash-latest",
  apiKey:configs.GEMINI_API_KEY
});

export const mistralModel= new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: configs.MISTRAL_API_KEY
})

export const cohereModel= new ChatMistralAI({
  model: "command-a-03-2025",
  apiKey: configs.COHERE_API_KEY
})







