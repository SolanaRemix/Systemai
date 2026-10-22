export type Risk = 'low' | 'medium' | 'high';

export interface CommandPreview {
  command: string;
  allowed: boolean;
  risk: Risk;
  reason: string;
  matched: string[];
}

interface Rule {
  name: string;
  pattern: RegExp;
  severity: 'deny' | Risk;
}

const rules: Rule[] = [
  { name: 'recursive delete of drive root', pattern: /Remove-Item\s+.*-Recurse.*\b[A-Z]:\\(\s|$)/i, severity: 'deny' },
  { name: 'format volume', pattern: /\bformat\s+[a-z]:|Format-Volume/i, severity: 'deny' },
  { name: 'disk partition wipe', pattern: /Clear-Disk|Remove-Partition|diskpart/i, severity: 'deny' },
  { name: 'rm -rf root', pattern: /\brm\s+-[a-z]*r[a-z]*f?[a-z]*\s+\/(\s|\*|$)/i, severity: 'deny' },
  { name: 'encoded command', pattern: /-EncodedCommand|-enc\s/i, severity: 'deny' },
  { name: 'download and execute', pattern: /(iwr|Invoke-WebRequest|curl|wget)[^|;]*\|\s*(iex|Invoke-Expression|sh|bash)/i, severity: 'deny' },
  { name: 'command chaining/injection', pattern: /[;&|`]|\$\(/, severity: 'high' },
  { name: 'registry modification', pattern: /Set-ItemProperty|New-ItemProperty|reg\s+(add|delete)/i, severity: 'high' },
  { name: 'security feature change', pattern: /Set-MpPreference|Disable-NetFirewallRule|Set-NetFirewallProfile|netsh\s+advfirewall/i, severity: 'high' },
  { name: 'service control', pattern: /Stop-Service|Set-Service|sc\s+(stop|config)/i, severity: 'medium' },
  { name: 'process termination', pattern: /Stop-Process|taskkill/i, severity: 'medium' },
  { name: 'file removal', pattern: /Remove-Item|\bdel\s|\brm\s/i, severity: 'medium' }
];

const order: Record<Risk, number> = { low: 0, medium: 1, high: 2 };

/** Static policy analysis of a command. Never executes anything. */
export const validatePowerShellCommand = (command: string): CommandPreview => {
  const text = command.trim();
  if (!text) return { command, allowed: false, risk: 'high', reason: 'Empty command', matched: [] };
  if (text.length > 2000) return { command, allowed: false, risk: 'high', reason: 'Command exceeds 2000 characters', matched: [] };
  const hits = rules.filter((r) => r.pattern.test(text));
  const denied = hits.filter((h) => h.severity === 'deny');
  let risk: Risk = 'low';
  for (const h of hits) if (h.severity !== 'deny' && order[h.severity] > order[risk]) risk = h.severity;
  if (denied.length) {
    return { command, allowed: false, risk: 'high', reason: `Rejected by policy: ${denied.map((d) => d.name).join(', ')}`, matched: hits.map((h) => h.name) };
  }
  return {
    command,
    allowed: true,
    risk,
    reason: hits.length ? `Allowed with ${risk} risk: ${hits.map((h) => h.name).join(', ')}` : 'No risky patterns detected',
    matched: hits.map((h) => h.name)
  };
};
