import { Card, CardBody, Divider } from "@heroui/react";

interface SectionPanelProps {
  id: string;
  title: string;
  description: string;
  summary: string;
  children: React.ReactNode;
}

export function SectionPanel({
  id,
  title,
  description,
  summary,
  children,
}: SectionPanelProps) {
  return (
    <Card
      className="rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-sm"
      id={id}
    >
      <CardBody className="p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
          <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200/50">
            {summary}
          </p>
          <Divider className="my-2" />
        </div>
        <div className="space-y-4">{children}</div>
      </CardBody>
    </Card>
  );
}
