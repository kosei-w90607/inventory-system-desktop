//! D-137 の Compatibility（Gated Amendment 1）: 開発用の bin に Windows の manifest を入れる。
//!
//! tauri の crate の bin は `src-tauri/build.rs` の `tauri_build::build()` から
//! Common Controls v6 の依存を持つ manifest を受けるが、その resource は
//! tauri の crate の bin だけに link され、workspace の member の dev-tools は受けない。
//! manifest が無いと Windows で `generate_bindings` が
//! `STATUS_ENTRYPOINT_NOT_FOUND`（`TaskDialogIndirect`）で起動しない
//! （PR #201 の L3 の 1 回目、2026-10-29）。
//! ここでは MSVC の linker に manifest を埋めさせ、tauri-build の既定の manifest と
//! 同じ Common Controls v6 の依存を 1 つ足す。他の target では何も出さない。
//!
//! ponytail: Windows の GNU の target（`x86_64-pc-windows-gnu`）には入れない
//! （GNU の linker は `/MANIFEST…` を受けず、開発用の Windows は MSVC だけ）。
//! GNU で dev-tools の bin を回す必要が出たら `windres` の resource を足す。

use std::env;

fn main() {
    println!("cargo::rerun-if-changed=build.rs");

    // build script の `cfg!` は host を見るので、target は Cargo の環境変数で読む。
    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let target_env = env::var("CARGO_CFG_TARGET_ENV").unwrap_or_default();
    if target_os == "windows" && target_env == "msvc" {
        println!("cargo::rustc-link-arg=/MANIFEST:EMBED");
        println!(
            "cargo::rustc-link-arg=/MANIFESTDEPENDENCY:type='win32' name='Microsoft.Windows.Common-Controls' version='6.0.0.0' processorArchitecture='*' publicKeyToken='6595b64144ccf1df' language='*'"
        );
    }
}
