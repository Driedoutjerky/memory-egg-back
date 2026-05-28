// =============================================================================
// app.js — Application entry point
// -----------------------------------------------------------------------------
// This file is responsible for wiring everything together:
//   - Loading middleware (JSON parsing, static files)
//   - Mounting the routers
//   - Setting up Swagger documentation
//   - Initializing the database
//   - Starting the HTTP server
//
// app.js does not contain business logic. The business logic lives in the
// controllers; the database logic lives in the models. Keeping app.js small
// makes the project easier to navigate.
// =============================================================================

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const cors = require("cors"); //Cross_origin Resource Sharing. Allows frontend to call backend on localhost with different ports.
require("dotenv").config(); //Loads environment variables from .env file.

// const authRouter = require("./routes/authRoutes");
const eggRouter = require("./routes/eggRoutes");
const postsRouter = require("./routes/postRoutes");
// const questRouter = require("./routes/questRoutes");
const shopRouter = require("./routes/shopRoutes");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => { //Endpoint route used to check the backend server run status.
  res.status(200).json({
    status: "ok",
    message: "Memory Egg backend is running"
  });
});

app.use(express.static("public"));

// app.use("api/auth", authRouter);
app.use("/api/egg", eggRouter);
app.use("/api/posts", postsRouter);
// app.use("/api/quests", questRouter);
app.use("/api/shop", shopRouter);


const swaggerDocument = YAML.load("./docs/api/openapi.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use( //Enable CORS for frontend
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);

module.exports = app;