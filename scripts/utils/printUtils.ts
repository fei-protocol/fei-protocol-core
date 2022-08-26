export function formatNumber(x: any) {
  x = Number(x);
  let ret = x >= 0 ? '+' : '-'; // red or green
  let absX = Math.abs(x);
  let suffix = '';
  if (absX >= 1e17) {
    // 18 decimals... probably
    absX = absX / 1e18;
    suffix = ' (e18)';
  }
  if (absX > 1e6) {
    // > 1M
    absX = absX / 1e6;
    suffix = ' M' + suffix;
  } else if (absX > 1e3) {
    // > 1k
    absX = absX / 1e3;
    suffix = ' k' + suffix;
  }
  const xRound = Math.round(absX * 100) / 100;
  ret += xRound + suffix;
  return ret;
}
