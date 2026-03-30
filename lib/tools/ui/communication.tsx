import { z } from "zod";
import type { Toolkit } from "@assistant-ui/react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Mail } from "lucide-react";
import { ApprovalCard } from "@/components/tool-ui/approval-card";

type SendEmailArgs = {
  to: string;
  subject: string;
  body: string;
};

type SendEmailResult = {
  status: string;
  message: string;
  timestamp?: string;
};

export const communicationTools: Toolkit = {
  sendEmail: {
    description: "Send an email (requires user approval)",
    parameters: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body content"),
    }),
    execute: async ({ to, subject, body }: SendEmailArgs) => {
      // Mock email sending (replace with actual email service)
      console.log("📧 Email sent:", { to, subject, body });
      
      return {
        status: "sent",
        message: `Email sent to ${to}`,
        timestamp: new Date().toISOString(),
      };
    },
    render: ({ args, result, status }) => {
      // Show result after execution
      if (result) {
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
                  {result.message}
                </p>
                {result.timestamp && (
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <span className="font-medium">Sent at:</span>
                    <span>{new Date(result.timestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      }

      // Show approval card when tool requires human approval
      if (status?.type === "requires-action" && status.reason === "interrupt") {
        return (
          <ApprovalCard
            id={`send-email-${args.to}`}
            title="Send Email"
            description="The assistant wants to send an email on your behalf"
            icon="Mail"
            variant="default"
            confirmLabel="Send Email"
            cancelLabel="Don't Send"
            metadata={[
              { key: "To", value: args.to },
              { key: "Subject", value: args.subject },
              { key: "Preview", value: args.body.slice(0, 100) + (args.body.length > 100 ? "..." : "") },
            ]}
          />
        );
      }

      // Default loading state
      return (
        <Card className="p-4 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
  },
};
