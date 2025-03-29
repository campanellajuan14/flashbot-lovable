
import { Separator } from "@/components/ui/separator";

interface SettingsHeaderProps {
  title: string;
  description: string;
}

export function SettingsHeader({ title, description }: SettingsHeaderProps) {
  return (
    <div className="space-y-0.5">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground">
        {description}
      </p>
      <Separator className="my-6" />
    </div>
  );
}
