export interface Rule {
  days: number;
  enabled: boolean;
  /** Minutes from midnight, or -1 for "no schedule" (always active). */
  quietStart: number;
  quietEnd: number;
}

export type RulesMap = Record<string, Rule>;

export interface AppInfo {
  label: string;
  packageName: string;
  icon?: string | null;
}

export interface Stats {
  total: number;
  perApp: Record<string, number>;
}

export const DEFAULT_RULE: Rule = {
  days: 3,
  enabled: true,
  quietStart: -1,
  quietEnd: -1,
};

export const hasSchedule = (rule: Rule) =>
  rule.quietStart >= 0 && rule.quietEnd >= 0 && rule.quietStart !== rule.quietEnd;
