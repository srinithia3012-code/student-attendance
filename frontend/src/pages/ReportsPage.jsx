import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Reports</h2>
        <p className="text-stone-600">Insights and summaries will appear here.</p>
      </section>

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="text-stone-700">
          Report charts and downloadable summaries can be added in this section.
        </CardContent>
      </Card>
    </div>
  );
}
