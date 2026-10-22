# 更新の前の版へ戻す手順（管理者向け）

> **正本**: [22-mnt-migration.md](function-design/22-mnt-migration.md) §16 の「回復」。本書はその 7 手順を、版 v8 と file の名前で写した手順書で、食い違えば 22 §16 が正しい。
> **対象**: アプリを管理する人。店の利用者の操作にしない。

## いつ使うか

migration v8（単位を 12 種へ広げる）を含む版に更新した後、更新の前の版（DB の版が 7 以下のアプリ）へ戻すとき。v8 を適用した DB は旧版のアプリでは開けず（起動を中止する）、アプリの中の復元でも旧版へは戻せないので、アプリを止めて file を置き換える。

使わない場合:

- 更新の起動が「上限の検査」で止まり、v8 がその起動の最初の migration だった。DB は何も変わっておらず版も 7 のままなので、旧版のアプリでそのまま開ける。新しい版は起動のたびに同じ所で止まるので、更新を保留して対応を決める（22 §16「止まった後の進め方」）。
- 新しい版のまま、古い時点のデータへ戻したい。アプリの中の復元（設定の「バックアップ・復元」）を使う。古い backup を新しい版のアプリで復元すると復元の中で migration が当たり、上限の検査で止まれば復元は巻き戻されて今の DB のままになる。

## 用語

| 語 | 意味 |
|---|---|
| `{db_path}` | アプリのデータ folder の `inventory.db` |
| backup | `inventory_backup_YYYYMMDD_HHMMSS.db`（backup folder、既定はデータ folder の `backups`）。1 file で、`-wal`・`-shm` は付かない |
| 旧版の最大の版 | 戻す先のアプリが開ける DB の版の最大。v8 の直前のアプリは 7 |
| 遺物 | 復元が中断した跡の file: `{db_path}.restore_manifest`・`{db_path}.restore_manifest.tmp`・名前が `.restore_backup` で終わる file |

確認の SQL は `sqlite3` の CLI で実行する。

## 手順

手順 3・4 で止まる条件に当たったら、そこで終える。手順 5 より前には `{db_path}`・`{db_path}-wal`・`{db_path}-shm` と遺物を動かさず、消さない。

1. **更新の前に、旧版のアプリで backup を作っておく。** 起動時の自動の backup は migration の後に作られるので、新しい版で作った backup は旧版で使えない。
2. **アプリを止める。** 窓を全部閉じ、プロセスが残っていないことを確かめる。
3. **遺物が無いことを確かめる。** `{db_path}.restore_manifest`・`{db_path}.restore_manifest.tmp`・`*.restore_backup` のどれかがデータ folder にあれば、手順を止める。次の起動が片付ける状態なので、手で消さず、file も動かさない。
4. **戻す backup を確かめる。** backup の写しを別の場所に作り、写しを読み取りだけで開いて次の 2 つを見る。

   ```
   sqlite3 -readonly <backup の写し> "SELECT MAX(version) FROM schema_versions; PRAGMA integrity_check;"
   ```

   - 1 行目が旧版の最大の版以下（v8 の前へ戻すなら `7` 以下）
   - 2 行目が `ok`

   どちらかが違えば別の backup で確かめ直す。合う backup が無ければ手順を止める。
5. **今の DB を保全する。** `{db_path}` と、あれば `{db_path}-wal`・`{db_path}-shm` を、消さずに日付の付いた別の folder へ移す。更新の後に入れたデータはここにだけ残る。
6. **backup を置く。** 手順 4 で確かめた写しを `{db_path}` の名前で置く。`-wal`・`-shm` は置かない。
7. **旧版のアプリを入れて起動する。** 遺物が無く、版が旧版の最大以下なので、そのまま開く。

## 戻らないもの

更新の後に入れたデータは戻らない（手順 5 で保全した file にだけ残る）。v8 は値を変えないので、逆変換の migration は無い。
