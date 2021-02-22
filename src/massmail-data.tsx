export type KeywordData = { word: string; priority: number };
export type ClusterData = { id: string; label: string };
export type EmailData = {
  content: string;
  clusterId: string;
  embedding?: { x: number; y: number };
};

export type MassmailData = {
  keywords: KeywordData[];
  clusters: ClusterData[];
  emails: EmailData[];
};
