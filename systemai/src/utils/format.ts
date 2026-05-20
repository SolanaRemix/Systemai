/** Formats bytes into a readable unit string. */
export const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes <= 0) {
    return '0 B';
  }
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** idx).toFixed(1)} ${units[idx]}`;
};
