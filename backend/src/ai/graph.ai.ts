import { StateSchema, type GraphNode, StateGraph, START, END } from "@langchain/langgraph";
import z from "zod";
import { mistralModel, cohereModel, geminiModel } from "./model.ai.js";
import { createAgent, HumanMessage, providerStrategy } from "langchain";

const state = new StateSchema({
  problem: z.string().default(""),
  solution_1: z.string().default(""),
  solution_2: z.string().default(""),
  judge: z.object({
    solution_1_score: z.number().default(0),
    solution_2_score: z.number().default(0),
    solution_1_reasoning: z.string().default(""),
    solution_2_reasoning: z.string().default(""),
  })
});

const solutionNode: GraphNode<typeof state> = async (state) => {
  const [mistralResponse, cohereResponse] = await Promise.all([
    mistralModel.invoke(state.problem),
    cohereModel.invoke(state.problem)
  ]);

  const sol1 = typeof mistralResponse.content === "string"
    ? mistralResponse.content
    : (mistralResponse.text || JSON.stringify(mistralResponse.content) || "");

  const sol2 = typeof cohereResponse.content === "string"
    ? cohereResponse.content
    : (cohereResponse.text || JSON.stringify(cohereResponse.content) || "");

  return {
    solution_1: sol1,
    solution_2: sol2
  };
};

const judgeAgent = createAgent({
  model: geminiModel,
  responseFormat: providerStrategy(
    z.object({
      solution_1_score: z.number().min(0).max(10),
      solution_2_score: z.number().min(0).max(10),
      solution_1_reasoning: z.string(),
      solution_2_reasoning: z.string(),
    })
  ),
  systemPrompt: `You are an expert impartial judge evaluating two AI-generated solutions.
Evaluate each solution based on accuracy, correctness, clarity, and conciseness.
Provide a numerical score from 0 to 10 and clear reasoning for each score.`
});

const judgeNode: GraphNode<typeof state> = async (state) => {
  const { problem, solution_1, solution_2 } = state;

  const judgeResult = await judgeAgent.invoke({
    messages: [
      new HumanMessage(`Problem: ${problem}\n\nSolution 1:\n${solution_1}\n\nSolution 2:\n${solution_2}`)
    ]
  });

  const structured = judgeResult?.structuredResponse || {};

  return {
    judge: {
      solution_1_score: Number(structured.solution_1_score) || 0,
      solution_2_score: Number(structured.solution_2_score) || 0,
      solution_1_reasoning: structured.solution_1_reasoning || "Reasoning not provided.",
      solution_2_reasoning: structured.solution_2_reasoning || "Reasoning not provided."
    }
  };
};

const graph = new StateGraph(state)
  .addNode("solution", solutionNode)
  .addNode("judge_node", judgeNode)
  .addEdge(START, "solution")
  .addEdge("solution", "judge_node")
  .addEdge("judge_node", END)
  .compile();

export default async function runGraph(problem: string) {
  const result = await graph.invoke({
    problem: problem
  });

  return result;
}