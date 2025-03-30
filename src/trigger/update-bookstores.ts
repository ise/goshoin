import { updateBookstoresService } from "@/app/services/updateBookstores";
import { schedules } from "@trigger.dev/sdk/v3";

// 1日1回実行するジョブを定義
export const updateBookstores = schedules.task({
  id: "update-bookstores",
  cron: "0 0 * * *",
  maxDuration: 300,
  run: async () => {
    // バッチ処理の実行
    const [success, updatedCount, errorCount] = await updateBookstoresService();
    const data = {
      success,
      updatedCount,
      errorCount,
    };

    // 結果のログ出力
    console.log("Update result:", data);

    return data;
  },
});
