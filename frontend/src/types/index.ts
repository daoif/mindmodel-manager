export interface MindModel {
  id: string;
  name: string;
  description: string;
  tags: Record<string, string[]>;
  created_at: string;
  updated_at: string;
}

export interface Document {
  type: string;
  content?: string;
  updatedAt: string;
}

export interface NavigationNode {
  id: string;
  name: string;
  type: "auto" | "manual";
  rule?: { dimension: string; value: string } | null;
  children: NavigationNode[];
}

export interface TagDimension {
  name: string;
  display_order: number;
}

export interface DocType {
  name: string;
  display_order: number;
}
