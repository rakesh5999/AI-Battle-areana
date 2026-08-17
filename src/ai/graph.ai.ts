import { StateSchema, MessagesValue, type GraphNode, StateGraph, START, END } from "@langchain/langgraph";
import z from "zod";
import { mistralModel, cohereModel, geminiModel } from "./model.ai.js";
import { createAgent, HumanMessage, providerStrategy } from "langchain";
import { start } from "node:repl";

const state =new StateSchema({
  problem: z.string().default(""),
  solution_1: z.string().default(""),
  solution_2: z.string().default(""),
  judge:z.object({
    solution_1_score: z.number().default(0),
    solution_2_score: z.number().default(0),
    solution_1_reasoning: z.string().default(""),
    solution_2_reasoning: z.string().default(""),
  })
  
})

const solutionNode: GraphNode <typeof state> = async (state)=>{

  const [mistralResponse, cohereResponse]= await Promise.all([
    mistralModel.invoke(state.problem),
    cohereModel.invoke(state.problem)
  ])

  return{
    solution_1:mistralResponse.text,
    solution_2:cohereResponse.text
  }


}

const judgeNode: GraphNode <typeof state> = async (state)=>{
  
  const {problem, solution_1, solution_2}= state

  const judge= createAgent({
    model:geminiModel,
    responseFormat: providerStrategy(z.object({
      solution_1_score: z.number().min(0).max(10),
    solution_2_score: z.number().min(0).max(10),
    solution_1_reasoning: z.string(),
    solution_2_reasoning: z.string(),
    })),
    systemPrompt: `You are a helpful assistant that judges two solutions to a problem. You will be given a problem and two solutions. Your task is to evaluate the solutions based on their correctness, clarity, and effectiveness. Provide a score for each solution on a scale of 0 to 10, where 0 is the worst and 10 is the best. Additionally, provide reasoning for your scores.`
  })

  const judgeResponse = judge.invoke({
    messages: [
      new HumanMessage(`
        problem: ${problem}
        solution_1: ${solution_1}
        solution_2: ${solution_2}
        please evaluate the solution and provide scores and resaoning.
        `)
    ]
  })

  const{
    solution_1_score,
    solution_2_score,
    solution_1_reasoning,
    solution_2_reasoning
  } = (await judgeResponse).structuredResponse


  return{
    judge:{
       solution_1_score,
    solution_2_score,
    solution_1_reasoning,
    solution_2_reasoning
    }
  }

}

const graph = new StateGraph(state)
      .addNode("solution", solutionNode)
      .addNode("judge_node", judgeNode)
      .addEdge(START,"solution")
      .addEdge("solution", "judge_node")
      .addEdge("judge_node", END)
      .compile()

export default async function (problem: string){

  const result = await graph.invoke({
    problem: problem
  })

    return result
}