export type ConnectorItem = {
  title: string;
  body: string;
  from?: string;
  source: "email" | "calendar" | "slack" | "meeting" | "paste" | "demo";
};

export type InboxConnector = {
  id: string;
  label: string;
  list(): Promise<ConnectorItem[]>;
};
