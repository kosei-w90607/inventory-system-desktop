# アプリの配布・更新・前の版へ戻す手順（管理者向け）

> **対象**: アプリを管理する人。店の利用者の操作にしない。
> **引く正本**: 起動の拒否は [22-mnt-migration.md](function-design/22-mnt-migration.md) §3.2 の MNT-03-D11、前の版へ戻す DB の手順は [22](function-design/22-mnt-migration.md) §16 の「回復」とその写しの [migration-recovery-runbook.md](migration-recovery-runbook.md)、backup と復元は [71-mnt-backup.md](function-design/71-mnt-backup.md) と [68-ui-backup-restore.md](function-design/68-ui-backup-restore.md)。本書は手順を並べるだけで、食い違えば正本が正しい。
> **未確認の点**: 実機で確かめていない振舞いは「未確認（M*n*）」と書き、確かめ方を末尾の [確かめる項目](#確かめる項目) に置く。店の PC で初回の導入をする前に、開発用の Windows で M1〜M9 を一度にまとめて確かめる（予行演習）。

## 今の事実

repo の現物で確かめた（2026-10-17、`src-tauri/tauri.conf.json`・`.github/workflows/`・`src-tauri/src/lib.rs`）。Tauri の振舞いは公式の資料で確かめた（同日。URL は各行）。

| 項目 | 今の値・振舞い | 出所 |
|---|---|---|
| MSI を作れる場所 | Windows の上だけ（WiX は Windows でしか動かない）。CI に Windows の build は無いので、開発用の Windows の clone で作る | [Tauri Windows Installer](https://v2.tauri.app/distribute/windows-installer/)、`.github/workflows/` |
| 作る installer の種類 | `bundle.targets` が `all`。Windows では MSI と NSIS の setup.exe の両方ができる見込みで、本書は MSI だけを使う（M1） | `src-tauri/tauri.conf.json` |
| 製品名 | `productName` は `inventory-system-tauri-scaffold`（雛形の名のまま） | `src-tauri/tauri.conf.json` |
| 更新の判定の鍵（upgrade code） | 指定が無いので、`productName` から作られる（`<productName>.exe.app.x64` の UUID v5）。更新のたびに同じでなければならない | [Tauri config: WixConfig](https://v2.tauri.app/reference/config/) |
| 版 | `version` は `0.1.0`。MSI の版はここから作られ、形は `major.minor.patch.build`（major と minor は 255 まで、patch と build は 65,535 まで） | `src-tauri/tauri.conf.json`、[Tauri config: WixConfig](https://v2.tauri.app/reference/config/) |
| 古い版の上書き | `allowDowngrades` の既定は `true`（新しい版が入っていても古い版を入れられる）。tauri.conf.json に指定は無い | [Tauri config: WindowsConfig](https://v2.tauri.app/reference/config/) |
| 署名 | 無い（`certificateThumbprint`・`signCommand` の指定が無い）。署名はアプリの実行には要らない。browser から download した file では SmartScreen の警告が出得る | `src-tauri/tauri.conf.json`、[Tauri Windows code signing](https://v2.tauri.app/distribute/sign/windows/) |
| WebView2 | 既定の `downloadBootstrapper`（WebView2 が無いときに download して入れる。network が要る）。Windows 11 には WebView2 が入っている | [Tauri Windows Installer](https://v2.tauri.app/distribute/windows-installer/)、[DEV_SETUP_CHECKLIST.md](DEV_SETUP_CHECKLIST.md) §1.2 |
| データの folder | `identifier`（`com.kosei.inventory`）の名の folder（Windows では `%APPDATA%\com.kosei.inventory`）。DB は `inventory.db` | `src-tauri/tauri.conf.json`、`src-tauri/src/lib.rs` の `prepare_database_with_init`、68 §68.4「実効保存先の常時表示」 |
| backup の置き場 | 設定の `backup_path`。未設定ならデータの folder の `backups` | 71 §71.9 |
| 起動時の自動の backup | migration の後に作られる。新しい版の起動で作られた backup は前の版では開けない | 71 §71.9、22 §16「回復」手順 1 |
| 新しすぎる DB | アプリが扱える版より DB の版が新しいと、何も書かずに起動を止め、「このデータは、より新しい版のアプリで使われています。…」を出す | 22 §3.2 MNT-03-D11 |

## 初回の導入の前に決めること

- **製品名と upgrade code を固定する。** upgrade code は今 `productName` から作られるので、初回の導入の後に製品名を変えると、次の MSI は更新にならず別のアプリとして並んで入る見込み（M4 で確かめる）。初回の導入の前に、製品名を決めて upgrade code を `bundle.windows.wix.upgradeCode` に固定する。これは設定の変更で、本書の外の lane で行う（[backlog](backlog.md) の「MSI 配布手順 docs 化」の項）。決まるまでは店の PC に入れない。
- **版の付け方。** 配布する MSI ごとに `version` を前より大きくする。版を上げずに作った MSI を入れたときの振舞いは未確認（M5）なので、上げずに配布しない。`1.0.0-rc.1` のような後ろの付いた版は MSI の版の形（数字 4 つまで）に無いので使わない。

## 配布の記録

配布ごとに 1 行を、repo の外（管理者の保管場所）に残す。店の事実や日付を repo に書かない。

| 欄 | 中身 |
|---|---|
| アプリの版 | `tauri.conf.json` の `version` |
| commit | MSI を作った commit の SHA |
| 扱える DB の版 | その commit の `src-tauri/src/db/migration.rs` の `migrations()` の最大の `version`。前の版へ戻すときの「旧版の最大の版」になる |
| MSI | file の名前と SHA-256 |
| 更新の前の backup | file の名前と、写しを置いた場所（流れ 3） |
| 確認の結果 | 流れ 4 の起動の後の確認 |

配布した MSI は前の版の分も消さずに保管する。前の版へ戻すときに要る。

## 流れ 1: MSI を作る

開発用の Windows の clone（[DEV_SETUP_CHECKLIST.md](DEV_SETUP_CHECKLIST.md) §4.6 の `C:\Users\Owner\projects\inventory-system-public`）で、PowerShell から行う。

1. 配布する commit を checkout し、`git status` に変更が無いことと、`git log -1` が配布する commit であることを確かめる。
2. `npm ci --ignore-scripts`（[AGENTS.md](../AGENTS.md) の npm 供給網ガード、D-030）。
3. `npm run tauri build`。route の生成は build の中の Vite の plugin が行う。
4. 出来た MSI を `src-tauri\target\release\bundle\msi\` で探す（file の名前の形は未確認、M1）。
5. `Get-FileHash <MSI の path> -Algorithm SHA256` を取り、配布の記録に MSI の名前・SHA-256・commit・扱える DB の版を書く。

## 流れ 2: 初回の導入

前提: [初回の導入の前に決めること](#初回の導入の前に決めること) が済み、予行演習（M1〜M9）が済んでいる。

1. MSI を USB メモリ等で店の PC へ写し、写した file の SHA-256 が配布の記録と同じことを `Get-FileHash` で確かめる。
2. MSI を開いて入れる。管理者の確認（UAC）が出るかと、入る場所は未確認（M2）。SmartScreen の警告が出るかは未確認（M3）。警告が出たら、SHA-256 が記録と同じときだけ続ける。
3. アプリを起動し、ホームが出ることと、データの folder（`%APPDATA%\com.kosei.inventory`）に `inventory.db` ができたことを確かめる。
4. 設定の「バックアップ・復元」で保存先を確かめ、手動バックアップを 1 回作る（68）。
5. 配布の記録の確認の結果を書く。

## 流れ 3: 更新の前の backup

更新の前に、**今入っている版のアプリで** backup を作る。起動時の自動の backup は新しい版の migration の後に作られるので、前の版へ戻すときに使えない（71 §71.9、22 §16「回復」手順 1）。

1. アプリへの入力を止める。
2. 設定の「バックアップ・復元」で手動バックアップを作り、出来た file の名前（`inventory_backup_YYYYMMDD_HHMMSS.db`）を控える。
3. その file を、backup の置き場の外の、日付の付いた folder と PC の外の媒体の 2 か所へ写す。backup の置き場の中だけに置くと、保持日数を過ぎて消される（71 §71.5）。
4. 配布の記録の「更新の前の backup」を書く。
5. アプリの窓を全部閉じ、タスク マネージャーでプロセスが残っていないことを確かめる。

手順 2・3 のどれかが失敗したら、更新を始めない。

## 流れ 4: 版を更新する

1. 流れ 3 を済ませる。
2. 新しい版の MSI を店の PC へ写し、SHA-256 を配布の記録と照らす。
3. アプリが動いていないことを確かめてから MSI を開く。前の版が新しい版に置き換わり、データの folder が残ることは未確認（M4）。アプリが動いたまま MSI を開いたときの振舞いは未確認（M8）。
4. アプリを起動する。起動のときに、新しい版の migration が DB に当たる。
5. 起動の後に確かめる: 代表の商品が出る、過去の日報が出る、在庫の数が前と同じ、取込みの履歴が出る、「バックアップ・復元」の一覧が出る。
6. 配布の記録の確認の結果を書く。手順 5 が済むまで、流れ 3 の写しを消さない。

起動が止まったとき:

- 「このデータは、より新しい版のアプリで使われています。…」が出た: 入れた MSI が DB より古い。データは変わっていない（MNT-03-D11）。配布の記録で一番新しい版の MSI を入れ直す。
- それ以外の起動の失敗（データベースの準備の失敗など）: 入力を始めず、流れ 5 へ進むか、22 §16 の該当する migration の「止まった後の進め方」に従う。

## 流れ 5: 不具合のときに前の版へ戻す

前の版へ戻す前に、新しい版で業務の入力をしたかで分ける。

- **入力する前**: 下の手順で戻せる。
- **入力した後**: 前の版の DB へ戻すと、更新の後に入れた入力は戻らない。まず今の DB を保全し（[migration-recovery-runbook.md](migration-recovery-runbook.md) の手順 5 と同じ移し方）、修正版を作って前へ進むか、戻した後に原本・紙から入れ直すかを決める。決めるのは owner。

DB の扱いは、新しい版で DB の版が上がったかで分ける。配布の記録の「扱える DB の版」を、戻す先と今の版で比べる。

1. **同じとき**（新しい版に migration が無い）: アプリを閉じ、前の版の MSI を入れる（`allowDowngrades` が既定の `true`。上書きで入ることは未確認、M6）。DB はそのまま開く。
2. **上がったとき**: 前の版のアプリは今の DB を開けない（MNT-03-D11）。アプリの中の復元も前の版へは戻せない。[migration-recovery-runbook.md](migration-recovery-runbook.md) の 7 手順で、流れ 3 の backup を置いてから前の版の MSI を入れる。
   - runbook は v8 を例に書いてある。v8 より後の migration を含む版から戻すときは、その migration の 22 の節に戻す手順があるかを確かめる。無ければ DB を戻さず、修正版で前へ進む。
   - runbook の手順 4 は `sqlite3` の CLI を使う。店の PC に `sqlite3` は入っていない見込みなので、backup の写しを開発用の PC へ持って行って確かめる。

DB を戻しても、レジの側（PLU の登録・販売）は戻らない。戻した時点の後に PLU を書き出していたら、そのまま書き出し直さず、レジとの対応を確かめてから扱う。売上の取込みも、戻した取込みの履歴との関係を確かめてから行う。

## 確かめる項目

開発用の Windows（店の PC ではない）で、試験用のデータ（`cargo run --bin seed_demo_data -- --reset`）だけで確かめる。店のデータを使わない。owner の手が要る操作なので、M1〜M9 を一度の回にまとめる。結果は配布の記録と同じ場所に残し、本書の「未確認」を結果で書き換える。

| ID | 確かめること | 確かめ方 | 結果で変わる所 |
|---|---|---|---|
| M1 | MSI の出来る場所と file の名前、NSIS も出来るか | 流れ 1 を行い、`src-tauri\target\release\bundle\` の中を見る | 流れ 1 の手順 4 |
| M2 | 入れるときに管理者の確認が出るか、入る場所（全員向けか自分だけか） | MSI を入れ、UAC の表示と、スタートメニューと「設定 → アプリ」に出る名前と入った folder を見る | 流れ 2 の手順 2 |
| M3 | USB で写した MSI で SmartScreen の警告が出るか | 流れ 2 の手順 1・2 を、browser を通さずに写した file で行う | 流れ 2 の手順 2 |
| M4 | 版を上げた MSI が前の版を置き換え、データの folder と DB が残るか。製品名を変えたときに別のアプリとして並ぶか | 版 A で試験用のデータを入れ、版 B（版を上げただけ）を入れて起動し、データが同じことを見る。製品名だけを変えた版でも入れて「設定 → アプリ」を見る | 流れ 4 の手順 3、[初回の導入の前に決めること](#初回の導入の前に決めること) |
| M5 | 同じ版の MSI をもう一度入れたときの振舞い | 版 A を入れた上に、同じ版で作り直した MSI を入れる | [初回の導入の前に決めること](#初回の導入の前に決めること) |
| M6 | 新しい版の上に前の版の MSI を入れられるか（`allowDowngrades`） | 版 B の上に版 A を入れ、「設定 → アプリ」で版を見る（migration の無い組で） | 流れ 5 の 1 |
| M7 | アンインストールでデータの folder が残るか | 試験用のデータで入れた後にアンインストールし、`%APPDATA%\com.kosei.inventory` を見る | 流れ 5（アンインストールを手順に入れるか） |
| M8 | アプリが動いたまま MSI を開いたときの振舞い | 版 A を起動したまま版 B を入れる | 流れ 4 の手順 3 |
| M9 | 店の PC に WebView2 が入っているか | 店の PC の「設定 → アプリ」で「Microsoft Edge WebView2 Runtime」を探す（予行演習ではなく初回の導入の前に） | 流れ 2（network の無い所での導入の要否） |
