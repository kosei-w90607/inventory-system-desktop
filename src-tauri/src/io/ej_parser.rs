//! IO-08: EJパーサー
//!
//! カシオSR-S4000が SD に保存する電子ジャーナル（EJ）1 file を、取引単位の記録へ構造復元する。
//! 純関数。DB非依存。
//!
//! docs/function-design/29-io-ej-parser.md に基づく実装。

use encoding_rs::SHIFT_JIS;
use sha2::{Digest, Sha256};
use std::fmt;

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

/// パース成功結果（復元不能の記録や診断があっても返る）
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EjParseResult {
    /// SHA-256ハッシュ（raw bytes基準、hex小文字64文字）
    pub file_hash: String,
    /// 最初の記録ヘッダより前の行（IO-08-D4）
    pub leading_lines: Vec<EjLine>,
    /// file の出現順の記録
    pub records: Vec<EjRecord>,
    pub diagnostics: Vec<EjDiagnostic>,
}

/// 1 行（行番号は 1 始まり、text は decode したままの 24 バイト分）
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EjLine {
    pub line_no: usize,
    pub text: String,
    pub kind: EjLineKind,
}

/// 行種（IO-08-D5）。記録の種類と記録内の位置で決まる
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EjLineKind {
    Separator,
    Quantity {
        quantity: i64,
        unit_price: i64,
    },
    Item {
        name: String,
        amount: i64,
    },
    ItemCount {
        count: i64,
    },
    /// prefix だけで判定したラベル行。値は解釈しない
    Labeled {
        label: &'static str,
    },
    SettlementTitle {
        leading_no: String,
        trailing_no: String,
    },
    AmountOnly,
    SettlementEnd,
    Status {
        label: &'static str,
        result: String,
    },
    Unknown,
}

/// 記録（2 行ヘッダ + 本文）
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EjRecord {
    /// ヘッダ1行目の行番号（2行目は header_line_no + 1）
    pub header_line_no: usize,
    pub mode: EjMode,
    /// 印字日時（`YYYY-MM-DD HH:MM`、変換しない）
    pub printed_at: String,
    /// 番号行の4桁の欄（意味は未検証、文字列のまま）
    pub number_prefix: String,
    /// 番号行の6桁の番号（先頭0を保つ）
    pub number: String,
    pub body: Vec<EjLine>,
    pub restoration: EjRestoration,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EjMode {
    Normal,
    Return,
    Settlement,
    Program,
    Unrecognized(String),
}

/// 復元状態（IO-08-D8）。Unresolved は明細を持たない
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EjRestoration {
    Restored { items: Vec<EjItem>, item_count: i64 },
    NoItems,
    Unresolved { reasons: Vec<EjDiagnosticCode> },
}

/// 復元済みの明細（同名の行を合算しない。返品でも符号を反転しない）
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EjItem {
    /// 名称行の行番号
    pub line_no: usize,
    pub name: String,
    pub quantity: i64,
    /// 数量行があるときだけ
    pub unit_price: Option<i64>,
    pub amount: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EjDiagnostic {
    /// 範囲 File のときは None。範囲 Record のときはヘッダ1行目
    pub line_no: Option<usize>,
    pub code: EjDiagnosticCode,
    pub scope: EjDiagnosticScope,
    /// code ごとの固定文言（行の生の文字列を含めない）
    pub message: &'static str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EjDiagnosticCode {
    UnknownLine,
    InvalidWidth,
    UnrecognizedMode,
    InconsistentRecord,
    IncompleteRecord,
    MissingFinalNewline,
    LeadingFragment,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EjDiagnosticScope {
    Line,
    Record,
    File,
}

/// 致命的エラー（部分結果を返さない）
#[derive(Debug)]
pub enum EjParseError {
    DecodeFailed(String),
    NoRecords(String),
    Empty(String),
}

impl fmt::Display for EjParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            EjParseError::DecodeFailed(msg)
            | EjParseError::NoRecords(msg)
            | EjParseError::Empty(msg) => write!(f, "{}", msg),
        }
    }
}

impl std::error::Error for EjParseError {}

const LINE_WIDTH: usize = 24;
const SEPARATOR: [u8; LINE_WIDTH] = [b'-'; LINE_WIDTH];
const TOTAL_LABELS: [&str; 6] = ["対象計", "内税", "合  計", "お預り", "お  釣", "現金"];
const PAID_LABELS: [&str; 3] = ["入金", "出金", "替"];
const SETTLEMENT_LABELS: [&str; 7] = [
    "総売",
    "純売",
    "純客",
    "現金在高",
    "対象計",
    "内税",
    "消費税合計",
];
const STATUS_LABELS: [&str; 3] = ["SD設定書込み", "SDｶｰﾄﾞ保存", "ｽﾏ-ﾄﾌｫﾝ送信"];

// ---------------------------------------------------------------------------
// 公開関数
// ---------------------------------------------------------------------------

/// EJ 1 file の生バイト列を記録の列へ構造復元する
///
/// 29-io-ej-parser.md IO-08.1〜IO-08.8
pub fn parse_ej(raw_bytes: &[u8]) -> Result<EjParseResult, EjParseError> {
    if raw_bytes.is_empty() {
        return Err(EjParseError::Empty(
            "ファイルが空です。ファイル形式を確認してください".to_string(),
        ));
    }
    let file_hash = format!("{:x}", Sha256::digest(raw_bytes));

    // IO-08-D2: CRLF だけで分割し、改行を正規化しない
    let mut segments = split_crlf(raw_bytes);
    let missing_final_line = if segments.last().is_some_and(|s| s.is_empty()) {
        segments.pop();
        None
    } else {
        Some(segments.len())
    };

    let mut lines = Vec::with_capacity(segments.len());
    for bytes in segments {
        let (text, had_errors) = SHIFT_JIS.decode_without_bom_handling(bytes);
        if had_errors {
            return Err(EjParseError::DecodeFailed(
                "CP932デコードに失敗しました。ファイル形式を確認してください".to_string(),
            ));
        }
        lines.push(RawLine {
            bytes,
            text: text.into_owned(),
        });
    }

    // IO-08-D3: 記録ヘッダの位置
    let mut headers = Vec::new();
    let mut i = 0;
    while i + 1 < lines.len() {
        if let Some(header) = parse_header(&lines[i], &lines[i + 1]) {
            headers.push((i, header));
            i += 2;
        } else {
            i += 1;
        }
    }
    if headers.is_empty() {
        return Err(EjParseError::NoRecords(
            "記録のヘッダがありません。ファイル形式を確認してください".to_string(),
        ));
    }

    let mut diagnostics = Vec::new();

    // IO-08-D4: 最初のヘッダより前は先頭断片
    let first_header = headers[0].0;
    if first_header > 0 {
        diagnostics.push(diagnostic(EjDiagnosticCode::LeadingFragment, None));
    }
    let mut leading_lines = Vec::with_capacity(first_header);
    for (index, raw) in lines[..first_header].iter().enumerate() {
        if raw.bytes.len() != LINE_WIDTH {
            diagnostics.push(diagnostic(EjDiagnosticCode::InvalidWidth, Some(index + 1)));
        }
        leading_lines.push(EjLine {
            line_no: index + 1,
            text: raw.text.clone(),
            kind: EjLineKind::Unknown,
        });
    }

    let ends: Vec<usize> = headers
        .iter()
        .skip(1)
        .map(|(start, _)| *start)
        .chain([lines.len()])
        .collect();
    let records = headers
        .into_iter()
        .zip(ends)
        .map(|((start, header), end)| {
            build_record(
                header,
                start,
                &lines[start + 2..end],
                missing_final_line,
                &mut diagnostics,
            )
        })
        .collect();

    Ok(EjParseResult {
        file_hash,
        leading_lines,
        records,
        diagnostics,
    })
}

