import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Configure timeouts for long LLM inference requests
server.timeout = 180000; // 3 minutes
server.keepAliveTimeout = 180000;
server.headersTimeout = 185000;