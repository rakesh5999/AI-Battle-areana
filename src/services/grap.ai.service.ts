import { HumanMessage } from "@langchain/core/messages";
import { StateSchema, MessagesValue, type GraphNode, ReducedValue, StateGraph, START, END } from "@langchain/langgraph";
import { mistralModel, cohereModel, geminiModel } from "./model.service.js";
import { createAgent,providerStrategy } from "langchain";
import z from "zod";

const State = new StateSchema({
  messages: MessagesValue,
  solution_1: new ReducedValue(z.string().default(""), {
    reducer: (current, next) => {
      return next
    }
  }),
  solution_2: new ReducedValue(z.string().default(""), {
    reducer: (current, next) => {
      return next
    }
  }),
  judge_recommendation: new ReducedValue(z.object().default({
    solution_1_score: 0,
    solution_2_score: 0,
  }),
    {
      reducer: (current, next) => {
        return next
      }
    }

  )
});


const solutionNode: GraphNode<typeof State> = async (state: typeof State) => {

  const [mistral_solution, cohere_solution] = await Promise.all([
    mistralModel.invoke(state.messages[0].text),
    cohereModel.invoke(state.messages[0].text)
  ])

  return {
    solution_1: mistral_solution.text,
    solution_2: cohere_solution.text
  }

}

const JudgeSchema = z.object({
  solution_1_score: z.number().min(0).max(10),
  solution_2_score: z.number().min(0).max(10),
});

const judgeNode: GraphNode<typeof State> = async (state) => {
  const { solution_1, solution_2 } = state;

  const judge = createAgent({
    model: geminiModel,
    tools: [],
    responseFormat: providerStrategy(JudgeSchema),
  });

  const judgeResponse = await judge.invoke({
    messages: [
      new HumanMessage(`
You are judging two AI solutions.

Solution 1:
${solution_1}

Solution 2:
${solution_2}

Score each solution from 0 to 10 based on:
- Correctness
- Relevance
- Completeness
- Clarity

Return only the structured scores.
      `)
    ]
  });

  console.log("FULL JUDGE RESPONSE:", judgeResponse);

  const result = judgeResponse.structuredResponse;

  console.log("STRUCTURED RESULT:", result);

  return {
    judge_recommendation: result
  };
};

const graph = new StateGraph(State)
  .addNode("solution", solutionNode)
  .addNode("judge", judgeNode)
  .addEdge(START, "solution")
  .addEdge("solution", "judge")
  .addEdge("judge", END)
  .compile()


export default async function (userMessages: string) {
  const result = await graph.invoke({
    messages: [
      new HumanMessage(userMessages)
    ]
  })

  console.log(result);

  return (await result).messages

}