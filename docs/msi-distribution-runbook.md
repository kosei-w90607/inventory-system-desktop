# アプリの配布・更新・前の版へ戻す手順（管理者向け）

> **対象**: アプリを管理する人。店の利用者の操作にしない。
> **引く正本**: 起動の拒否は [22-mnt-migration.md](function-design/22-mnt-migration.md) §3.2 の MNT-03-D11、前の版へ戻す DB の手順は [22](function-design/22-mnt-migration.md) §16 の「回復」とその写しの [migration-recovery-runbook.md](migration-recovery-runbook.md)（以下 runbook）、backup と復元は [71-mnt-backup.md](function-design/71-mnt-backup.md) と [68-ui-backup-restore.md](function-design/68-ui-backup-restore.md)。本書は正本の契約を引いて手順を並べ、正本に無い所は安全側に倒した管理者の判断を足す（初回の導入の条件、保管の規則、更新を始めない条件、起動の後の照合、戻し方の分け方、予行演習の退避と復帰）。食い違えば正本が正しい。
> **未確認の点**: 実機で確かめていない振舞いは「未確認（M*n*）」と書き、確かめ方を末尾の [確かめる項目](#確かめる項目) に載せる。店の PC で初回の導入をする前に、M1〜M8 を開発用の Windows で一度にまとめて確かめ（予行演習）、M9 を店の PC で確かめる。

## 今の事実

repo の現物で確かめた（2026-10-17、`src-tauri/tauri.conf.json`・`.github/workflows/`・`src-tauri/src/lib.rs`・`src-tauri/src/db/`）。Tauri の振舞いは公式の資料で確かめた（同日。URL は各行）。

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
| データの folder | `identifier`（`com.kosei.inventory`）の名の folder（Windows では `%APPDATA%\com.kosei.inventory`）。DB は `inventory.db`。開発中の `npm run tauri dev` のアプリも同じ folder を使う | `src-tauri/tauri.conf.json`、`src-tauri/src/lib.rs` の `prepare_database_with_init`、68 §68.4「実効保存先の常時表示」 |
| データの folder に DB が無い起動 | 起動の作業フォルダーに `inventory.db` があれば、それを取り込む。無ければ空の DB を作る | 22 §12、`src-tauri/src/lib.rs` の `prepare_database_with_init` |
| backup の保存先 | 設定の `backup_path`。未設定ならデータの folder の `backups` | 71 §71.9 |
| 起動時の自動の backup | migration の後に作られる。その起動で DB の版が前の版の扱える版を超えていれば、その backup は前の版では開けない | 71 §71.9、22 §16「回復」手順 1 |
| migration の当たり方 | 起動のたびに、DB の版より新しい migration を 1 つずつ当て、1 つごとに COMMIT する。失敗した migration だけが戻り、同じ起動で先に COMMIT した migration の版は残る。COMMIT の後の後始末の失敗でも起動は止まり、そのときは版が記録済み | 22 §3.2 の処理ステップ 5・MNT-03-D1、22 §16「回復」、`src-tauri/src/db/migration.rs` の `migrate` |
| 新しすぎる DB | アプリが扱える版より DB の版が新しいと、DB の論理内容を変えずに起動を止め、「このデータは、より新しい版のアプリで使われています。…」を出す。文言の末尾に「（データの版: *N*、このアプリが扱える版: *M*）」が付く | 22 §3.2 MNT-03-D11・§12.4 の文言の表、`src-tauri/src/db/mod.rs` の `DbError` の表示 |
| 起動を止めた文言の控え | 起動を止めた文言は、表示と同じものが診断ログ（データの folder の `logs`）にも書かれる | `src-tauri/src/lib.rs` の `record_pre_window_fatal` と診断ログの `log_dir` |

## 初回の導入の前に決めること

- **製品名と upgrade code を固定する。** upgrade code は今 `productName` から作られる（[今の事実](#今の事実) の upgrade code の行。公式の資料で確かめた）ので、初回の導入の後に製品名を変えると、次の MSI は更新にならず別のアプリとして並んで入る見込み。初回の導入の前に、製品名を決めて upgrade code を `bundle.windows.wix.upgradeCode` に固定する（固定が効くことは M4 で確かめる）。これは設定の変更で、本書の外の lane で行う（[backlog](backlog.md) の「MSI 配布手順 docs 化」の項）。決まるまでは店の PC に入れない。
- **初回の導入（リリース）の版は、DB の作り直しの起点の migration を全部含む版にする。** 作り直しの起点の migration（22 §16 の vB と、D-118 の棚卸しの runtime の migration。22 §16 の「DB の作り直しを 1 回にまとめる順」）は、行のある DB で止まり、止まった後の進め方が開発・試験 DB の作り直しになっている。店の PC へ初めて入れる版がそれを含まないと、後の更新がその migration で止まり、店の DB を作り直す経路になる。owner の決定（repo 外の回答台帳 TD-311、2026-10-17）: リリースの前（店の PC への初回の導入の前）は開発・試験 DB を何度作り直してもよい。初回の導入をリリースとし、その版はそれまでの作り直しの起点の migration を全部含む。リリースの後は作り直さない。初回の導入では DB が空から作られるので、それらの migration は行の無い DB に当たって止まらない。
- **`identifier`（`com.kosei.inventory`）は変えない。** データの folder の名なので、変えた版は前のデータを見ずに空の DB で起動する。
- **版の付け方。** 配布する MSI ごとに `version` を前より大きくする。版を上げずに作った MSI を入れたときの振舞いは未確認（M5）なので、上げずに配布しない。`1.0.0-rc.1` のような後ろの付いた版は MSI の版の形（数字 4 つまで）に無いので使わない。

## 配布の記録

配布ごとに 1 行を、repo の外（管理者の保管場所）に残す。店の事実や日付を repo に書かない。

| 欄 | 中身 |
|---|---|
| アプリの版 | `tauri.conf.json` の `version` |
| commit | MSI を作った commit の SHA |
| 扱える DB の版 | その commit の `src-tauri/src/db/migration.rs` の `migrations()` の最大の `version`。その版が起動できたときの DB の版で、前の版へ戻すときの「旧版の最大の版」になる |
| MSI | file の名前と SHA-256 |
| 更新の前の backup | file の名前と、写しの場所（流れ 3） |
| 確認の結果 | 流れ 4 の起動の後の確認 |

配布した MSI は前の版の分も消さずに保管する。前の版の MSI と、その版から更新したときの更新の前の backup の写し（流れ 3）は、owner が「その版へ戻す可能性を閉じる」と決めるまで一緒に保つ。

## 流れ 1: MSI を作る

開発用の Windows の clone（[DEV_SETUP_CHECKLIST.md](DEV_SETUP_CHECKLIST.md) §4.6 の `C:\Users\Owner\projects\inventory-system-public`）で、PowerShell から行う。

1. 配布する commit を checkout し、`git status` に変更が無いことと、`git log -1` が配布する commit であることを確かめる。変更が `package-lock.json` だけなら、[DEV_SETUP_CHECKLIST.md](DEV_SETUP_CHECKLIST.md) §4.6 の落とし穴 1 のとおり `git restore package-lock.json` で捨てて確かめ直す。それ以外の変更があれば、その clone の MSI を配布しない。
2. `npm ci --ignore-scripts`（[AGENTS.md](../AGENTS.md) の npm 供給網ガード、D-030）。
3. `npm run tauri build`。route の生成は build の中の Vite の plugin が行う。`failed to run light.exe` で止まったら、Windows の「設定 → アプリ → オプション機能 → Windows のその他の機能」で VBSCRIPT を有効にしてやり直す（[Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)、2026-10-17 に確かめた）。それ以外で止まったら、その commit の MSI を配布しない。
4. 出来た MSI を `src-tauri\target\release\bundle\msi\` で探す（場所と file の名前の形は未確認、M1）。
5. `Get-FileHash <MSI の path> -Algorithm SHA256` を取り、配布の記録に MSI の名前・SHA-256・commit・扱える DB の版を書く。

## 流れ 2: 初回の導入

前提: [初回の導入の前に決めること](#初回の導入の前に決めること) が済み、予行演習（M1〜M8）と店の PC の M9 が済んでいる。

1. MSI を USB メモリ等で店の PC へ写し、写した file の SHA-256 が配布の記録と同じことを `Get-FileHash` で確かめる。違えば入れない。
2. MSI を開いて入れる。管理者の確認（UAC）が出るかと、入る場所は未確認（M2）。SmartScreen の警告が出るかは未確認（M3）。警告が出たら、SHA-256 が記録と同じときだけ続ける。
3. 起動の前に、アプリを起動するショートカットの作業フォルダー（ショートカットのプロパティの「作業フォルダー」。M2）に `inventory.db` が無いことを確かめる。あれば起動せずに止める（データの folder に DB が無い初回の起動は、作業フォルダーの `inventory.db` を取り込む。[今の事実](#今の事実)）。
4. アプリを起動し、ホームが出ることと、データの folder（`%APPDATA%\com.kosei.inventory`）に `inventory.db` ができたことを確かめる。起動しなければ入力を始めず、出た文言を控えて止める。
5. 設定の「バックアップ・復元」で保存先を確かめ、手動バックアップを 1 回作る（68）。
6. 配布の記録の確認の結果を書く。

## 流れ 3: 更新の前の backup

更新の前に、**今入っている版のアプリで** backup を作る。起動時の自動の backup は新しい版の migration の後に作られるので、前の版へ戻すときに使えないことがある（71 §71.9、22 §16「回復」手順 1）。新しい版に migration があるかに関わらず、毎回この流れを行う。

1. アプリへの入力を止める。
2. 代表の商品をいくつか選び、在庫の数を控える（流れ 4 の手順 5 で比べる）。
3. 設定の「バックアップ・復元」で手動バックアップを作り、出来た file の名前（`inventory_backup_YYYYMMDD_HHMMSS.db`）を控える。
4. その file を、backup の保存先の外の、日付の付いた folder と PC の外の媒体の 2 か所へ写す。backup の保存先の中だけだと、保持日数を過ぎて消される（71 §71.5）。
5. 配布の記録の「更新の前の backup」を書く。
6. アプリの窓を全部閉じ、タスク マネージャーでプロセスが残っていないことを確かめる。

手順 3・4 のどれかが失敗したら、更新を始めない。

## 流れ 4: 版を更新する

1. 流れ 3 を済ませる。
2. 新しい版の MSI を店の PC へ写し、SHA-256 を配布の記録と照らす。違えば入れない。
3. アプリが動いていないことを確かめてから MSI を開く。前の版が新しい版に差し替わり、データの folder が残ることは未確認（M4）。アプリが動いたまま MSI を開いたときの振舞いは未確認（M8）。
4. アプリを起動する。起動のときに、新しい版の migration が 1 つずつ DB に当たる。
5. 起動の後に確かめる: 代表の商品が出る、その在庫の数が流れ 3 の手順 2 で控えた数と同じ、過去の日報が出る、取込みの履歴が出る、「バックアップ・復元」の一覧が出る。**全部が合ったときだけ業務の入力を始める。** 1 つでも合わなければ入力を始めず、合わなかった項目と見えた値を控え、アプリを閉じて止める。前の版へ戻すかを owner が決め、戻すなら流れ 5（新しい版での入力は無い）。
6. 配布の記録の確認の結果を書く。流れ 3 の写しは、[配布の記録](#配布の記録) の保管のとおり、前の版の MSI と一緒に保つ。

起動が止まったときは、入力を始めず、出た文言を末尾の詳細まで控える（同じ文言が診断ログにも残る）。

- 「このデータは、より新しい版のアプリで使われています。…」が出た: 入れた MSI が DB より古い。DB の論理内容は変わっていない（MNT-03-D11）。配布の記録で一番新しい版の MSI を入れ直す。
- それ以外の文言（「データベースの準備に失敗したため、起動を中止しました。…」など）: 新しい版を使い続けない。DB が今どの版にあるかは、この文言では決まらない（流れ 5 の「今の DB の版を知る」）。前へ進む（原因を直した版を作り、流れ 3 から更新する）か、前の版へ戻す（流れ 5）かを owner が決め、決めるまで DB を動かさない。22 §16 の migration の「止まった後の進め方」のうち DB の作り直し（vB など）は開発・試験 DB の手順で、店の DB に当てない（店の PC の版は、作り直しの起点の migration を初回の導入で済ませている。[初回の導入の前に決めること](#初回の導入の前に決めること)）。

## 流れ 5: 不具合のときに前の版へ戻す

戻し方は、**今の DB の版**が前の版の扱える版（配布の記録の、前の版の行の「扱える DB の版」）以下かで決まる。前の版のアプリがそのまま開けるのは、今の DB に残った版が前の版の扱える版以下のときだけ（22 §16「回復」）。新しい版で業務の入力をしたかで、残るものが変わる。

**今の DB の版を知る**（DB を動かさずに知る）:

- 新しい版が起動し、流れ 4 の手順 5 まで進んだ: migration は全部当たっている（1 つでも失敗すれば起動が止まる。22 §3.2 の処理ステップ 5・6）。今の DB の版は、配布の記録の新しい版の行の「扱える DB の版」。
- 新しい版の起動が止まった: 止まる前に COMMIT した migration の版は残り、COMMIT の後で止まることもある（[今の事実](#今の事実) の migration の当たり方）ので、文言に出る migration の番号から版を決めない。下の 1 の手順で前の版を入れて起動し、その結果で決める。開けば、今の DB の版は前の版の扱える版以下で、そのまま 1 で戻ったことになる。「このデータは、より新しい版のアプリで使われています。…」で止まれば、文言の末尾の「データの版: *N*」が今の DB の版で、DB の論理内容は変わっていない（MNT-03-D11）。2 で戻す。
- 前の版もそれ以外の文言で止まり、版が分からない: 配布の記録の版で決める（安全側）。新しい版の行の「扱える DB の版」が前の版の行より大きければ、上がったものとして 2 で戻す（2 は DB を動かす前に backup を確かめ、今の DB を消さずに保全する。新しい版は起動していないので、新しい版での入力は無い）。同じなら、この更新で版は上がっていないので、前の版の起動の失敗として文言を控えて止める。

| 今の DB の版 | 新しい版で入力する前 | 新しい版で入力した後 |
|---|---|---|
| 前の版の扱える版以下 | 下の 1 で戻す。失うものは無い | 下の 1 で戻す。DB を動かさないので、入力は残る |
| 前の版の扱える版を超える | 下の 2 で戻す。失うものは無い | 前へ進むか戻すかを owner が決める。決めるまで今の DB を動かさない。前へ進むなら、修正版を作って流れ 3 から更新する。戻すなら下の 2 で、入力は戻らない（今の DB に残る） |

1. **今の DB の版が前の版の扱える版以下のとき**: 新しい版が起動するなら、先に新しい版で手動バックアップを作り、流れ 3 の手順 4 と同じく 2 か所へ写す（この DB の版は前の版で開ける。前の版の MSI を上から入れたときの振舞いは未確認なので〈M6・M7〉、入れる前の状態を残す）。アプリを閉じ、プロセスが残っていないことを確かめてから、前の版の MSI を入れる（`allowDowngrades` が既定の `true`。上書きで入ることは未確認、M6）。DB は動かさず、そのまま起動する。代表の商品・過去の日報・「バックアップ・復元」の一覧が出ることを確かめる。「このデータは、より新しい版のアプリで使われています。…」で止まったら、今の DB の版は前の版の扱える版を超えている。DB は変わっていない（MNT-03-D11）ので、表の下の行に従う。
2. **今の DB の版が前の版の扱える版を超えるとき**: 前の版のアプリは今の DB を開けない（MNT-03-D11）。アプリの中の復元も前の版へは戻せない。runbook の 7 手順で、流れ 3 の backup の写しを使って戻し、最後に前の版の MSI を入れる（1 の確かめで入れ済みなら、runbook の手順 7 は起動だけ）。今の DB は runbook の手順 5 で保全され、更新の後の入力はそこにだけ残る。
   - runbook は v8 を例に書いてある。v8 より後の migration を含む版から戻すときは、その migration の 22 の節に戻す手順があるかを確かめる。無ければ DB を戻さず、修正版で前へ進む。
   - runbook の手順 4 は `sqlite3` の CLI を使う。店の PC に `sqlite3` は入っていない見込みなので、backup の写しを開発用の PC で確かめる。確かめた写しそのものを店の PC へ写し戻し、SHA-256 が開発用の PC で取った値と同じことを確かめてから、runbook の手順 6 でその写しを置く。

DB を戻しても、レジの側（PLU の登録・販売）は戻らない。戻した時点の後に PLU を書き出していたら、そのまま書き出し直さず、レジとの対応を確かめてから扱う。売上の取込みも、戻した取込みの履歴との関係を確かめてから行う。

## 確かめる項目

M1〜M8 は開発用の Windows（店の PC ではない）で、試験用のデータだけで確かめる。店のデータを使わない。owner の手が要る操作なので、M1〜M8 を一度の回にまとめる。M9 は店の PC で、初回の導入の前に確かめる。結果は配布の記録と同じ場所に残し、本書の「未確認」を結果で書き換える。

予行演習の準備と片付け（MSI のアプリと開発中のアプリは `identifier` が同じで、同じデータの folder を使う。M7 のアンインストールと試験用のデータの投入が、開発に使っている DB に当たらないようにする）:

- 始める前に: MSI のアプリと開発中のアプリ（`npm run tauri dev`）を全部止め、タスク マネージャーでプロセスが残っていないことを確かめてから、開発用の Windows の `%APPDATA%\com.kosei.inventory` を丸ごと別名（日付の付いた名）へ退避する。
- 試験用のデータは、版 A の MSI を一度起動してアプリを止めた後、`src-tauri` で版 A と同じ commit を checkout して `cargo run --bin seed_demo_data -- --db "$env:APPDATA\com.kosei.inventory\inventory.db"` で投入する。版 B の commit で投入すると DB が版 B の版になり、版 A が起動を止める（MNT-03-D11）。
- アプリを起動するショートカットの作業フォルダーに `inventory.db` が無いことを確かめる（データの folder に DB が無い起動は、それを取り込む）。
- 終わった後は次の順で戻す: (1) MSI のアプリと開発中のアプリを全部止め、プロセスが残っていないことを確かめる。(2) 予行演習で出来た `%APPDATA%\com.kosei.inventory`（試験用の folder）があれば、消さずに別の名へ変えて保全する。(3) `%APPDATA%` に `com.kosei.inventory` の名の folder が無いことを確かめる。あれば (1) からやり直し、無いと確かめるまで次へ進まない。(4) 退避した folder の名を `com.kosei.inventory` に戻し、中に `inventory.db` があることと、開発中のアプリを起動して開発のデータが出ることを確かめる。

| ID | 確かめること | 確かめ方 | 結果で変わる所 |
|---|---|---|---|
| M1 | MSI の出来る場所と file の名前、NSIS も出来るか | 流れ 1 を行い、`src-tauri\target\release\bundle\` の中を見る | 流れ 1 の手順 4 |
| M2 | 入れるときに管理者の確認が出るか、入る場所（全員向けか自分だけか）、ショートカットの作業フォルダー | MSI を入れ、UAC の表示と、スタートメニューと「設定 → アプリ」に出る名前と入った folder を見る。アプリを起動するショートカットのプロパティの「作業フォルダー」を見る | 流れ 2 の手順 2・3 |
| M3 | USB で写した MSI で SmartScreen の警告が出るか | 流れ 2 の手順 1・2 を、browser を通さずに写した file で行う | 流れ 2 の手順 2 |
| M4 | 版を上げた MSI が前の版に差し替わり、データの folder と DB が残るか。upgrade code の固定が効くか | 版 A で試験用のデータを入れ、版 B（版 A と同じ migration で版の数だけ上げた）を入れて起動し、データが同じことを見る。upgrade code を固定した設定で、製品名だけを変えて版の数を上げた MSI を入れ、「設定 → アプリ」に 1 つだけ出ることを見る（DB の版は変わらない） | 流れ 4 の手順 3、[初回の導入の前に決めること](#初回の導入の前に決めること) |
| M5 | 同じ版の MSI をもう一度入れたときの振舞い | 版 A を入れた上に、同じ版で作り直した MSI を入れる | [初回の導入の前に決めること](#初回の導入の前に決めること) |
| M6 | 新しい版の上に前の版の MSI を入れられるか（`allowDowngrades`） | 版 B の上に版 A を入れ、「設定 → アプリ」で版を見る（migration の無い組で） | 流れ 5 の 1 |
| M7 | アンインストールでデータの folder が残るか | 準備で退避した後の試験用のデータで、アンインストールして `%APPDATA%\com.kosei.inventory` を見る | 流れ 5 の 1（前の版を入れる前の backup）、流れ 5（アンインストールを手順に入れるか） |
| M8 | アプリが動いたまま MSI を開いたときの振舞い | 版 A を起動したまま版 B を入れる | 流れ 4 の手順 3 |
| M9 | 店の PC に WebView2 が入っているか | 店の PC の「設定 → アプリ」で「Microsoft Edge WebView2 Runtime」を探す（初回の導入の前） | 流れ 2（network の無い所での導入の要否） |
