const express = require("express");
const cors = require("cors"); //Cross_origin Resource Sharing. Allows frontend to call backend on localhost with different ports.
require("dotenv").config(); //Loads environment variables from .env file.

const app = express();

app.use( //Enable CORS for frontend
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong on the server"
  });
});

app.get("/api/health", (req, res) => { //Endpoint route used to check the backend server run status.
  res.status(200).json({
    status: "ok",
    message: "Memory Egg backend is running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});