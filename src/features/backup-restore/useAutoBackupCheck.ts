// src/features/backup-restore/useAutoBackupCheck.ts
//
// UI-11b-D13: 設定時刻の自動バックアップの確認（71 §71.8 のフロントエンドタイマー）。
// 共通レイアウト（UI-12 RootLayout）が 1 回 mount し、画面に依らず 60 秒ごとに確認する。
// 復元の間の停止は module scope の flag と世代番号で持つ（UI-11b-D11 と同じ in-memory の形。
// reload / アプリ再起動で初期値に戻る）。

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { commands } from "@/lib/bindings";
import { unwrapResult } from "@/lib/invoke";
import { queryKeys } from "@/lib/query-keys";

const AUTO_BACKUP_CHECK_INTERVAL_MS = 60_000;

let suspended = false;
// 停止のたびに進む。呼ぶ時点と結果が届いた時点で違えば、その結果を捨てる。
let generation = 0;

/** 復元を始める前に BackupRestorePage が呼ぶ。停止の前に始まった確認の結果は捨てる。 */
export function suspendAutoBackupCheck(): void {
  suspended = true;
  generation += 1;
}

/** 復元が fatal でない結果で終わったときに BackupRestorePage が呼ぶ（世代番号は戻さない）。 */
export function resumeAutoBackupCheck(): void {
  suspended = false;
}

export function useAutoBackupCheck(): void {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  const failing = useRef(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (suspended || inFlight.current) return;
      inFlight.current = true;
      const startedGeneration = generation;
      void (async () => {
        try {
          const created = await unwrapResult(commands.checkAutoBackup(), {
            source: "commands",
            cmd: "check_auto_backup",
          });
          if (generation !== startedGeneration) return;
          failing.current = false;
          if (created) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.backupRestore.list() });
            toast.success("自動バックアップを作成しました");
          }
        } catch {
          if (generation !== startedGeneration) return;
          // owner 決定 2026-09-25 = (a): 失敗の toast は連続失敗の最初の 1 回だけ
          if (!failing.current) {
            toast.error("自動バックアップ確認に失敗しました", { id: "backup-auto-check-error" });
          }
          failing.current = true;
        } finally {
          inFlight.current = false;
        }
      })();
    }, AUTO_BACKUP_CHECK_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
    };
  }, [queryClient]);
}
