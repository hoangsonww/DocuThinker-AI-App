const { loginUser: loginController } = require("../controllers/controllers");
const { loginUser } = require("../services/services");
const firebaseAdmin = require("firebase-admin");
const { sendSuccessResponse, sendErrorResponse } = require("../views/views");

jest.mock("../services/services", () => ({
  loginUser: jest.fn(),
}));
jest.mock("../views/views", () => ({
  sendSuccessResponse: jest.fn(),
  sendErrorResponse: jest.fn(),
}));

// Create one mockAuth object so controller and test reference the same getUserByEmail
const mockGetUserByEmail = jest.fn();
const mockAuth = { getUserByEmail: mockGetUserByEmail };
jest.mock("firebase-admin", () => ({
  auth: () => mockAuth,
}));

describe("loginUser", () => {
  let req, res;

  beforeEach(() => {
    req = { body: { email: "x@y.com" } };
    res = {};
    loginUser.mockClear();
    mockGetUserByEmail.mockClear();
    sendSuccessResponse.mockClear();
    sendErrorResponse.mockClear();
  });

  it("on success returns custom token and userId", async () => {
    loginUser.mockResolvedValue("TOKEN123");
    mockGetUserByEmail.mockResolvedValue({ uid: "UID99" });

    await loginController(req, res);

    expect(loginUser).toHaveBeenCalledWith("x@y.com");
    expect(mockGetUserByEmail).toHaveBeenCalledWith("x@y.com");
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      200,
      "Custom token generated",
      { customToken: "TOKEN123", userId: "UID99" },
    );
  });

  it("on error sends 401", async () => {
    loginUser.mockRejectedValue(new Error("bad creds"));

    await loginController(req, res);

    expect(sendErrorResponse).toHaveBeenCalledWith(
      res,
      401,
      "Invalid credentials",
      "bad creds",
    );
  });
});
