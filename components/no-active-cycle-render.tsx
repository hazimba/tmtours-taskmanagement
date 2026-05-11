import { Zap } from "lucide-react";

interface NoActiveCycleRenderProps {
  title: string;
  description: string;
}

const NoActiveCycleRender = ({
  title,
  description,
}: NoActiveCycleRenderProps) => {
  return (
    <div className="flex h-full w-full flex-col">
      <div>
        <h1 className="text-xl font-bold tracking-widest">{title}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="group relative mb-6">
          <div className="absolute inset-0 scale-150 bg-primary/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity animate-pulse" />

          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-card border border-border shadow-xl">
            <Zap className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>

        <div className="max-w-[320px] space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Activate a Cycle
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No Active Cycle Selected! To see your tasks, select a cycle from the
            sidebar and click the
            <span className="inline-flex items-center gap-1 font-bold text-primary mx-1 py-1">
              <Zap className="h-3 w-3" /> Activate
            </span>
            button.
          </p>
        </div>
        <div className="mt-10 flex items-center gap-2 opacity-20">
          <div className="h-1 w-12 rounded-full bg-primary" />
          <div className="h-1 w-1 rounded-full bg-primary" />
          <div className="h-1 w-1 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
};
export default NoActiveCycleRender;
