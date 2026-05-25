const app = require("./app");
const PORT = process.env.PORT || 8080;
const { initDb } = require("./db");

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Nacimiento API running on http://localhost:${PORT}`);
    console.log(`Search frontend: http://localhost:${PORT}/`);
    //console.log(`API docs: http://localhost:${PORT}/api-docs`);
  });
}

start();