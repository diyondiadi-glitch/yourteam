import FeaturePage from "@/components/FeaturePage";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wrench, ChevronDown } from "lucide-react";

const mockDiagnosis = [
  {
    reason: "Weak hook — first 15 seconds had no curiosity gap",
    evidence: "30% of viewers dropped off before the 15-second mark, compared to your channel average of 18%",
    fix: "Open with a bold claim or question that creates tension. Try: 'I almost deleted this video — here's why I didn't.'"
  },
  {
    reason: "Title was too vague — low search demand",
    evidence: "CTR was 2.1% vs your average of 4.3%. The title 'My Thoughts on Content' has near-zero search volume.",
    fix: "Use a specific, curiosity-driven title: 'The Content Strategy That Tripled My Views (Not What You Think)'"
  },
  {
    reason: "Uploaded on Saturday morning — worst time for your audience",
    evidence: "Your best uploads perform 3.2x better on Tuesdays and Wednesdays at 6PM. This was posted Saturday 9AM.",
    fix: "Schedule your next upload for Tuesday or Wednesday at 6PM in your audience's primary timezone."
  },
];

export default function VideoDeath() {
  return (
    <FeaturePage
      emoji="💀"
      title="Why Did My Video Die?"
      description="Select any video and get a brutally honest diagnosis with actionable fixes"
    >
      {/* Video selector */}
      <div className="mb-8">
        <Button variant="outline" className="w-full justify-between h-12 rounded-xl text-left">
          <span className="text-muted-foreground">Select a video to diagnose...</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Diagnosis cards */}
      <div className="space-y-4 mb-8">
        {mockDiagnosis.map((d, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6 card-glow">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="font-semibold mb-1">Reason #{i + 1}: {d.reason}</p>
                <p className="text-sm text-muted-foreground">{d.evidence}</p>
              </div>
            </div>
            <div className="ml-11 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase text-primary">Fix</span>
              </div>
              <p className="text-sm">{d.fix}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">What To Do Now</p>
        <p className="text-sm leading-relaxed">
          Rewrite your title using a curiosity gap, create a new thumbnail with a face close-up and bold text, then re-promote this video with a community post. Schedule your next upload for Tuesday 6PM. These 3 changes alone could recover 40-60% of lost views.
        </p>
      </div>
    </FeaturePage>
  );
}
