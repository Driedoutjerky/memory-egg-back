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

const { initDb } = require("./db");

// const authRouter = require("./routes/authRoutes");
const eggRouter = require("./routes/eggRoutes");
const postsRouter = require("./routes/postRoutes");
// const questRouter = require("./routes/questRoutes");
const shopRouter = require("./routes/shopRoutes");

const app = express();
const PORT = 8080;

// Built-in middleware: parses JSON request bodies and makes them available
// as req.body in the controllers (used by POST and PUT endpoints).
app.use(express.json());

// Serves static files (HTML, CSS, JS, images) from the public/ folder.
// Any file inside public/ becomes accessible by its filename:
//   public/index.html  →  http://localhost:8080/
//   public/styles.css  →  http://localhost:8080/styles.css
//   public/manage.html →  http://localhost:8080/manage.html
app.use(express.static("public"));

// All routes defined in routes/flights.js are mounted under /flights.
// So a router definition of `router.get("/:id", ...)` becomes GET /flights/:id.
// app.use("api/auth", authRouter);
app.use("/api/egg", eggRouter);
app.use("/api/posts", postsRouter);
// app.use("/api/quests", questRouter);
app.use("/api/shop", shopRouter);

// Swagger UI: interactive API documentation generated from the YAML spec.
// Available at http://localhost:8080/api-docs
const swaggerDocument = YAML.load("./docs/api/openapi.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Startup sequence: initialize the database first, then start the server.
// We use an async function because initDb() returns a Promise — the server
// must wait for the database to be ready before accepting requests.
async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Nacimiento API running on http://localhost:${PORT}`);
    console.log(`Search frontend: http://localhost:${PORT}/`);
    console.log(`API docs: http://localhost:${PORT}/api-docs`);
  });
}

start();
