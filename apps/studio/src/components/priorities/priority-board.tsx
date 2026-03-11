import { Card } from "@/components/ui/card";

type Props = {
  northStar: string;
  shortTerm: string[];
  longTerm: string[];
  goals: string[];
  risks: string[];
};

export function PriorityBoard({ northStar, shortTerm, longTerm, goals, risks }: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-accent">North Star</p>
        <h2 className="mt-2 text-3xl font-semibold">{northStar}</h2>
        <p className="mt-3 text-sm text-white/65">所有短期动作都必须解释如何强化这条长期复利轴。</p>
      </Card>
      <Card>
        <Section title="Primary Goals" items={goals} />
      </Card>
      <Card>
        <Section title="Short Term Priorities" items={shortTerm} />
      </Card>
      <Card>
        <Section title="Long Term Compounding Axes" items={longTerm} />
      </Card>
      <Card className="xl:col-span-2">
        <Section title="High Risk Actions" items={risks} />
      </Card>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.24em] text-accent">{title}</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/76">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
