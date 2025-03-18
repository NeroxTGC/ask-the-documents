export type Section = {
  id: string;
  content: string;
  orderIndex: number;
  documentId: string;
};

export type Document = {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  sections: Section[];
};

export type DocumentWithScore = {
  document: Document;
  score: number;
};
