import express from "express";
import useGraph from "./services/grap.ai.service.js"
const app = express();

app.get('/health',(req,res) => {
  res.status(200).json({
    message:"ok"
  })
})

app.post("/use-graph",async (req,res) => {
  await useGraph("What is the Capital of france")
})

export default app;