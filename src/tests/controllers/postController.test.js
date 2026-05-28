// =============================================================================
// Post Controller Unit Tests
// -----------------------------------------------------------------------------
// Purpose:
//   Verify that postController validates request data, calls postModel with the
//   expected arguments, and returns the correct HTTP status codes and JSON bodies.
//
// Scope:
//   Covers listing posts, reading a post by id, and creating a post.
//   Mocks postModel, so these tests do not use the real database.
// =============================================================================

// Replace the real post model with Jest mock functions.
jest.mock("../../models/postModel");

// Load the controller under test after the model has been mocked.
const postController = require("../../controllers/postController");
// Load the mocked model so each test can define database-like behavior.
const postModel = require("../../models/postModel");

// Build a minimal Express response object for controller assertions.
function mockResponse() {
  return {
    // Mock res.status and keep it chainable.
    status: jest.fn().mockReturnThis(),
    // Mock res.json to capture response payloads.
    json: jest.fn(),
    // Mock res.send in case a controller path sends an empty body.
    send: jest.fn()
  };
}

// Create a complete post fixture while allowing each test to override fields.
function makePost(overrides = {}) {
  return {
    post_id: 1,
    user_id: 1,
    title: "Test Post",
    content: "Test content",
    image_url: null,
    tag: "general",
    visibility: "public",
    word_count: 10,
    will_reward: 5,
    created_at: "2026-05-28",
    updated_at: "2026-05-28",
    ...overrides
  };
}

// Group tests for retrieving every post.
describe("postController.getAll", () => {
  // Clear mock history and behavior before each test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm the controller returns every post from the model.
  test("returns all posts", async () => {
    // Arrange a model result containing one post fixture.
    const posts = [makePost()];

    // Make the mocked model resolve with the arranged posts.
    postModel.getAll.mockResolvedValue(posts);

    // getAll does not require request input in this test.
    const req = {};
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await postController.getAll(req, res);

    // Assert that the controller delegates to the model.
    expect(postModel.getAll).toHaveBeenCalled();
    // Assert that successful listing returns HTTP 200.
    expect(res.status).toHaveBeenCalledWith(200);
    // Assert that the response body is the model result.
    expect(res.json).toHaveBeenCalledWith(posts);
  });
});

// Group tests for retrieving one post by id.
describe("postController.getById", () => {
  // Clear mock state before each getById test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm a found post is returned successfully.
  test("returns 200 when post exists", async () => {
    // Arrange a post fixture with the id requested by the route.
    const post = makePost({ post_id: 10 });

    // Make the mocked model resolve with the post.
    postModel.findById.mockResolvedValue(post);

    // Provide the route parameter as Express would pass it.
    const req = { params: { id: "10" } };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await postController.getById(req, res);

    // Assert that the string route id was converted to a number for the model.
    expect(postModel.findById).toHaveBeenCalledWith(10);
    // Assert that a found post returns HTTP 200.
    expect(res.status).toHaveBeenCalledWith(200);
    // Assert that the response body is the found post.
    expect(res.json).toHaveBeenCalledWith(post);
  });

  // Confirm a missing post produces a not-found response.
  test("returns 404 when post does not exist", async () => {
    // Arrange a missing model result.
    postModel.findById.mockResolvedValue(undefined);

    // Use a route id that does not map to a post.
    const req = { params: { id: "999" } };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await postController.getById(req, res);

    // Assert that a missing post returns HTTP 404.
    expect(res.status).toHaveBeenCalledWith(404);
    // Assert that the response body contains the expected error message.
    expect(res.json).toHaveBeenCalledWith({
      error: "Post not found"
    });
  });
});

// Group tests for creating a new post.
describe("postController.create", () => {
  // Clear mock state before each create test.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Confirm required-field validation rejects incomplete request bodies.
  test("returns 400 when required fields are missing", async () => {
    // Arrange a request body that intentionally omits required post fields.
    const req = {
      body: {
        user_id: 1,
        title: "Incomplete Post"
      }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await postController.create(req, res);

    // Assert that validation failure returns HTTP 400.
    expect(res.status).toHaveBeenCalledWith(400);
    // Assert that the validation error body is returned.
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing required fields"
    });
    // Assert that invalid input prevents database creation.
    expect(postModel.create).not.toHaveBeenCalled();
  });

  // Confirm valid request data is passed to the model and returned with HTTP 201.
  test("returns 201 when post is created", async () => {
    // Arrange the post returned by the mocked create call.
    const newPost = makePost({ post_id: 20 });

    // Make the mocked model resolve with the created post.
    postModel.create.mockResolvedValue(newPost);

    // Provide a complete request body for post creation.
    const req = {
      body: {
        user_id: 1,
        title: "Test Post",
        content: "Test content",
        image_url: null,
        tag: "general",
        visibility: "public",
        word_count: 10,
        will_reward: 5,
        created_at: "2026-05-28",
        updated_at: "2026-05-28"
      }
    };
    // Create a mock response object for assertions.
    const res = mockResponse();

    // Execute the controller handler.
    await postController.create(req, res);

    // Assert that the controller passes the request body directly to the model.
    expect(postModel.create).toHaveBeenCalledWith(req.body);
    // Assert that successful creation returns HTTP 201.
    expect(res.status).toHaveBeenCalledWith(201);
    // Assert that the response body is the created post.
    expect(res.json).toHaveBeenCalledWith(newPost);
  });
});
