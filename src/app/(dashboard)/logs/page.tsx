import { Metadata } from "next";
import AdminLogs from "@/components/logs/AdminLogs";

export const metadata: Metadata = {
  title: "Activity Logs | LOOP",
  description: "Admin-only system activity logs",
};

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <AdminLogs />
    </div>
  );
}
