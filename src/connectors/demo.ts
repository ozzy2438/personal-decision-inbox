import { DEMO_ITEMS } from "../data/demo-corpus";
import type { InboxConnector } from "./types";

export const DemoConnector: InboxConnector = {
  id: "demo",
  label: "Seeded demo corpus",
  async list() {
    return DEMO_ITEMS.map((item) => ({
      source: item.state.source,
      title: item.state.title,
      body: item.state.body,
      from: item.state.from,
    }));
  },
};

export const demoConnector = DemoConnector;
