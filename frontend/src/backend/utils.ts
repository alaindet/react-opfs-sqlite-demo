/**
 * Returns a datetime in the format YYYY-MM-DDTHH:MM:SS
 */
export function toSqlDatetime(_date?: Date): string {
  const date = _date ?? new Date();

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function trimLeft(str: string, prefix: string): string {
  if (str.startsWith(prefix)) {
    return str.slice(prefix.length);
  }
  return str;
}

export function trimRight(str: string, suffix: string): string {
  if (str.endsWith(suffix)) {
    return str.slice(0, -1 * suffix.length);
  }
  return str;
}