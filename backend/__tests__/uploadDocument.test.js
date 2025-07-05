const { uploadDocument } = require("../controllers/controllers");
const { firestore, generateSummary } = require("../services/services");
const firebaseAdmin = require("firebase-admin");
const { sendSuccessResponse, sendErrorResponse } = require("../views/views");

jest.mock("../services/services", () => ({
  firestore: { collection: jest.fn() },
  generateSummary: jest.fn(),
}));
jest.mock("firebase-admin", () => ({
  firestore: { FieldValue: { arrayUnion: (x) => x } },
}));
jest.mock("../views/views", () => ({
  sendSuccessResponse: jest.fn(),
  sendErrorResponse: jest.fn(),
}));

describe("uploadDocument", () => {
  let req, res, fakeUserRef, fakeDocSnapshot;

  beforeEach(() => {
    sendSuccessResponse.mockClear();
    sendErrorResponse.mockClear();
    fakeUserRef = {
      get: jest.fn(),
      update: jest.fn(),
    };
    fakeDocSnapshot = { exists: true };
    firestore.collection.mockReturnValue({
      doc: jest.fn(() => fakeUserRef),
    });
  });

  it("responds 400 when missing title or text", async () => {
    req = { body: { title: "", text: "" } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await uploadDocument(req, res);
    expect(sendErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Missing title or text in request body",
    );
  });

  it("succeeds and updates Firestore when userId provided", async () => {
    req = {
      body: {
        userId: ["UID1"],
        title: "T",
        text: "long text",
      },
    };
    res = {};
    generateSummary.mockResolvedValue({
      originalText: "long text",
      summary: "short",
    });
    fakeUserRef.get.mockResolvedValue({ exists: true });
    fakeUserRef.update.mockResolvedValue();

    await uploadDocument(req, res);

    expect(generateSummary).toHaveBeenCalledWith("long text");
    expect(fakeUserRef.get).toHaveBeenCalled();
    expect(fakeUserRef.update).toHaveBeenCalledWith({
      documents: expect.any(Object),
    });
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      200,
      "Document summarized",
      { summary: "short", originalText: "long text" },
    );
  });

  it("returns 404 if user not found", async () => {
    req = { body: { userId: ["UID1"], title: "T", text: "blah" } };
    res = {};
    generateSummary.mockResolvedValue({ originalText: "blah", summary: "sum" });
    fakeUserRef.get.mockResolvedValue({ exists: false });

    await uploadDocument(req, res);

    expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, "User not found");
  });
});
