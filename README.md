# AI Battle Arena ⚔️

AI Battle Arena is a full-stack web app where two AI models go head-to-head on the same problem, and a third AI judges their answers scoring each one and explaining why.

🔗 **Live demo:** [ai-battle-areana.vercel.app](https://ai-battle-areana.vercel.app)

## What it does

You type in a problem or question  a coding challenge, a puzzle, anything you'd normally ask an AI to solve. Instead of getting one answer, the app runs it through two competing models at the same time, then has a separate "judge" model evaluate both solutions and pick strengths and weaknesses in each. The UI shows you both solutions plus the judge's scores and reasoning, so you can actually see which model did better and why  instead of just trusting one answer blindly.

It's essentially a live, on-demand LLM comparison arena built into a chat-style interface.

## How it works, step by step

1. **You submit a problem** through the chat UI on the frontend.
2. The frontend sends it to the backend's `POST /invoke` endpoint.
3. The backend runs a **LangGraph** workflow with two stages:
   - **Solution stage:** Mistral (`mistral-medium-latest`) and Cohere (`command-a-03-2025`) are called **in parallel**, each independently generating its own solution to the exact same problem. Neither model sees the other's answer.
   - **Judge stage:** Once both solutions are in, Gemini (`gemini-3.5-flash`) is called as an impartial judge. It's given the original problem plus both solutions, and asked to score each one from 0–10 on accuracy, correctness, clarity, and conciseness  and to explain its reasoning for each score. The judge's output is forced into a strict structured format (via Zod schema validation), so the scores and reasoning always come back in a predictable shape rather than free-form text.
4. The backend returns everything in one response: the original problem, both solutions, and the judge's scores + reasoning for each.
5. The frontend renders all of this  solutions side by side with markdown formatting, plus the judge's verdict  so you get a full breakdown of the "battle" in one view.

## Why it's built this way

- **Parallel calls, not sequential:** the two competing models are invoked with `Promise.all`, so both solutions come back as fast as the slower of the two models, not the sum of both.
- **A separate judge model** avoids letting either competitor grade its own or the other's work Gemini has no stake in the outcome, so it's used purely as an evaluator.
- **LangGraph** models this as an explicit state graph (`solution → judge`) rather than a chain of manual function calls, which makes the flow easy to extend later — e.g. adding a third competitor, a retry step, or a different judge.
- **Structured output for the judge:** rather than trusting the judge to always format its reasoning consistently, the response is validated against a schema, so the frontend can always rely on `solution_1_score`, `solution_2_score`, etc. being present and numeric.

## Frontend behavior

The React frontend (`App.jsx`) is a chat-style interface:
- Maintains the conversation as a list of messages, each holding a full battle result (problem + both solutions + judge verdict).
- Auto-scrolls to the latest result and auto-resizes the input box as you type.
- Renders each solution using `react-markdown`, so code blocks, lists, etc. in the AI responses display properly instead of as raw text.
- On load, it pings a `/health` endpoint on the backend — this is a workaround for free-tier hosting (like Render) where the server "sleeps" when idle, so this wakes it up early and shows a friendly "server was sleeping, retry in a few seconds" message if a request fails while it's spinning up.

## Backend behavior

The Express + TypeScript backend exposes a single main route:

**`POST /invoke`**
```json
// Request
{ "input": "Write a function to reverse a linked list" }

// Response
{
  "message": "Graph executed successfully",
  "success": true,
  "result": {
    "problem": "...",
    "solution_1": "...",
    "solution_2": "...",
    "judge": {
      "solution_1_score": 8,
      "solution_2_score": 7,
      "solution_1_reasoning": "...",
      "solution_2_reasoning": "..."
    }
  }
}
```
It validates that the input isn't empty before doing any model calls, and wraps the whole graph execution in error handling so a failure from any one model surfaces as a clean 500 response instead of crashing the server. Server timeouts are also bumped up to 3 minutes to accommodate slower LLM inference calls that a typical HTTP timeout would otherwise kill.

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS 4, Axios, React Markdown, Lucide React (icons)

**Backend:** Node.js, Express 5, TypeScript, LangChain + LangGraph, Zod — with model providers `@langchain/mistralai`, `@langchain/cohere`, and `@langchain/google`

## Project Structure

```
AI-Battle-areana/
├── Frontend/           # React + Vite client
│   └── src/
│       ├── App.jsx     # Chat UI — sends problems, renders battle results
│       └── main.jsx
└── backend/            # Express + LangGraph API
    └── src/
        ├── ai/
        │   ├── model.ai.ts   # Defines the Gemini, Mistral, and Cohere model clients
        │   └── graph.ai.ts   # The LangGraph flow: solution node → judge node
        ├── config/
        │   └── config.ts     # Loads API keys from environment variables
        └── app.ts            # Express app, CORS, and the /invoke route
```

## Deployment

- **Frontend:** deployed on [Vercel](https://vercel.com)
- **Backend:** designed for a Node host like Render — hence the `/health` warm-up ping from the frontend to deal with free-tier cold starts

## License

No license specified yet — all rights reserved by default.
