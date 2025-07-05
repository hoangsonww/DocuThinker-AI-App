const { registerUser } = require("../controllers/controllers");
const { createUser, firestore } = require("../services/services");
const { sendSuccessResponse, sendErrorResponse } = require("../views/views");

jest.mock("../services/services", () => ({
  createUser: jest.fn(),
  firestore: {
    collection: jest.fn(),
  },
}));
jest.mock("../views/views", () => ({
  sendSuccessResponse: jest.fn(),
  sendErrorResponse: jest.fn(),
}));

describe("registerUser", () => {
  let req, res, fakeCollection, fakeDoc;

  beforeEach(() => {
    req = { body: { email: "a@b.com", password: "pass123" } };
    res = {};
    fakeDoc = { set: jest.fn().mockResolvedValue() };
    fakeCollection = { doc: jest.fn().mockReturnValue(fakeDoc) };
    firestore.collection.mockReturnValue(fakeCollection);
    createUser.mockResolvedValue({ uid: "USER_ID" });
    sendSuccessResponse.mockClear();
    sendErrorResponse.mockClear();
  });

  it("calls createUser and writes to Firestore, then sends success", async () => {
    await registerUser(req, res);
    expect(createUser).toHaveBeenCalledWith("a@b.com", "pass123");
    expect(firestore.collection).toHaveBeenCalledWith("users");
    expect(fakeDoc.set).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "a@b.com",
        documents: [],
        createdAt: expect.any(Date),
      }),
    );
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      201,
      "User registered successfully",
      { userId: "USER_ID" },
    );
  });

  it("on createUser failure sends error response", async () => {
    createUser.mockRejectedValue(new Error("oops"));
    await registerUser(req, res);
    expect(sendErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "User registration failed",
      "oops",
    );
  });
});
