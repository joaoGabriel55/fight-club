import { useQuery } from "@tanstack/react-query";
import { privacyService } from "../services/privacy.service";
import { Card, CardContent } from "@/shared/components/ui/card";

export function PrivacyPolicyViewer() {
  const { data, isLoading } = useQuery({
    queryKey: ["privacy-policy"],
    queryFn: privacyService.getPrivacyPolicy,
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading policy...</p>;
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
          {data?.content}
        </pre>
      </CardContent>
    </Card>
  );
}