// ---------------------------------------------------------------------------
// 内部関数
// ---------------------------------------------------------------------------

struct RawLine<'a> {
    bytes: &'a [u8],
    text: String,
}

struct Header {
    mode: EjMode,
    printed_at: String,
    number_prefix: String,
    number: String,
}

/// CRLF で分割する。最後の要素は最後の CRLF の後（空なら改行で終わっている）
fn split_crlf(raw: &[u8]) -> Vec<&[u8]> {
    let mut segments = Vec::new();
    let mut start = 0;
    let mut i = 0;
    while i + 1 < raw.len() {
        if raw[i] == b'\r' && raw[i + 1] == b'\n' {
            segments.push(&raw[start..i]);
            i += 2;
            start = i;
        } else {
            i += 1;
        }
    }
    segments.push(&raw[start..]);
    segments
}

/// IO-08-D3: モード欄5バイト + `YYYY-MM-DD HH:MM` + 空白3バイト / 空白13バイト + `NNNN-NNNNNN`
fn parse_header(first: &RawLine, second: &RawLine) -> Option<Header> {
    let (a, b) = (first.bytes, second.bytes);
    if a.len() != LINE_WIDTH || b.len() != LINE_WIDTH {
        return None;
    }
    let printed_at = &a[5..21];
    let date_ok = printed_at.iter().enumerate().all(|(i, c)| match i {
        4 | 7 => *c == b'-',
        10 => *c == b' ',
        13 => *c == b':',
        _ => c.is_ascii_digit(),
    });
    let number_ok = b[..13].iter().all(|c| *c == b' ')
        && b[13..17].iter().all(u8::is_ascii_digit)
        && b[17] == b'-'
        && b[18..].iter().all(u8::is_ascii_digit);
    if !date_ok || a[21..] != *b"   " || !number_ok {
        return None;
    }
    // 行全体の decode は成功済みで、6バイト目以降は ASCII のためモード欄だけの decode も失敗しない
    let (mode_field, _) = SHIFT_JIS.decode_without_bom_handling(&a[..5]);
    let mode = match mode_field.trim() {
        "" => EjMode::Normal,
        "戻" => EjMode::Return,
        "精算" => EjMode::Settlement,
        "PGM" => EjMode::Program,
        other => EjMode::Unrecognized(other.to_string()),
    };
    Some(Header {
        mode,
        printed_at: String::from_utf8_lossy(printed_at).into_owned(),
        number_prefix: String::from_utf8_lossy(&b[13..17]).into_owned(),
        number: String::from_utf8_lossy(&b[18..]).into_owned(),
    })
}

fn build_record(
    header: Header,
    start: usize,
    body: &[RawLine],
    missing_final_line: Option<usize>,
    diagnostics: &mut Vec<EjDiagnostic>,
) -> EjRecord {
    let header_line_no = start + 1;
    let mut reasons = Vec::new();
    let mut report = |code, line_no, reasons: &mut Vec<EjDiagnosticCode>| {
        diagnostics.push(diagnostic(code, Some(line_no)));
        if !reasons.contains(&code) {
            reasons.push(code);
        }
    };

    if matches!(header.mode, EjMode::Unrecognized(_)) {
        report(
            EjDiagnosticCode::UnrecognizedMode,
            header_line_no,
            &mut reasons,
        );
    }

    let separator_at = body.iter().position(|raw| raw.bytes == SEPARATOR);
    let paid_only = header.mode == EjMode::Normal
        && body.len() == 1
        && labeled(&body[0].text, &PAID_LABELS).is_some();

    let mut lines = Vec::with_capacity(body.len());
    for (index, raw) in body.iter().enumerate() {
        let line_no = start + 3 + index;
        let text = raw.text.as_str();
        let kind = if raw.bytes.len() != LINE_WIDTH {
            report(EjDiagnosticCode::InvalidWidth, line_no, &mut reasons);
            EjLineKind::Unknown
        } else {
            let kind = match &header.mode {
                EjMode::Normal | EjMode::Return if paid_only => labeled_kind(text, &PAID_LABELS),
                EjMode::Normal | EjMode::Return => match separator_at {
                    Some(at) if index == at => EjLineKind::Separator,
                    Some(at) if index > at => classify_totals(text),
                    _ => classify_items(text),
                },
                EjMode::Settlement => classify_settlement(raw),
                EjMode::Program => classify_program(raw),
                EjMode::Unrecognized(_) => EjLineKind::Unknown,
            };
            // 未知のモードは UnrecognizedMode 1 件で表し、本文の行ごとには出さない
            if kind == EjLineKind::Unknown && !matches!(header.mode, EjMode::Unrecognized(_)) {
                report(EjDiagnosticCode::UnknownLine, line_no, &mut reasons);
            }
            kind
        };
        lines.push(EjLine {
            line_no,
            text: raw.text.clone(),
            kind,
        });
    }

    // IO-08-D2 / D4: 改行の無い最後の行を含む記録は途中で切れたものとする
    let last_line_no = start + 2 + body.len();
    if let Some(line_no) =
        missing_final_line.filter(|n| (header_line_no..=last_line_no).contains(n))
    {
        report(EjDiagnosticCode::MissingFinalNewline, line_no, &mut reasons);
    }

    // 行単位の問題がある記録は、記録内の照合をせずに復元不能とする
    let restoration = if reasons.is_empty() {
        match check_record(&header.mode, &lines, paid_only) {
            Ok(restoration) => restoration,
            Err(code) => {
                report(code, header_line_no, &mut reasons);
                EjRestoration::Unresolved { reasons }
            }
        }
    } else {
        EjRestoration::Unresolved { reasons }
    };

    EjRecord {
        header_line_no,
        mode: header.mode,
        printed_at: header.printed_at,
        number_prefix: header.number_prefix,
        number: header.number,
        body: lines,
        restoration,
    }
}

/// IO-08-D6 / D7: 行種がすべて既知の記録について、閉じと照合を判定する
fn check_record(
    mode: &EjMode,
    lines: &[EjLine],
    paid_only: bool,
) -> Result<EjRestoration, EjDiagnosticCode> {
    let has = |kind: fn(&EjLineKind) -> bool| lines.iter().any(|line| kind(&line.kind));
    match mode {
        EjMode::Normal | EjMode::Return if paid_only => Ok(EjRestoration::NoItems),
        EjMode::Normal | EjMode::Return => restore_items(lines),
        EjMode::Settlement => {
            let titled = lines
                .first()
                .is_some_and(|line| matches!(line.kind, EjLineKind::SettlementTitle { .. }));
            if titled && has(|kind| *kind == EjLineKind::SettlementEnd) {
                Ok(EjRestoration::NoItems)
            } else {
                Err(EjDiagnosticCode::IncompleteRecord)
            }
        }
        EjMode::Program => {
            if has(|kind| matches!(kind, EjLineKind::Status { .. })) {
                Ok(EjRestoration::NoItems)
            } else {
                Err(EjDiagnosticCode::IncompleteRecord)
            }
        }
        EjMode::Unrecognized(_) => Err(EjDiagnosticCode::UnrecognizedMode),
    }
}

