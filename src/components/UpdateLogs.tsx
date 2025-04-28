"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UpdateLog } from "@/types/supabase";

export function UpdateLogs() {
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data, error } = await supabase
          .from("update_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;

        setLogs(data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "ログの取得に失敗しました"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  if (loading) return <div className="text-center">読み込み中...</div>;
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">更新ログ</h2>
      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`p-4 rounded-lg ${
              log.status === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{log.message}</p>
                {log.error_details && (
                  <p className="mt-2 text-sm">{log.error_details}</p>
                )}
              </div>
              <time className="text-sm">
                {new Date(log.created_at).toLocaleString("ja-JP")}
              </time>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
