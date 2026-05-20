# Nacimiento - Memory Egg
> This is the backend repo.

Nacimiento - Memory Egg is a gamified journaling web application where users take care of a mysterious egg by writing blog posts, completing quests, and earning credits called **Will**.

The egg changes over time through the accumulation of memories, reflections, and daily writing. Users can spend Will on egg appearance, background themes, music, and other care-related items.

> The egg does not hatch from time.  
> It hatches from what is remembered.

## Project Purpose

This project is not only about a game. 
The egg represents something forgotten and fragile that the user chooses to care for.

The application encourages users to spend small moments of their busy lives writing, reflecting, and recording memories. Through this habit, the egg gradually changes, symbolizing the user's own process of remembering and taking care of themselves.

## Backend Repository

Backend repository for **Nacimiento - Memory Egg**, a gamified journaling web application where users take care of a mysterious egg by writing notebook posts, completing quests, and earning credits called Will.

The backend REST API is managed in a separate repository.

## Related Repositories

- Frontend: `memory-egg-front`
- Backend: `memory-egg-back`

## Backend Responsibilities:

This backend handles:

- User registration and login
- Authentication and protected routes
- Egg state and progression
- Notebook post creation
- Will reward calculation
- Daily quest assignment and claiming
- Shop and inventory logic
- Database persistence
- API validation and security checks
- Swagger/OpenAPI documentation
- Unit and API tests

## Planned Tech Stack

- Node.js
- Express
- PostgreSQL or SQLite
- bcrypt
- JWT or session-based authentication
- Swagger/OpenAPI
- Jest
- Supertest
- GitHub Actions

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
  server.js

docs/
  api/
