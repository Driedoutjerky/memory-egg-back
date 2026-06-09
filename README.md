# Nacimiento - Memory Egg Backend
> This is the backend repository for **Nacimiento - Memory Egg**.

<a href="https://github.com/Driedoutjerky/memory-egg-back/actions/workflows/backend-ci.yml"> 
  <img src="https://github.com/Driedoutjerky/memory-egg-back/actions/workflows/backend-ci.yml/badge.svg" alt="CI" /> 
</a> 
<a href="https://github.com/Driedoutjerky/memory-egg-back/stargazers"> 
  <img src="https://img.shields.io/github/stars/Driedoutjerky/memory-egg-back?style=flat-square" alt="GitHub stars" /> 
</a> 
<a href="https://memory-egg-back.onrender.com/api-docs"> 
  <img src="https://img.shields.io/badge/API%20Docs-Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black" alt="API Docs" />
</a> 

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Jest-C21325?style=flat-square&logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black" alt="Render" />
</p>

Nacimiento - Memory Egg is a gamified journaling web application where users take care of a mysterious egg by writing notebook posts, completing quests, and earning credits called **Will**.

The egg changes over time through the accumulation of memories, reflections, and daily writing. Users can spend Will on egg appearance, background themes, music, and other care-related items.

> The egg does not hatch from time.
>
> It hatches from what is remembered.

## Project Purpose

This project is not only about a game.

The egg represents something forgotten and fragile that the user chooses to care for. The application encourages users to spend small moments of their busy lives writing, reflecting, and recording memories. Through this habit, the egg gradually changes, symbolizing the user's own process of remembering and taking care of themselves.

## Related Repositories

* Frontend: [memory-egg-front](https://github.com/Driedoutjerky/memory-egg-front)
* Backend: [memory-egg-back](https://github.com/Driedoutjerky/memory-egg-back)

## Deployed Backend

* Backend API Base URL: `https://memory-egg-back.onrender.com`
* Swagger / OpenAPI Documentation: `https://memory-egg-back.onrender.com/api-docs`

## Backend Responsibilities

This backend handles:

* User registration and login
* JWT-based authentication
* Protected API routes
* Egg state and equipped items
* Notebook post creation, retrieval, and deletion
* Will reward calculation
* Daily quest assignment and reward claiming
* Shop and inventory logic
* SQLite database persistence
* API validation and security checks
* Swagger / OpenAPI documentation
* Unit and API-level tests
* GitHub Actions continuous integration

## Technology Stack

| Area              | Technology                | Reason                                                              |
| ----------------- | ------------------------- | ------------------------------------------------------------------- |
| Runtime           | Node.js                   | JavaScript runtime for backend development                          |
| Server Framework  | Express                   | Lightweight framework for REST API development                      |
| Database          | SQLite                    | Chosen for lightweight implementation and simple project deployment |
| Authentication    | JWT                       | Token-based authentication for protected routes                     |
| Password Security | bcrypt                    | Passwords are stored as hashes, not plaintext                       |
| API Documentation | Swagger UI + OpenAPI YAML | Documents API contract and request/response schemas                 |
| Testing           | Jest + Supertest          | Unit tests and API-level tests                                      |
| CI                | GitHub Actions            | Automatically runs tests on push                                    |

## Project Structure

```text
src/
  controllers/
  routes/
  models/
  services/
  middleware/
  validators/
  tests/
  app.js
  server.js

docs/
  api/
    openapi.yaml
```

## Environment Variables

Create a `.env` file using .env.example

```bash
cp .env.example .env
```

On Windows PowerShell, use:
```PowerShell
Copy-Item .env.example .env
```
Then open .env and replace the placeholder values with your local configuration.
To generate a strong JWT secret, you can run:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Never commit the real `.env` file to GitHub.

## Setup and Run

### 1. Clone the repository

```bash
git clone https://github.com/Driedoutjerky/memory-egg-back.git
cd memory-egg-back
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env`

Create a `.env` file using the environment variable format above.

### 4. Start the server

```bash
npm start
```

The backend runs on:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

API documentation:

```text
http://localhost:5000/api-docs
```

## API Documentation

The OpenAPI specification file is located at:

```text
docs/api/openapi.yaml
```

The Swagger UI documentation is served at `/api-docs`

Deployed documentation:

[Hosted by Render : https://memory-egg-back.onrender.com/api-docs](https://memory-egg-back.onrender.com/api-docs)

## Main API Endpoints

| Method | Path                     | Purpose                                           | Auth Required |
| ------ | ------------------------ | ------------------------------------------------- | ------------- |
| GET    | `/api/health`            | Check backend server status                       | No            |
| POST   | `/api/auth/register`     | Register new user and create starter egg          | No            |
| POST   | `/api/auth/login`        | Login user                                        | No            |
| GET    | `/api/auth/me`           | Get current user profile, egg, and equipped items | Yes           |
| GET    | `/api/auth/me/inventory` | View owned items                                  | Yes           |
| PATCH  | `/api/egg/equip`         | Equip background, music, or cosmetic item         | Yes           |
| POST   | `/api/posts`             | Create notebook post                              | Yes           |
| GET    | `/api/posts/all`         | Get all posts created by current user             | Yes           |
| GET    | `/api/posts/:id`         | Get one post                                      | Yes           |
| DELETE | `/api/posts/:id`         | Delete own post                                   | Yes           |
| GET    | `/api/quests/today`      | Get today's assigned quests                       | Yes           |
| POST   | `/api/quests/:id/claim`  | Claim completed quest reward                      | Yes           |
| GET    | `/api/shop/items`        | Browse shop items                                 | Yes           |
| POST   | `/api/shop/purchase`     | Buy item with Will                                | Yes           |


## Testing

Run all tests with:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

The test suite includes:

* Unit tests for backend modules
* API tests for authenticated routes
* API tests for successful main flows
* API tests for error cases such as `400`, `401`, `404`, and `409`

## Continuous Integration

This repository uses GitHub Actions to run the test suite automatically on push.

The CI workflow helps verify that the backend remains stable after changes and that tests pass before evaluation.

## AI Usage Disclosure

AI tools were used to help generate example mock data for development and testing. AI tools were not used as a replacement for understanding the submitted implementation.

## License

This project is under the Apache-2.0 license.
