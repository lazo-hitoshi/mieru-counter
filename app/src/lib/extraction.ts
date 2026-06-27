export type ImportantItemCandidate = {
  itemType: string;
  title: string;
  body: string;
  priority: "normal" | "high" | "urgent";
  metadata?: Record<string, string>;
};

export type ExtractionContext = {
  facilityType?: string;
  language?: string;
};

export interface ImportantItemExtractor {
  extract(
    text: string,
    context: ExtractionContext
  ): Promise<ImportantItemCandidate[]>;
}

const patterns: {
  regex: RegExp;
  itemType: string;
  title: string;
  priority: "normal" | "high" | "urgent";
}[] = [
  {
    regex: /1日(\d+)回/,
    itemType: "medicine",
    title: "服用回数",
    priority: "high",
  },
  {
    regex: /(食前|食後|食間|寝る前|起床時)/,
    itemType: "medicine",
    title: "服用タイミング",
    priority: "high",
  },
  {
    regex: /(\d+)錠/,
    itemType: "medicine",
    title: "服用量",
    priority: "high",
  },
  {
    regex: /(\d+)日分/,
    itemType: "medicine",
    title: "処方日数",
    priority: "normal",
  },
  {
    regex: /(\d{1,2})月(\d{1,2})日/,
    itemType: "appointment",
    title: "日付",
    priority: "high",
  },
  {
    regex: /(\d{1,2})時(\d{1,2})?分?/,
    itemType: "appointment",
    title: "時間",
    priority: "normal",
  },
  {
    regex: /次回[はの]?(.{2,20})/,
    itemType: "next_action",
    title: "次回の予定",
    priority: "high",
  },
  {
    regex: /(\d+,?\d*)円/,
    itemType: "payment",
    title: "金額",
    priority: "normal",
  },
  {
    regex: /(注意|禁止|避けて|しないで|飲まないで|控えて)/,
    itemType: "warning",
    title: "注意事項",
    priority: "urgent",
  },
  {
    regex: /(持参|持ってきて|お持ち)/,
    itemType: "document",
    title: "持ち物",
    priority: "normal",
  },
];

export class RuleBasedExtractor implements ImportantItemExtractor {
  async extract(
    text: string,
    _context: ExtractionContext
  ): Promise<ImportantItemCandidate[]> {
    const items: ImportantItemCandidate[] = [];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        items.push({
          itemType: pattern.itemType,
          title: pattern.title,
          body: match[0],
          priority: pattern.priority,
        });
      }
    }

    return items;
  }
}

export const extractor: ImportantItemExtractor = new RuleBasedExtractor();
