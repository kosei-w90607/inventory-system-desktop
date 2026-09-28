export function formatDateTime(value: string): string {
  // DB の YYYY-MM-DDTHH:MM:SS は区切りを半角スペースにするだけで足り、タイムゾーン変換は行わない。
  return value.replace("T", " ");
}
