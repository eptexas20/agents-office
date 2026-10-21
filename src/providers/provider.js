export class ChatProvider {
  constructor(id, label) {
    this.id = id;
    this.label = label;
  }

  async status() {
    throw new Error(`${this.id} does not implement status()`);
  }

  async listBots() {
    throw new Error(`${this.id} does not implement listBots()`);
  }

  async sendMessage(_request) {
    throw new Error(`${this.id} does not implement sendMessage()`);
  }
}
