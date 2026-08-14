import express from "express";

const app = express();

app.get('/health',(req,res) => {
  res.status(200).json({
    message:"ok"
  })
})

export default app;