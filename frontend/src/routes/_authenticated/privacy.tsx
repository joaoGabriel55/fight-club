import { createFileRoute } from "@tanstack/react-router";
import { Shield, Download, Trash2, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { DataExportButton } from "@/domains/privacy/components/DataExportButton";
import { DeleteAccountDialog } from "@/domains/privacy/components/DeleteAccountDialog";
import { PrivacyPolicyViewer } from "@/domains/privacy/components/PrivacyPolicyViewer";

export const Route = createFileRoute("/_authenticated/privacy")({
  component: PrivacyCenterPage,
});

function PrivacyCenterPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Privacy Center</h1>
      </div>

      {/* My Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            My Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Download a copy of all your personal data stored in Fight Club,
            including your profile, enrollments, feedback, and belt progress.
          </p>
          <DataExportButton />
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <DeleteAccountDialog />
        </CardContent>
      </Card>

      <Separator />

      {/* Privacy Policy */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Privacy Policy
        </h2>
        <PrivacyPolicyViewer />
      </div>
    </div>
  );
}
