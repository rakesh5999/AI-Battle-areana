import express from "express";
import cors from "cors";
import runGraph from "./ai/graph.ai.js";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/invoke", async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== "string" || !input.trim()) {
      return res.status(400).json({
        message: "Input problem is required",
        success: false,
        error: "Input problem cannot be empty"
      });
    }

    const result = await runGraph(input.trim());

    res.status(200).json({
      message: "Graph executed successfully",
      success: true,
      result
    });
  } catch (error: any) {
    console.error("Error executing graph:", error);
    res.status(500).json({
      message: "Failed to execute graph",
      success: false,
      error: error?.message || "Internal server error"
    });
  }
});

export default app;