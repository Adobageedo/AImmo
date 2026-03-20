"use client";

import { useState } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { ApprovalCard } from "@/components/tool-ui/approval-card";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";

type SendEmailArgs = {
  to: string;
  subject: string;
  body: string;
  approved?: boolean;
};

type SendEmailResult = {
  status: "requires_approval" | "sent" | "cancelled";
  message: string;
  timestamp?: string;
  emailDetails?: {
    to: string;
    subject: string;
    preview: string;
  };
};

const SendEmailToolUI = makeAssistantToolUI<SendEmailArgs, SendEmailResult>({
  toolName: "sendEmail",
  render: ({ args, result, status, addResult }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [localResult, setLocalResult] = useState<SendEmailResult | null>(null);
    const [emailDetails, setEmailDetails] = useState<SendEmailResult["emailDetails"] | null>(null);

    // Store email details when we get them
    if (result?.status === "requires_approval" && result.emailDetails && !emailDetails) {
      setEmailDetails(result.emailDetails);
    }

    // Show result (from backend or local state)
    const displayResult = result || localResult;
    if (displayResult) {
      if (displayResult.status === "requires_approval" && displayResult.emailDetails) {
        return (
          <ApprovalCard
            id={`send-email-${displayResult.emailDetails.to}`}
            title="Send Email"
            description="The assistant wants to send an email on your behalf"
            icon="Mail"
            variant="default"
            confirmLabel={isProcessing ? "Sending..." : "Send Email"}
            cancelLabel={isProcessing ? "Cancelling..." : "Don't Send"}
            metadata={[
              { key: "To", value: displayResult.emailDetails.to },
              { key: "Subject", value: displayResult.emailDetails.subject },
              { key: "Preview", value: displayResult.emailDetails.preview },
            ]}
            onConfirm={async () => {
              if (isProcessing) return;
              setIsProcessing(true);
              
              // Trigger second tool call with approval
              const details = displayResult.emailDetails || emailDetails;
              if (details) {
                addResult?.({
                  status: "sent",
                  message: `Email sent to ${details.to}`,
                  timestamp: new Date().toISOString(),
                });
              }
            }}
            onCancel={() => {
              setLocalResult({
                status: "cancelled",
                message: "Email sending was cancelled by user",
              });
            }}
          />
        );
      }

      if (displayResult.status === "sent") {
        return (
          <Card className="p-6 border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-950/20 dark:to-emerald-950/10 dark:border-green-900 animate-in fade-in duration-500">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    Email Sent Successfully! 📧
                  </h3>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  {displayResult.message}
                </p>
                {displayResult.timestamp && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <span className="font-medium">Sent at:</span>
                    <span>{new Date(displayResult.timestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      }

      if (displayResult.status === "cancelled") {
        return (
          <Card className="p-4 border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  Email Cancelled
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayResult.message}
                </p>
              </div>
            </div>
          </Card>
        );
      }
    }

    // Loading state
    return (
      <Card className="p-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Preparing email...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              To: {args.to}
            </p>
          </div>
        </div>
      </Card>
    );
  },
});

export { SendEmailToolUI };