/// IO-08-D6: 明細の復元と記録内の照合（数量×単価・点数・合計または現金）
fn restore_items(lines: &[EjLine]) -> Result<EjRestoration, EjDiagnosticCode> {
    use EjDiagnosticCode::{IncompleteRecord, InconsistentRecord};

    let separator = lines
        .iter()
        .position(|line| line.kind == EjLineKind::Separator)
        .ok_or(IncompleteRecord)?;

    let mut items = Vec::new();
    let mut pending_quantity = None;
    for line in &lines[..separator] {
        match &line.kind {
            EjLineKind::Quantity {
                quantity,
                unit_price,
            } => {
                if pending_quantity.replace((*quantity, *unit_price)).is_some() {
                    return Err(InconsistentRecord);
                }
            }
            EjLineKind::Item { name, amount } => {
                let (quantity, unit_price) = match pending_quantity.take() {
                    Some((q, p)) if q.checked_mul(p) == Some(*amount) => (q, Some(p)),
                    Some(_) => return Err(InconsistentRecord),
                    None => (1, None),
                };
                if *amount < 0 {
                    return Err(InconsistentRecord);
                }
                items.push(EjItem {
                    line_no: line.line_no,
                    name: name.clone(),
                    quantity,
                    unit_price,
                    amount: *amount,
                });
            }
            _ => return Err(InconsistentRecord),
        }
    }
    if pending_quantity.is_some() {
        return Err(InconsistentRecord);
    }
    // 明細の無い取引は未観測のため復元しない
    if items.is_empty() {
        return Err(IncompleteRecord);
    }

    let totals = &lines[separator + 1..];
    let item_count = at_most_one(totals.iter().filter_map(|line| match line.kind {
        EjLineKind::ItemCount { count } => Some(count),
        _ => None,
    }))?
    .ok_or(IncompleteRecord)?;
    let total = match labeled_amount(totals, "合  計")? {
        Some(total) => total,
        None => labeled_amount(totals, "現金")?.ok_or(IncompleteRecord)?,
    };

    let quantity_sum = items
        .iter()
        .try_fold(0i64, |sum, item| sum.checked_add(item.quantity));
    let amount_sum = items
        .iter()
        .try_fold(0i64, |sum, item| sum.checked_add(item.amount));
    if quantity_sum != Some(item_count) || amount_sum != Some(total) {
        return Err(InconsistentRecord);
    }

    Ok(EjRestoration::Restored { items, item_count })
}

/// 同じ種類の行が 2 つ以上あれば照合できない
fn at_most_one<T>(mut values: impl Iterator<Item = T>) -> Result<Option<T>, EjDiagnosticCode> {
    let first = values.next();
    if values.next().is_some() {
        return Err(EjDiagnosticCode::InconsistentRecord);
    }
    Ok(first)
}

fn labeled_amount(totals: &[EjLine], label: &str) -> Result<Option<i64>, EjDiagnosticCode> {
    at_most_one(totals.iter().filter(
        |line| matches!(line.kind, EjLineKind::Labeled { label: found } if found == label),
    ))?
    .map(|line| {
        parse_amount(line.text[label.len()..].trim())
            .map(|(amount, _)| amount)
            .ok_or(EjDiagnosticCode::InconsistentRecord)
    })
    .transpose()
}

fn classify_items(text: &str) -> EjLineKind {
    if let Some((quantity, unit_price)) = parse_quantity(text) {
        EjLineKind::Quantity {
            quantity,
            unit_price,
        }
    } else if let Some((name, amount)) = parse_item(text) {
        EjLineKind::Item { name, amount }
    } else {
        EjLineKind::Unknown
    }
}

fn classify_totals(text: &str) -> EjLineKind {
    if let Some(count) = parse_item_count(text) {
        EjLineKind::ItemCount { count }
    } else {
        labeled_kind(text, &TOTAL_LABELS)
    }
}

fn classify_settlement(raw: &RawLine) -> EjLineKind {
    let text = raw.text.as_str();
    if raw.bytes == SEPARATOR {
        EjLineKind::Separator
    } else if text.trim() == "日計明細" {
        EjLineKind::SettlementEnd
    } else if let Some((leading_no, trailing_no)) = parse_settlement_title(text) {
        EjLineKind::SettlementTitle {
            leading_no,
            trailing_no,
        }
    } else if let Some(kind) = parse_status(text) {
        kind
    } else if let Some(label) = labeled(text, &SETTLEMENT_LABELS) {
        EjLineKind::Labeled { label }
    } else if text.starts_with(' ') && parse_amount(text.trim()).is_some() {
        EjLineKind::AmountOnly
    } else {
        EjLineKind::Unknown
    }
}

fn classify_program(raw: &RawLine) -> EjLineKind {
    if raw.bytes == SEPARATOR {
        EjLineKind::Separator
    } else {
        parse_status(&raw.text).unwrap_or(EjLineKind::Unknown)
    }
}

