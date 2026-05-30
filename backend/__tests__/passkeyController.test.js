const mockAuth = {
  getUser: jest.fn(),
  getUserByEmail: jest.fn(),
  createCustomToken: jest.fn(),
};

jest.mock("firebase-admin", () => ({
  auth: () => mockAuth,
}));

jest.mock("../models/passkeyModel", () => ({
  Passkey: {
    create: jest.fn(),
    getById: jest.fn(),
    listByUser: jest.fn(),
    updateCounter: jest.fn(),
    rename: jest.fn(),
    remove: jest.fn(),
  },
  Challenge: {
    save: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
  },
  toIso: (value) => (value ? new Date(value).toISOString() : null),
}));

jest.mock("../views/views", () => ({
  sendSuccessResponse: jest.fn(),
  sendErrorResponse: jest.fn(),
}));

jest.mock("@simplewebauthn/server", () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

const controller = require("../controllers/passkeyController");
const { Passkey, Challenge } = require("../models/passkeyModel");
const { sendSuccessResponse, sendErrorResponse } = require("../views/views");
const webauthn = require("@simplewebauthn/server");

const makeReq = (overrides = {}) => ({
  body: {},
  params: {},
  headers: {
    origin: "https://app.example.com",
    "user-agent": "Mozilla/5.0 (Macintosh) Chrome/120 Safari/537",
  },
  ...overrides,
});

const res = {};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getRegistrationOptions", () => {
  it("rejects when userId is missing", async () => {
    await controller.getRegistrationOptions(makeReq({ body: {} }), res);
    expect(sendErrorResponse).toHaveBeenCalledWith(res, 400, "userId is required");
  });

  it("returns 404 when the user does not exist", async () => {
    mockAuth.getUser.mockRejectedValue(new Error("no user"));
    await controller.getRegistrationOptions(
      makeReq({ body: { userId: "u1" } }),
      res,
    );
    expect(sendErrorResponse).toHaveBeenCalledWith(
      res,
      404,
      "User not found",
      "no user",
    );
  });

  it("generates options, stores a challenge, and excludes existing keys", async () => {
    mockAuth.getUser.mockResolvedValue({ email: "a@b.com", displayName: null });
    Passkey.listByUser.mockResolvedValue([
      { credentialId: "existing", transports: ["internal"] },
    ]);
    webauthn.generateRegistrationOptions.mockResolvedValue({
      challenge: "CHALLENGE",
    });

    await controller.getRegistrationOptions(
      makeReq({ body: { userId: "u1" } }),
      res,
    );

    expect(webauthn.generateRegistrationOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        rpID: "app.example.com",
        excludeCredentials: [
          { id: "existing", transports: ["internal"] },
        ],
      }),
    );
    expect(Challenge.save).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        challenge: "CHALLENGE",
        type: "registration",
        userId: "u1",
        rpID: "app.example.com",
        origin: "https://app.example.com",
      }),
    );
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      200,
      "Registration options generated",
      expect.objectContaining({ options: { challenge: "CHALLENGE" } }),
    );
  });
});

describe("verifyRegistration", () => {
  it("rejects a mismatched challenge session", async () => {
    Challenge.get.mockResolvedValue({ type: "registration", userId: "other" });
    await controller.verifyRegistration(
      makeReq({ body: { userId: "u1", flowId: "f1", response: {} } }),
      res,
    );
    expect(sendErrorResponse).toHaveBeenCalledWith(
      res,
      400,
      "Invalid or expired registration session",
    );
  });

  it("verifies attestation and stores the credential", async () => {
    Challenge.get.mockResolvedValue({
      type: "registration",
      userId: "u1",
      challenge: "CHALLENGE",
      origin: "https://app.example.com",
      rpID: "app.example.com",
      createdAt: new Date(),
    });
    webauthn.verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          id: "cred-1",
          publicKey: new Uint8Array([9, 9]),
          counter: 0,
          transports: ["internal", "hybrid"],
        },
        credentialDeviceType: "multiDevice",
        credentialBackedUp: true,
        aaguid: "aaguid-1",
      },
    });
    Passkey.getById.mockResolvedValue(null);

    await controller.verifyRegistration(
      makeReq({
        body: {
          userId: "u1",
          flowId: "f1",
          name: "My Laptop",
          response: { id: "cred-1", response: {} },
        },
      }),
      res,
    );

    expect(Passkey.create).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialId: "cred-1",
        userId: "u1",
        publicKey: expect.any(String),
        backedUp: true,
        deviceType: "multiDevice",
        name: "My Laptop",
      }),
    );
    expect(Challenge.remove).toHaveBeenCalledWith("f1");
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      201,
      "Passkey registered successfully",
      expect.objectContaining({
        passkey: expect.objectContaining({ id: "cred-1", name: "My Laptop" }),
      }),
    );
  });

  it("returns 409 when the credential already exists", async () => {
    Challenge.get.mockResolvedValue({
      type: "registration",
      userId: "u1",
      challenge: "CHALLENGE",
      origin: "https://app.example.com",
      rpID: "app.example.com",
      createdAt: new Date(),
    });
    webauthn.verifyRegistrationResponse.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: { id: "dup", publicKey: new Uint8Array([1]), counter: 0 },
        credentialDeviceType: "singleDevice",
        credentialBackedUp: false,
      },
    });
    Passkey.getById.mockResolvedValue({ credentialId: "dup" });

    await controller.verifyRegistration(
      makeReq({
        body: { userId: "u1", flowId: "f1", response: { id: "dup" } },
      }),
      res,
    );

    expect(sendErrorResponse).toHaveBeenCalledWith(
      res,
      409,
      "This passkey is already registered",
    );
    expect(Passkey.create).not.toHaveBeenCalled();
  });
});

