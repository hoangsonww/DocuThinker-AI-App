const { uploadDocument } = require("../controllers/controllers");
const {
  firestore,
  generateSummary,
  storeDocumentContent,
  getDocumentFileUrl,
} = require("../services/services");
const { sendSuccessResponse, sendErrorResponse } = require("../views/views");

jest.mock("../services/services", () => ({
  firestore: { collection: jest.fn() },
  generateSummary: jest.fn(),
  storeDocumentContent: jest.fn(),
  getDocumentFileUrl: jest.fn(),
}));
jest.mock("firebase-admin", () => ({
  firestore: {
    FieldValue: { serverTimestamp: () => "TS", arrayUnion: (x) => x },
  },
}));
jest.mock("../views/views", () => ({
  sendSuccessResponse: jest.fn(),
  sendErrorResponse: jest.fn(),
}));

describe("uploadDocument", () => {
  let req, res, fakeUserRef, fakeDocSetRef, fakeDocsCollection;

  beforeEach(() => {
    sendSuccessResponse.mockClear();
    sendErrorResponse.mockClear();
    generateSummary.mockReset();
    storeDocumentContent.mockReset();
    getDocumentFileUrl.mockReset();

    // The per-document ref the controller writes the record to.
    fakeDocSetRef = { set: jest.fn().mockResolvedValue() };
    // userRef.collection("documents").doc(docId) -> fakeDocSetRef
    fakeDocsCollection = { doc: jest.fn(() => fakeDocSetRef) };
    fakeUserRef = {
      id: "DOC123",
      get: jest.fn(),
      collection: jest.fn(() => fakeDocsCollection),
    };
    // firestore.collection("users").doc(...) -> fakeUserRef (also used arg-less
    // to mint a docId via .id).
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

  it("succeeds and writes to the documents subcollection when userId provided", async () => {
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
    storeDocumentContent.mockResolvedValue("users/UID1/DOC123.json");
    getDocumentFileUrl.mockResolvedValue("");
    fakeUserRef.get.mockResolvedValue({ exists: true });

    await uploadDocument(req, res);

    // Title is passed to the model as context alongside the text.
    expect(generateSummary).toHaveBeenCalledWith("long text", "T");
    expect(fakeUserRef.get).toHaveBeenCalled();
    // Record is written to the per-user documents subcollection (not update()).
    expect(fakeUserRef.collection).toHaveBeenCalledWith("documents");
    expect(fakeDocSetRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "T",
        summary: "short",
        contentPath: "users/UID1/DOC123.json",
        createdAt: "TS",
      }),
    );
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      200,
      "Document summarized",
      expect.objectContaining({ summary: "short", originalText: "long text" }),
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