/// ラベルで始まり、その直後が空白の行
fn labeled(text: &str, labels: &[&'static str]) -> Option<&'static str> {
    labels.iter().copied().find(|label| {
        text.strip_prefix(label)
            .is_some_and(|rest| rest.starts_with(' '))
    })
}

fn labeled_kind(text: &str, labels: &[&'static str]) -> EjLineKind {
    labeled(text, labels).map_or(EjLineKind::Unknown, |label| EjLineKind::Labeled { label })
}

/// 空白 + 整数 + ` 点` + 空白 + `@` + 単価 + 空白
fn parse_quantity(text: &str) -> Option<(i64, i64)> {
    if !text.starts_with(' ') {
        return None;
    }
    let (quantity, rest) = text.trim().split_once(" 点")?;
    let price = rest.strip_prefix(' ')?.trim_start().strip_prefix('@')?;
    match parse_amount(price)? {
        (unit_price, false) => Some((parse_count(quantity)?, unit_price)),
        (_, true) => None,
    }
}

/// 空白 + 整数 + ` 点` + 空白
fn parse_item_count(text: &str) -> Option<i64> {
    if !text.starts_with(' ') {
        return None;
    }
    parse_count(text.trim().strip_suffix(" 点")?)
}

/// 名称 + 空白 + 通貨記号つきの金額 token。名称は空白でない文字で始まり、中の空白を許す
fn parse_item(text: &str) -> Option<(String, i64)> {
    if text.starts_with(char::is_whitespace) {
        return None;
    }
    let (name, token) = text.trim_end().rsplit_once(' ')?;
    let name = name.trim_end();
    match parse_amount(token)? {
        (amount, true) if !name.is_empty() => Some((name.to_string(), amount)),
        _ => None,
    }
}

/// `NNNN 日計明細 ... Z NNNN`。両端の数字は意味を解釈しない
fn parse_settlement_title(text: &str) -> Option<(String, String)> {
    let is_no = |s: &str| s.len() == 4 && s.bytes().all(|b| b.is_ascii_digit());
    match text.split_whitespace().collect::<Vec<_>>().as_slice() {
        [leading, "日計明細", .., "Z", trailing] if is_no(leading) && is_no(trailing) => {
            Some((leading.to_string(), trailing.to_string()))
        }
        _ => None,
    }
}

/// 結果欄は文字列のまま保持し、成否を判断しない
fn parse_status(text: &str) -> Option<EjLineKind> {
    STATUS_LABELS.iter().copied().find_map(|label| {
        text.strip_prefix(label).map(|rest| EjLineKind::Status {
            label,
            result: rest.trim().to_string(),
        })
    })
}

fn parse_count(text: &str) -> Option<i64> {
    if text.is_empty() || !text.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    text.parse().ok()
}

/// 金額 token: 任意の `-`、任意の通貨記号（`\` / `￥`）、数字と桁区切り。
/// 通貨記号・数字・桁区切りの幅（半角 / 全角）が token 内でそろわなければ受理しない。
/// 値と、通貨記号があったかを返す
fn parse_amount(token: &str) -> Option<(i64, bool)> {
    let (negative, rest) = match token.strip_prefix('-') {
        Some(rest) => (true, rest),
        None => (false, token),
    };
    let (mut wide, rest) = if let Some(rest) = rest.strip_prefix('\\') {
        (Some(false), rest)
    } else if let Some(rest) = rest.strip_prefix('￥') {
        (Some(true), rest)
    } else {
        (None, rest)
    };
    let has_currency = wide.is_some();

    let mut value: i64 = 0;
    let mut after_digit = false;
    for c in rest.chars() {
        let (digit, is_wide) = match c {
            '0'..='9' | ',' => (c.to_digit(10), false),
            '０'..='９' => (Some(c as u32 - '０' as u32), true),
            '，' => (None, true),
            _ => return None,
        };
        if *wide.get_or_insert(is_wide) != is_wide {
            return None;
        }
        match digit {
            Some(d) => {
                value = value.checked_mul(10)?.checked_add(i64::from(d))?;
                after_digit = true;
            }
            // 桁区切りは数字の後だけ（先頭・連続を受理しない）
            None if after_digit => after_digit = false,
            None => return None,
        }
    }
    if !after_digit {
        return None;
    }
    Some((if negative { -value } else { value }, has_currency))
}

/// IO-08-D8: code ごとの範囲と固定文言
fn diagnostic(code: EjDiagnosticCode, line_no: Option<usize>) -> EjDiagnostic {
    use EjDiagnosticCode::*;
    let (scope, message) = match code {
        UnknownLine => (
            EjDiagnosticScope::Line,
            "解釈できない行があります。この記録は明細を復元できません",
        ),
        InvalidWidth => (
            EjDiagnosticScope::Line,
            "行の長さが24バイトではありません。この記録は明細を復元できません",
        ),
        UnrecognizedMode => (
            EjDiagnosticScope::Record,
            "未知のモードの記録です。この記録は明細を復元できません",
        ),
        InconsistentRecord => (
            EjDiagnosticScope::Record,
            "取引内の数量・点数・合計が一致しません。この記録は明細を復元できません",
        ),
        IncompleteRecord => (
            EjDiagnosticScope::Record,
            "記録に必須の行がありません。この記録は明細を復元できません",
        ),
        MissingFinalNewline => (
            EjDiagnosticScope::Line,
            "ファイルの最後の行に改行がありません。最後の記録は途中で切れたものとして扱います",
        ),
        LeadingFragment => (
            EjDiagnosticScope::File,
            "最初の記録より前に行があります。ファイルは記録の途中から始まっています",
        ),
    };
    EjDiagnostic {
        line_no: if scope == EjDiagnosticScope::File {
            None
        } else {
            line_no
        },
        code,
        scope,
        message,
    }
}

// ===========================================================================
// テスト
// ===========================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use EjDiagnosticCode::*;

    // fixture の名称・金額・日時・番号はすべて架空の値
    const NAME_A: &str = "ｺﾞｳｾｲｱﾒ";
    const NAME_B: &str = "ｶｸｳｸｯｷｰ";
    const AT: &str = "2030-01-02 10:15";

    fn sjis(text: &str) -> Vec<u8> {
        let (bytes, _, unmappable) = SHIFT_JIS.encode(text);
        assert!(!unmappable, "fixture に CP932 で表せない文字があります");
        bytes.into_owned()
    }

    /// 24 バイトまで右を空白で埋める。超えたら fixture の誤りとして panic する
    fn row(text: &str) -> Vec<u8> {
        let mut bytes = sjis(text);
        assert!(
            bytes.len() <= LINE_WIDTH,
            "fixture の行が24バイトを超えています: {text}"
        );
        bytes.resize(LINE_WIDTH, b' ');
        bytes
    }

    fn rows(lines: &[String]) -> Vec<Vec<u8>> {
        lines.iter().map(|line| row(line)).collect()
    }

    /// 各行を CRLF で終える
    fn crlf(rows: Vec<Vec<u8>>) -> Vec<u8> {
        rows.into_iter()
            .flat_map(|mut bytes| {
                bytes.extend_from_slice(b"\r\n");
                bytes
            })
            .collect()
    }

    fn file(lines: &[String]) -> Vec<u8> {
        crlf(rows(lines))
    }

    fn parse(lines: &[String]) -> EjParseResult {
        parse_ej(&file(lines)).expect("Ok を期待しました")
    }

    /// 左と右の間を空白で埋めて 24 バイトにする
    fn lr(left: &str, right: &str) -> String {
        let width = sjis(left).len() + sjis(right).len();
        assert!(
            width <= LINE_WIDTH,
            "fixture の行が24バイトを超えています: {left}{right}"
        );
        format!("{left}{}{right}", " ".repeat(LINE_WIDTH - width))
    }

    /// 半角の `\`・数字・`,` を全角の `￥`・数字・`，` にする
    fn zen(ascii: &str) -> String {
        ascii
            .chars()
            .map(|c| match c {
                '\\' => '￥',
                ',' => '，',
                '0'..='9' => char::from_u32('０' as u32 + c.to_digit(10).unwrap()).unwrap(),
                other => other,
            })
            .collect()
    }

    /// `\1,234` / `-\100`
    fn yen(amount: i64) -> String {
        let digits = amount.abs().to_string();
        let mut grouped = String::new();
        for (i, c) in digits.chars().enumerate() {
            if i > 0 && (digits.len() - i).is_multiple_of(3) {
                grouped.push(',');
            }
            grouped.push(c);
        }
        format!("{}\\{grouped}", if amount < 0 { "-" } else { "" })
    }

    fn header(mode: &str, at: &str, number: &str) -> Vec<String> {
        vec![
            format!("{mode}{}{at}", " ".repeat(5 - sjis(mode).len())),
            format!("{}0001-{number}", " ".repeat(13)),
        ]
    }

    fn sep() -> String {
        "-".repeat(LINE_WIDTH)
    }

    fn item(name: &str, amount: i64) -> String {
        lr(name, &yen(amount))
    }

    fn qty(quantity: i64, unit_price: &str) -> String {
        format!("  {quantity} 点   @{unit_price}")
    }

    fn count(n: i64) -> String {
        lr("", &format!("{n} 点"))
    }

    /// 合計域の全角数字の行
    fn wide(label: &str, amount: i64) -> String {
        lr(label, &zen(&yen(amount)))
    }

    /// 区切りから後（点数・対象計・内税・合計・お預り・お釣）
    fn totals(n: i64, total: i64) -> Vec<String> {
        let tendered = (total / 1000 + 1) * 1000;
        vec![
            sep(),
            count(n),
            lr("対象計", &yen(total)),
            lr("内税", &yen(total / 11)),
            wide("合  計", total),
            wide("お預り", tendered),
            wide("お  釣", tendered - total),
        ]
    }

    fn sale(mode: &str, number: &str, items: &[String], n: i64, total: i64) -> Vec<String> {
        [header(mode, AT, number), items.to_vec(), totals(n, total)].concat()
    }

    fn ok_sale(number: &str) -> Vec<String> {
        sale("", number, &[item(NAME_A, 120), item(NAME_B, 380)], 2, 500)
    }

    fn settlement_body() -> Vec<String> {
        vec![
            "0007 日計明細  Z 0003".to_string(),
            lr("総売", "12"),
            lr("", &yen(4_560)),
            lr("純売", "12"),
            lr("", &yen(4_560)),
            lr("現金在高", &yen(4_560)),
            lr("純客", "5"),
            sep(),
            "日計明細".to_string(),
            lr("SDｶｰﾄﾞ保存", "正常終了"),
            lr("ｽﾏ-ﾄﾌｫﾝ送信", "正常終了"),
        ]
    }

    fn settlement(number: &str) -> Vec<String> {
        [
            header("精算", "2030-01-02 19:00", number),
            settlement_body(),
        ]
        .concat()
    }

    fn program(at: &str, number: &str) -> Vec<String> {
        [
            header("PGM", at, number),
            vec![sep(), lr("SD設定書込み", "正常終了"), sep()],
        ]
        .concat()
    }

    fn items_of(record: &EjRecord) -> &[EjItem] {
        match &record.restoration {
            EjRestoration::Restored { items, .. } => items,
            other => panic!("Restored を期待しました: {other:?}"),
        }
    }

    fn reasons_of(record: &EjRecord) -> &[EjDiagnosticCode] {
        match &record.restoration {
            EjRestoration::Unresolved { reasons } => reasons,
            other => panic!("Unresolved を期待しました: {other:?}"),
        }
    }

    /// (行番号, code, 範囲) の列
    fn diags(result: &EjParseResult) -> Vec<(Option<usize>, EjDiagnosticCode, EjDiagnosticScope)> {
        result
            .diagnostics
            .iter()
            .map(|d| (d.line_no, d.code, d.scope))
            .collect()
    }

    // -----------------------------------------------------------------------
    // 正常系
    // -----------------------------------------------------------------------

    // IO-08-D3 / D5 / D6: 通常販売の明細を復元し、日時と番号を文字列のまま返す
    #[test]
    fn parse_ej_normal_sale_restores_items() {
        let result = parse(&sale(
            "",
            "000123",
            &[item(NAME_A, 120), item(NAME_B, 1_380)],
            2,
            1_500,
        ));

        assert!(result.diagnostics.is_empty());
        assert!(result.leading_lines.is_empty());
        assert_eq!(result.records.len(), 1);
        let record = &result.records[0];
        assert_eq!(record.header_line_no, 1);
        assert_eq!(record.mode, EjMode::Normal);
        assert_eq!(record.printed_at, AT);
        assert_eq!(record.number_prefix, "0001");
        assert_eq!(record.number, "000123");
        assert_eq!(
            record.restoration,
            EjRestoration::Restored {
                items: vec![
                    EjItem {
                        line_no: 3,
                        name: NAME_A.to_string(),
                        quantity: 1,
                        unit_price: None,
                        amount: 120,
                    },
                    EjItem {
                        line_no: 4,
                        name: NAME_B.to_string(),
                        quantity: 1,
                        unit_price: None,
                        amount: 1_380,
                    },
                ],
                item_count: 2,
            }
        );
    }

    // IO-08-D6: 数量行は直後の 1 明細だけに掛かる
    #[test]
    fn parse_ej_quantity_line_applies_to_next_item() {
        let result = parse(&sale(
            "",
            "000124",
            &[qty(3, "120"), item(NAME_A, 360), item(NAME_B, 200)],
            4,
            560,
        ));

        assert!(result.diagnostics.is_empty());
        let items = items_of(&result.records[0]);
        assert_eq!(items.len(), 2);
        assert_eq!((items[0].quantity, items[0].unit_price), (3, Some(120)));
        assert_eq!(items[0].amount, 360);
        assert_eq!((items[1].quantity, items[1].unit_price), (1, None));
    }

    // IO-08-D6: 同じ名称の行を合算しない
    #[test]
    fn parse_ej_repeated_same_name_lines_kept_separate() {
        let result = parse(&sale(
            "",
            "000125",
            &[item(NAME_A, 100), item(NAME_A, 100)],
            2,
            200,
        ));

        assert!(result.diagnostics.is_empty());
        let items = items_of(&result.records[0]);
        assert_eq!(items.len(), 2);
        assert!(items.iter().all(|i| i.name == NAME_A && i.quantity == 1));
        assert_eq!((items[0].line_no, items[1].line_no), (3, 4));
    }

    // IO-08-D3 / D6: 返品モードは Return で、金額の符号を反転しない
    #[test]
    fn parse_ej_return_mode_keeps_positive_amounts() {
        let result = parse(&sale("戻", "000126", &[item(NAME_A, 500)], 1, 500));

        assert!(result.diagnostics.is_empty());
        let record = &result.records[0];
        assert_eq!(record.mode, EjMode::Return);
        let items = items_of(record);
        assert_eq!(items[0].amount, 500);
        assert_eq!(items[0].quantity, 1);
    }

    // IO-08-D6: 合計の無い現金ちょうどの取引は現金の金額で照合し、現金行を明細にしない
    #[test]
    fn parse_ej_exact_cash_tender_without_total_line() {
        let lines = [
            header("", AT, "000127"),
            vec![
                item(NAME_A, 300),
                item(NAME_B, 700),
                sep(),
                count(2),
                lr("対象計", &yen(1_000)),
                lr("内税", &yen(90)),
                wide("現金", 1_000),
            ],
        ]
        .concat();
        let result = parse(&lines);

        assert!(result.diagnostics.is_empty());
        let items = items_of(&result.records[0]);
        assert_eq!(items.len(), 2);
        assert!(items.iter().all(|i| i.name != "現金"));
    }

    // IO-08-D5: 区切りの前はラベルで始まる名称も明細
    #[test]
    fn parse_ej_item_named_like_label_before_separator_is_item() {
        let result = parse(&sale(
            "",
            "000128",
            &[item("現金 ﾄﾚｲ", 300), item(NAME_A, 200)],
            2,
            500,
        ));

        assert!(result.diagnostics.is_empty());
        let items = items_of(&result.records[0]);
        assert_eq!(items[0].name, "現金 ﾄﾚｲ");
        assert_eq!(items[0].amount, 300);
    }

    // IO-08-D7: 入金 / 出金 / 替は明細なし
    #[test]
    fn parse_ej_non_item_records_paid_in_paid_out_exchange() {
        let exchange = "替 ﾘｮｳｶﾞｴ".to_string();
        assert!(!exchange
            .chars()
            .any(|c| c.is_ascii_digit() || c == '\\' || c == '￥'));
        let lines = [
            header("", AT, "000130"),
            vec![wide("入金", 5_000)],
            header("", AT, "000131"),
            vec![wide("出金", 1_200)],
            header("", AT, "000132"),
            vec![exchange],
            ok_sale("000133"),
        ]
        .concat();
        let result = parse(&lines);

        assert!(result.diagnostics.is_empty());
        for (record, label) in result.records.iter().zip(["入金", "出金", "替"]) {
            assert_eq!(record.restoration, EjRestoration::NoItems);
            assert_eq!(record.body[0].kind, EjLineKind::Labeled { label });
        }
        assert_eq!(items_of(&result.records[3]).len(), 2);
    }

    // IO-08-D5 / D7: 設定書込みと精算（返品だけの日の負値を含む）は明細なし
    #[test]
    fn parse_ej_settlement_and_program_records() {
        let return_only_day = [
            header("精算", "2030-01-03 19:00", "000142"),
            vec![
                "0008 日計明細  Z 0004".to_string(),
                lr("総売", "-1"),
                lr("", "-980"),
                lr("純売", "-1"),
                lr("", "-980"),
                lr("現金在高", "-980"),
                lr("対象計", "-980"),
                lr("内税", "-89"),
                lr("消費税合計", "-89"),
                lr("純客", "-1"),
                sep(),
                "日計明細".to_string(),
                lr("SDｶｰﾄﾞ保存", "正常終了"),
            ],
        ]
        .concat();
        let lines = [program(AT, "000140"), settlement("000141"), return_only_day].concat();
        let result = parse(&lines);

        assert!(result.diagnostics.is_empty());
        assert!(result
            .records
            .iter()
            .all(|r| r.restoration == EjRestoration::NoItems));
        let modes: Vec<_> = result.records.iter().map(|r| r.mode.clone()).collect();
        assert_eq!(
            modes,
            [EjMode::Program, EjMode::Settlement, EjMode::Settlement]
        );
        assert_eq!(
            result.records[1].body[0].kind,
            EjLineKind::SettlementTitle {
                leading_no: "0007".to_string(),
                trailing_no: "0003".to_string(),
            }
        );
        assert_eq!(
            result.records[0].body[1].kind,
            EjLineKind::Status {
                label: "SD設定書込み",
                result: "正常終了".to_string(),
            }
        );
        let return_body = &result.records[2].body;
        assert_eq!(return_body[2].kind, EjLineKind::AmountOnly);
        assert_eq!(return_body[7].kind, EjLineKind::Labeled { label: "内税" });
    }

    // IO-08-D3 / D9: 1 file 内の複数精算と前日付の先頭記録をそのまま順に返す
    #[test]
    fn parse_ej_multiple_settlements_in_one_file_and_pre_dated_first_record() {
        let lines = [
            program("2030-01-01 23:50", "000100"),
            ok_sale("000101"),
            settlement("000102"),
            ok_sale("000103"),
            settlement("000104"),
            ok_sale("000105"),
        ]
        .concat();
        let result = parse(&lines);

        assert!(result.diagnostics.is_empty());
        let numbers: Vec<_> = result.records.iter().map(|r| r.number.as_str()).collect();
        assert_eq!(
            numbers,
            ["000100", "000101", "000102", "000103", "000104", "000105"]
        );
        assert_eq!(result.records[0].printed_at, "2030-01-01 23:50");
        assert_eq!(result.records[0].restoration, EjRestoration::NoItems);
        assert_eq!(items_of(&result.records[5]).len(), 2);
    }

    // IO-08-D6: 金額 token の字形
    #[test]
    fn parse_ej_amount_formats() {
        assert_eq!(parse_amount("\\1,234"), Some((1_234, true)));
        assert_eq!(parse_amount("￥１２，３４５"), Some((12_345, true)));
        assert_eq!(parse_amount("-980"), Some((-980, false)));
        assert_eq!(parse_quantity("  1 点   @1,200"), Some((1, 1_200)));
        for mixed in [
            "￥1,234", "\\１２", "1，234", "\\1,,234", "\\,100", "\\100,",
        ] {
            assert_eq!(parse_amount(mixed), None, "受理してはいけない token");
        }

        let result = parse(&sale(
            "",
            "000150",
            &[qty(2, "1,200"), item(NAME_A, 2_400)],
            2,
            2_400,
        ));
        assert!(result.diagnostics.is_empty());
        assert_eq!(items_of(&result.records[0])[0].unit_price, Some(1_200));
    }

    // IO-08-D1: file_hash は生バイトの SHA-256
    #[test]
    fn parse_ej_file_hash_is_raw_sha256() {
        let raw = file(&ok_sale("000151"));
        let result = parse_ej(&raw).unwrap();

        assert_eq!(result.file_hash, format!("{:x}", Sha256::digest(&raw)));
        assert_eq!(result.file_hash.len(), 64);
        assert!(result
            .file_hash
            .chars()
            .all(|c| c.is_ascii_digit() || ('a'..='f').contains(&c)));
        let decoded = SHIFT_JIS.decode_without_bom_handling(&raw).0.into_owned();
        assert_ne!(
            result.file_hash,
            format!("{:x}", Sha256::digest(decoded.as_bytes()))
        );
    }

    // IO-08-D5 / D6: 名称の中の空白を名称に含める
    #[test]
    fn parse_ej_item_name_with_inner_space() {
        let result = parse(&sale("", "000152", &[item("ﾃｽﾄ ｲﾄ A", 200)], 1, 200));

        assert!(result.diagnostics.is_empty());
        let items = items_of(&result.records[0]);
        assert_eq!(items[0].name, "ﾃｽﾄ ｲﾄ A");
        assert_eq!(items[0].amount, 200);
    }

    // IO-08-D6: 0 円の明細を受理する
    #[test]
    fn parse_ej_zero_amount_item_is_restored() {
        let result = parse(&sale(
            "",
            "000153",
            &[item(NAME_A, 0), item(NAME_B, 250)],
            2,
            250,
        ));

        assert!(result.diagnostics.is_empty());
        assert_eq!(items_of(&result.records[0])[0].amount, 0);
    }

    // -----------------------------------------------------------------------
    // 復元不能
    // -----------------------------------------------------------------------

    // IO-08-D5 / D8: 明細域の未知の行はその記録だけを復元不能にする
    #[test]
    fn parse_ej_unknown_line_in_item_region_unresolves_record_only() {
        let first = ok_sale("000160");
        let broken = sale(
            "",
            "000161",
            &[item(NAME_A, 120), lr("ﾃｲｾｲﾋｮｳｼﾞ", ""), item(NAME_B, 380)],
            2,
            500,
        );
        let unknown_line_no = first.len() + 4;
        let result = parse(&[first, broken, ok_sale("000162")].concat());

        assert!(matches!(
            result.records[1].restoration,
            EjRestoration::Unresolved { .. }
        ));
        assert_eq!(reasons_of(&result.records[1]), [UnknownLine]);
        assert_eq!(
            diags(&result),
            [(Some(unknown_line_no), UnknownLine, EjDiagnosticScope::Line)]
        );
        assert_eq!(items_of(&result.records[0]).len(), 2);
        assert_eq!(items_of(&result.records[2]).len(), 2);
    }

    // IO-08-D5: 合計域の未知のラベル
    #[test]
    fn parse_ej_unknown_line_after_separator_unresolves_record() {
        let mut lines = ok_sale("000163");
        lines.insert(6, wide("ﾃｽﾄﾊﾞﾗｲ", 500));
        let result = parse(&lines);

        assert_eq!(reasons_of(&result.records[0]), [UnknownLine]);
        assert_eq!(
            diags(&result),
            [(Some(7), UnknownLine, EjDiagnosticScope::Line)]
        );
    }

    // IO-08-D3: 未知のモードは Unrecognized で復元しない
    #[test]
    fn parse_ej_unrecognized_header_mode_unresolves_record() {
        let result = parse(&sale("点検", "000164", &[item(NAME_A, 100)], 1, 100));

        let record = &result.records[0];
        assert_eq!(record.mode, EjMode::Unrecognized("点検".to_string()));
        assert_eq!(reasons_of(record), [UnrecognizedMode]);
        assert_eq!(
            diags(&result),
            [(Some(1), UnrecognizedMode, EjDiagnosticScope::Record)]
        );
    }

    // IO-08-D6: 点数 ≠ 数量の合計
    #[test]
    fn parse_ej_item_count_mismatch_unresolves() {
        let result = parse(&sale(
            "",
            "000165",
            &[item(NAME_A, 100), item(NAME_B, 200)],
            3,
            300,
        ));

        assert_eq!(reasons_of(&result.records[0]), [InconsistentRecord]);
        assert_eq!(
            diags(&result),
            [(Some(1), InconsistentRecord, EjDiagnosticScope::Record)]
        );
    }

    // IO-08-D6: 数量 × 単価 ≠ 金額
    #[test]
    fn parse_ej_quantity_price_mismatch_unresolves() {
        let result = parse(&sale(
            "",
            "000166",
            &[qty(2, "100"), item(NAME_A, 300)],
            2,
            300,
        ));

        assert_eq!(reasons_of(&result.records[0]), [InconsistentRecord]);
    }

    // IO-08-D6: 合計 ≠ 明細の金額の合計
    #[test]
    fn parse_ej_total_mismatch_unresolves() {
        let result = parse(&sale(
            "",
            "000167",
            &[item(NAME_A, 100), item(NAME_B, 200)],
            2,
            400,
        ));

        assert_eq!(reasons_of(&result.records[0]), [InconsistentRecord]);
    }

    // IO-08-D6: 明細の金額は 0 以上
    #[test]
    fn parse_ej_negative_item_amount_unresolves() {
        let result = parse(&sale(
            "",
            "000168",
            &[item(NAME_A, 300), item(NAME_B, -100)],
            2,
            200,
        ));

        assert_eq!(reasons_of(&result.records[0]), [InconsistentRecord]);
    }

    // IO-08-D6: 数量行の直後が明細でない
    #[test]
    fn parse_ej_quantity_line_not_followed_by_item_unresolves() {
        let result = parse(&sale(
            "",
            "000169",
            &[item(NAME_A, 100), qty(2, "100")],
            3,
            300,
        ));

        assert_eq!(reasons_of(&result.records[0]), [InconsistentRecord]);
    }

    // IO-08-D4 / D6 / D7: EOF を記録の閉じにしない
    #[test]
    fn parse_ej_record_truncated_at_eof_unresolves() {
        let sale_cut = [
            ok_sale("000170"),
            header("", AT, "000171"),
            vec![item(NAME_A, 100), item(NAME_B, 200)],
        ]
        .concat();
        let result = parse(&sale_cut);
        assert_eq!(items_of(&result.records[0]).len(), 2);
        assert_eq!(reasons_of(&result.records[1]), [IncompleteRecord]);

        let settlement_cut: Vec<String> = settlement("000172").into_iter().take(6).collect();
        let result = parse(&settlement_cut);
        assert_eq!(reasons_of(&result.records[0]), [IncompleteRecord]);
    }

    // IO-08-D2: 最終改行なしは診断を出し、最後の行も記録に残す
    #[test]
    fn parse_ej_missing_final_crlf_reports_diagnostic() {
        let lines = [ok_sale("000173"), ok_sale("000174")].concat();
        let mut raw = file(&lines);
        raw.truncate(raw.len() - 2);
        let result = parse_ej(&raw).unwrap();

        let last = lines.len();
        assert_eq!(
            diags(&result),
            [(Some(last), MissingFinalNewline, EjDiagnosticScope::Line)]
        );
        assert_eq!(items_of(&result.records[0]).len(), 2);
        assert_eq!(reasons_of(&result.records[1]), [MissingFinalNewline]);
        assert_eq!(result.records[1].body.last().unwrap().line_no, last);
    }

    // IO-08-D2: 23 / 25 バイトの行・孤立した LF / CR を正規化せず InvalidWidth にする
    #[test]
    fn parse_ej_invalid_width_line_unresolves_record() {
        let mut short = row(&item(NAME_A, 120));
        short.remove(8);
        let mut long = row(&item(NAME_A, 120));
        long.insert(8, b' ');
        let mut lone_lf = row(&item(NAME_A, 120));
        lone_lf.push(b'\n');
        lone_lf.extend(row(&item(NAME_B, 380)));
        let mut lone_cr = row(&item(NAME_A, 120));
        lone_cr.push(b'\r');
        lone_cr.extend(row(&item(NAME_B, 380)));

        let mut all = rows(&ok_sale("000175"));
        let mut expected = Vec::new();
        for (n, broken) in [short, long, lone_lf, lone_cr].into_iter().enumerate() {
            all.extend(rows(&header("", AT, &format!("00017{}", 6 + n))));
            all.push(broken);
            expected.push((Some(all.len()), InvalidWidth, EjDiagnosticScope::Line));
            all.extend(rows(&totals(2, 500)));
        }
        let result = parse_ej(&crlf(all)).unwrap();

        assert_eq!(diags(&result), expected);
        assert_eq!(items_of(&result.records[0]).len(), 2);
        for record in &result.records[1..] {
            assert_eq!(reasons_of(record), [InvalidWidth]);
            assert_eq!(record.body[0].kind, EjLineKind::Unknown);
        }
    }

    // IO-08-D4: 最初のヘッダより前の行は先頭断片
    #[test]
    fn parse_ej_leading_lines_before_first_header_are_reported() {
        let lines = [vec![wide("お  釣", 500), sep()], ok_sale("000180")].concat();
        let result = parse(&lines);

        let leading: Vec<_> = result.leading_lines.iter().map(|l| l.line_no).collect();
        assert_eq!(leading, [1, 2]);
        assert_eq!(
            diags(&result),
            [(None, LeadingFragment, EjDiagnosticScope::File)]
        );
        let record = &result.records[0];
        assert_eq!(record.header_line_no, 3);
        assert_eq!(record.body.first().unwrap().line_no, 5);
        assert_eq!(items_of(record).len(), 2);
    }

    // IO-08-D5 / D6: 小数の数量は受理しない
    #[test]
    fn parse_ej_decimal_quantity_unresolves() {
        let result = parse(&sale(
            "",
            "000181",
            &["  1.3 点   @100".to_string(), item(NAME_A, 130)],
            1,
            130,
        ));

        assert_eq!(reasons_of(&result.records[0]), [UnknownLine]);
        assert_eq!(result.records[0].body[0].kind, EjLineKind::Unknown);
    }

    // IO-08-D5 / D7: 精算の本文の未知の行
    #[test]
    fn parse_ej_unknown_line_in_settlement_unresolves() {
        let mut lines = settlement("000182");
        lines.insert(3, lr("ﾃｽﾄｺｳﾓｸ", "12"));
        let result = parse(&lines);

        assert_eq!(reasons_of(&result.records[0]), [UnknownLine]);
        assert_eq!(
            diags(&result),
            [(Some(4), UnknownLine, EjDiagnosticScope::Line)]
        );
    }

    // IO-08-D7: 本文が題で始まらない精算
    #[test]
    fn parse_ej_settlement_not_starting_with_title_unresolves() {
        let mut lines = settlement("000183");
        lines.remove(2);
        let result = parse(&lines);

        assert_eq!(reasons_of(&result.records[0]), [IncompleteRecord]);
    }

    // IO-08-D7: PGM の本文は区切りと Status だけ
    #[test]
    fn parse_ej_program_body_with_other_line_unresolves() {
        let mut lines = program(AT, "000184");
        lines.insert(3, item(NAME_A, 100));
        lines.extend([header("PGM", AT, "000185"), vec![sep(), sep()]].concat());
        let result = parse(&lines);

        assert_eq!(reasons_of(&result.records[0]), [UnknownLine]);
        assert_eq!(reasons_of(&result.records[1]), [IncompleteRecord]);
    }

    // IO-08-D6: 点数はあるが合計も現金も無い
    #[test]
    fn parse_ej_count_without_total_or_cash_unresolves() {
        let lines = [
            header("", AT, "000186"),
            vec![
                item(NAME_A, 100),
                sep(),
                count(1),
                lr("対象計", &yen(100)),
                lr("内税", &yen(9)),
                wide("お預り", 100),
            ],
        ]
        .concat();
        let result = parse(&lines);

        assert_eq!(reasons_of(&result.records[0]), [IncompleteRecord]);
        assert_eq!(
            diags(&result),
            [(Some(1), IncompleteRecord, EjDiagnosticScope::Record)]
        );
    }

    // IO-08-D6: 本文 0 行の通常の記録
    #[test]
    fn parse_ej_header_only_record_unresolves() {
        let result = parse(&[header("", AT, "000187"), ok_sale("000188")].concat());

        assert!(result.records[0].body.is_empty());
        assert_eq!(reasons_of(&result.records[0]), [IncompleteRecord]);
        assert_eq!(items_of(&result.records[1]).len(), 2);
    }

    // -----------------------------------------------------------------------
    // 致命的エラー
    // -----------------------------------------------------------------------

    // IO-08-D1: CP932 として不正なバイト列
    #[test]
    fn parse_ej_decode_failure_is_fatal() {
        let mut broken = vec![0x81, 0x20];
        broken.resize(LINE_WIDTH, b' ');
        let mut all = rows(&ok_sale("000190"));
        all.push(broken);
        match parse_ej(&crlf(all)) {
            Err(EjParseError::DecodeFailed(message)) => assert_eq!(
                message,
                "CP932デコードに失敗しました。ファイル形式を確認してください"
            ),
            other => panic!("DecodeFailed を期待しました: {other:?}"),
        }
    }

    // IO-08-D1: 記録ヘッダが 1 つも無い
    #[test]
    fn parse_ej_no_record_header_is_fatal() {
        let raw = file(&[item(NAME_A, 100), sep(), count(1)]);
        match parse_ej(&raw) {
            Err(EjParseError::NoRecords(message)) => assert_eq!(
                message,
                "記録のヘッダがありません。ファイル形式を確認してください"
            ),
            other => panic!("NoRecords を期待しました: {other:?}"),
        }
    }

    // IO-08-D1: 空入力
    #[test]
    fn parse_ej_empty_input_is_fatal() {
        match parse_ej(&[]) {
            Err(EjParseError::Empty(message)) => {
                assert_eq!(message, "ファイルが空です。ファイル形式を確認してください")
            }
            other => panic!("Empty を期待しました: {other:?}"),
        }
    }

    // -----------------------------------------------------------------------
    // 不変条件
    // -----------------------------------------------------------------------

    /// 7 code をすべて含む file（最後の行は改行なし）
    fn mixed_file() -> (Vec<u8>, usize) {
        let mut wide_row = row(&item(NAME_B, 380));
        wide_row.push(b' ');
        let mut all = rows(&[sep()]);
        all.extend(rows(&ok_sale("000200")));
        all.extend(rows(&sale(
            "",
            "000201",
            &[item(NAME_A, 120), lr("ﾃｲｾｲﾋｮｳｼﾞ", "")],
            1,
            120,
        )));
        all.extend(rows(&header("", AT, "000202")));
        all.push(wide_row);
        all.extend(rows(&totals(1, 380)));
        all.extend(rows(&sale("点検", "000203", &[item(NAME_A, 100)], 1, 100)));
        all.extend(rows(&sale("", "000204", &[item(NAME_A, 100)], 2, 100)));
        all.extend(rows(&program(AT, "000205")));
        all.extend(rows(&settlement("000206")));
        all.extend(rows(
            &[header("", AT, "000207"), vec![wide("入金", 3_000)]].concat(),
        ));
        all.extend(rows(&header("", AT, "000208")));
        all.extend(rows(&ok_sale("000209")));
        let n = all.len();
        let mut raw = crlf(all);
        raw.truncate(raw.len() - 2);
        (raw, n)
    }

    // 不変条件 / IO-08-D8: どの行も失われず、診断の文言に生の行が入らない
    #[test]
    fn parse_ej_every_line_is_accounted_for() {
        let (raw, n) = mixed_file();
        let result = parse_ej(&raw).unwrap();

        let body_lines: usize = result.records.iter().map(|r| r.body.len()).sum();
        assert_eq!(
            result.leading_lines.len() + 2 * result.records.len() + body_lines,
            n
        );

        let mut covered: Vec<usize> = result.leading_lines.iter().map(|l| l.line_no).collect();
        for record in &result.records {
            covered.extend([record.header_line_no, record.header_line_no + 1]);
            covered.extend(record.body.iter().map(|l| l.line_no));
        }
        covered.sort_unstable();
        assert_eq!(covered, (1..=n).collect::<Vec<_>>());

        assert!(!result.diagnostics.is_empty());
        for diagnostic in &result.diagnostics {
            for name in [NAME_A, NAME_B, "ﾃｲｾｲﾋｮｳｼﾞ", "点検"] {
                assert!(
                    !diagnostic.message.contains(name),
                    "文言に名称が入っています"
                );
            }
        }
    }

    // IO-08-D8: 診断の message は code ごとの固定文言と完全一致する
    #[test]
    fn parse_ej_diagnostic_messages_are_fixed_texts() {
        let expected = |code| match code {
            UnknownLine => "解釈できない行があります。この記録は明細を復元できません",
            InvalidWidth => "行の長さが24バイトではありません。この記録は明細を復元できません",
            UnrecognizedMode => "未知のモードの記録です。この記録は明細を復元できません",
            InconsistentRecord => {
                "取引内の数量・点数・合計が一致しません。この記録は明細を復元できません"
            }
            IncompleteRecord => "記録に必須の行がありません。この記録は明細を復元できません",
            MissingFinalNewline => {
                "ファイルの最後の行に改行がありません。最後の記録は途中で切れたものとして扱います"
            }
            LeadingFragment => {
                "最初の記録より前に行があります。ファイルは記録の途中から始まっています"
            }
        };
        let (raw, _) = mixed_file();
        let result = parse_ej(&raw).unwrap();

        let mut codes: Vec<_> = result.diagnostics.iter().map(|d| d.code).collect();
        codes.dedup();
        assert_eq!(
            codes,
            [
                LeadingFragment,
                UnknownLine,
                InvalidWidth,
                UnrecognizedMode,
                InconsistentRecord,
                IncompleteRecord,
                MissingFinalNewline,
            ]
        );
        for diagnostic in &result.diagnostics {
            assert_eq!(diagnostic.message, expected(diagnostic.code));
        }
    }

    // -----------------------------------------------------------------------
    // 実物確認（Coordinator 手元、CI では実行しない）
    // -----------------------------------------------------------------------

    // IO-08-D5〜D7: 実物 EJ の構造への一致。出力は件数だけ
    #[test]
    #[ignore = "INVENTORY_EJ_PROBE_DIR に実物のEJを置いた dir を与えて手元で実行する"]
    fn real_ej_structure_probe() {
        use std::collections::BTreeMap;

        let dir = std::env::var_os("INVENTORY_EJ_PROBE_DIR")
            .expect("INVENTORY_EJ_PROBE_DIR が未設定です");
        let mut paths: Vec<_> = std::fs::read_dir(dir)
            .expect("dir を読めません")
            .map(|entry| entry.expect("dir の entry を読めません").path())
            .collect();
        paths.sort();

        let (mut read, mut skipped, mut fatal) = (0, 0, 0);
        let mut modes: BTreeMap<&str, usize> = BTreeMap::new();
        let mut restorations: BTreeMap<&str, usize> = BTreeMap::new();
        let mut codes: BTreeMap<String, usize> = BTreeMap::new();
        for path in paths {
            let is_txt = path.is_file()
                && path
                    .extension()
                    .and_then(|ext| ext.to_str())
                    .is_some_and(|ext| ext.eq_ignore_ascii_case("txt"));
            if !is_txt {
                skipped += 1;
                continue;
            }
            read += 1;
            let bytes = std::fs::read(&path).expect("file を読めません");
            let Ok(result) = parse_ej(&bytes) else {
                fatal += 1;
                continue;
            };
            for record in &result.records {
                let mode = match record.mode {
                    EjMode::Normal => "Normal",
                    EjMode::Return => "Return",
                    EjMode::Settlement => "Settlement",
                    EjMode::Program => "Program",
                    EjMode::Unrecognized(_) => "Unrecognized",
                };
                *modes.entry(mode).or_default() += 1;
                let restoration = match record.restoration {
                    EjRestoration::Restored { .. } => "Restored",
                    EjRestoration::NoItems => "NoItems",
                    EjRestoration::Unresolved { .. } => "Unresolved",
                };
                *restorations.entry(restoration).or_default() += 1;
            }
            for diagnostic in &result.diagnostics {
                *codes.entry(format!("{:?}", diagnostic.code)).or_default() += 1;
            }
        }

        println!("files_read {read} files_skipped {skipped} fatal {fatal}");
        println!("modes {modes:?}");
        println!("restorations {restorations:?}");
        println!("diagnostics {codes:?}");
        assert!(read > 0, "読んだ file が 0 本です");
        assert_eq!(fatal, 0);
        assert_eq!(restorations.get("Unresolved"), None);
        assert!(codes.is_empty());
    }
}
