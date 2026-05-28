// Tests request validation, response handling, and service/model calls using mocks.

// Mock the model to keep controller tests isolated from SQL behavior.
jest.mock("../../models/postModel");

const postController = require("../../controllers/postController");
const postModel = require("../../models/postModel");

// Minimal Express response double used to verify controller output.
function mockResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn()
  };
}

// Factory creates complete post data while each test overrides only what matters.
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

describe("postController.getAll", () => {
  beforeEach(() => {
    // Reset mocks so tests do not share call history or configured results.
    jest.clearAllMocks();
  });

  test("returns 200 with all posts", async () => {
    const posts = [makePost()];
    postModel.getAll.mockResolvedValue(posts);
    const res = mockResponse();

    await postController.getAll({}, res);

    expect(postModel.getAll).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(posts);
  });
});

describe("postController.getById", () => {
  beforeEach(() => {
    // Reset mocks so tests do not share call history or configured results.
    jest.clearAllMocks();
  });

  test("returns 200 when post exists", async () => {
    // Arrange
    const post = makePost({ post_id: 10 });
    postModel.findById.mockResolvedValue(post);
    const req = { params: { id: "10" } };
    const res = mockResponse();

    // Act
    await postController.getById(req, res);

    // Assert
    expect(postModel.findById).toHaveBeenCalledWith(10);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(post);
  });

  test("returns 404 when post does not exist", async () => {
    postModel.findById.mockResolvedValue(undefined);
    const req = { params: { id: "999" } };
    const res = mockResponse();

    await postController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "Post not found"
    });
  });
});

describe("postController.create", () => {
  beforeEach(() => {
    // Reset mocks so tests do not share call history or configured results.
    jest.clearAllMocks();
  });

  test("returns 400 when required fields are missing", async () => {
    // Arrange
    const req = {
      body: {
        user_id: 1,
        title: "Incomplete Post"
      }
    };
    const res = mockResponse();

    // Act
    await postController.create(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Missing required fields"
    });
    expect(postModel.create).not.toHaveBeenCalled();
  });

  test("returns 201 when post is created", async () => {
    // Arrange
    const newPost = makePost({ post_id: 20 });
    postModel.create.mockResolvedValue(newPost);
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
    const res = mockResponse();

    // Act
    await postController.create(req, res);

    // Assert
    expect(postModel.create).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(newPost);
  });
});