describe("verifyAuthentication", () => {
  it("rejects an unknown credential", async () => {
    Challenge.get.mockResolvedValue({
      type: "authentication",
      challenge: "CHALLENGE",
      origin: "https://app.example.com",
      rpID: "app.example.com",
      createdAt: new Date(),
    });
    Passkey.getById.mockResolvedValue(null);

    await controller.verifyAuthentication(
      makeReq({ body: { flowId: "f1", response: { id: "missing" } } }),
      res,
    );

    expect(sendErrorResponse).toHaveBeenCalledWith(
      res,
      401,
      "Passkey not recognized",
    );
  });

  it("verifies the assertion and returns a custom token", async () => {
    Challenge.get.mockResolvedValue({
      type: "authentication",
      challenge: "CHALLENGE",
      origin: "https://app.example.com",
      rpID: "app.example.com",
      createdAt: new Date(),
    });
    Passkey.getById.mockResolvedValue({
      credentialId: "cred-1",
      userId: "u1",
      publicKey: "PUBLIC_KEY_B64URL",
      counter: 4,
      transports: ["internal"],
    });
    webauthn.verifyAuthenticationResponse.mockResolvedValue({
      verified: true,
      authenticationInfo: { newCounter: 5 },
    });
    mockAuth.createCustomToken.mockResolvedValue("CUSTOM_TOKEN");
    mockAuth.getUser.mockResolvedValue({ email: "a@b.com" });

    await controller.verifyAuthentication(
      makeReq({ body: { flowId: "f1", response: { id: "cred-1" } } }),
      res,
    );

    expect(Passkey.updateCounter).toHaveBeenCalledWith("cred-1", 5);
    expect(mockAuth.createCustomToken).toHaveBeenCalledWith("u1");
    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      200,
      "Authentication successful",
      { customToken: "CUSTOM_TOKEN", userId: "u1", email: "a@b.com" },
    );
  });
});

describe("listPasskeys / renamePasskey / deletePasskey", () => {
  it("lists serialized passkeys", async () => {
    Passkey.listByUser.mockResolvedValue([
      {
        credentialId: "c1",
        name: "Key 1",
        deviceType: "multiDevice",
        backedUp: true,
        transports: ["internal"],
        createdAt: new Date("2026-01-01"),
        lastUsedAt: null,
      },
    ]);

    await controller.listPasskeys(makeReq({ params: { userId: "u1" } }), res);

    expect(sendSuccessResponse).toHaveBeenCalledWith(
      res,
      200,
      "Passkeys retrieved",
      expect.objectContaining({
        passkeys: [expect.objectContaining({ id: "c1", name: "Key 1" })],
      }),
    );
  });

  it("returns 404 when renaming a passkey the user does not own", async () => {
    Passkey.getById.mockResolvedValue({ userId: "someone-else" });
    await controller.renamePasskey(
      makeReq({ params: { userId: "u1", credentialId: "c1" }, body: { name: "X" } }),
      res,
    );
    expect(sendErrorResponse).toHaveBeenCalledWith(res, 404, "Passkey not found");
    expect(Passkey.rename).not.toHaveBeenCalled();
  });

  it("renames an owned passkey", async () => {
    Passkey.getById.mockResolvedValue({ userId: "u1", credentialId: "c1" });
    await controller.renamePasskey(
      makeReq({
        params: { userId: "u1", credentialId: "c1" },
        body: { name: "  Work Laptop  " },
      }),
      res,
    );
    expect(Passkey.rename).toHaveBeenCalledWith("c1", "Work Laptop");
  });

  it("deletes an owned passkey", async () => {
    Passkey.getById.mockResolvedValue({ userId: "u1", credentialId: "c1" });
    await controller.deletePasskey(
      makeReq({ params: { userId: "u1", credentialId: "c1" } }),
      res,
    );
    expect(Passkey.remove).toHaveBeenCalledWith("c1");
    expect(sendSuccessResponse).toHaveBeenCalledWith(res, 200, "Passkey deleted", {
      id: "c1",
    });
  });
});
