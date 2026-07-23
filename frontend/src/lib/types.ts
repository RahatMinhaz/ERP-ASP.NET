export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  permissions: string[];
};

export type AuthResponse = {
  token: string;
  expiresAtUtc: string;
  user: CurrentUser;
};

export type RecordValue = string | number | boolean | null | undefined | Record<string, unknown>;
export type ErpRecord = Record<string, RecordValue> & { id: string };
export type FieldType = "text" | "email" | "number" | "date" | "time" | "textarea" | "select" | "relation";

export type FormField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  relationEndpoint?: string;
  relationLabel?: string;
  step?: string;
};

export type TableColumn = {
  key: string;
  label: string;
  format?: "currency" | "date" | "datetime" | "status";
  nested?: string;
};

export type ModuleConfig = {
  key: string;
  title: string;
  singular: string;
  description: string;
  endpoint: string;
  permission: string;
  fields: FormField[];
  columns: TableColumn[];
};
