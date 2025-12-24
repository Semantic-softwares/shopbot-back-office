export interface Permission {
  _id: string;
  code: string;
  name: string;
  description: string;
  module: string;
  group: string;
  action: string;
  isActive: boolean;
  sortOrder: number;
}

export interface GroupedPermissions {
  [module: string]: {
    [group: string]: Permission[];
  };
}