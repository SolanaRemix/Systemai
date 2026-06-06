export interface CommandPreview {
  command: string;
  allowed: boolean;
  reason: string;
}

const denyPatterns = [/Remove-Item\s+-Recurse\s+C:\\/i, /format\s+c:/i];

export const validatePowerShellCommand = (command: string): CommandPreview => {
  const denied = denyPatterns.some((pattern) => pattern.test(command));
  return {
    command,
    allowed: !denied,
    reason: denied ? 'Command rejected by unsafe pattern policy' : 'Command approved for preview stage'
  };
};
