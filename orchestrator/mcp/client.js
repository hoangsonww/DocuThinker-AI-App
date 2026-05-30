class MCPClient {
  constructor({ logger } = {}) {
    this.logger = logger || console;
    this.connections = new Map();
  }

  async connect(serverName, config) {
    const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
    const client = new Client(
      { name: "docuthinker-orchestrator", version: "1.0.0" },
      {},
    );
    if (config.transport === "stdio") {
      const {
        StdioClientTransport,
      } = require("@modelcontextprotocol/sdk/client/stdio.js");
      await client.connect(
        new StdioClientTransport({
          command: config.command,
          args: config.args || [],
          env: config.env || {},
        }),
      );
    } else {
      throw new Error(
        `Unsupported transport: ${config.transport}. Only 'stdio' supported.`,
      );
    }
    this.connections.set(serverName, client);
    const tools = await client.listTools();
    return tools;
  }

  async callTool(serverName, toolName, args) {
    const c = this.connections.get(serverName);
    if (!c) throw new Error(`Not connected to: ${serverName}`);
    return c.callTool({ name: toolName, arguments: args });
  }
  async disconnect(serverName) {
    const c = this.connections.get(serverName);
    if (c) {
      await c.close();
      this.connections.delete(serverName);
    }
  }
  async disconnectAll() {
    for (const [n] of this.connections) await this.disconnect(n);
  }
  getConnectedServers() {
    return [...this.connections.keys()];
  }
}

module.exports = { MCPClient };
