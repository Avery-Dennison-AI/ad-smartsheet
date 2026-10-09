export interface ScanResult {
  clean: boolean;
  threat?: string;
}

export interface IVirusScanner {
  scan(filePath: string): Promise<ScanResult>;
}

class NoneScanner implements IVirusScanner {
  async scan(_filePath: string): Promise<ScanResult> {
    return { clean: true };
  }
}

/**
 * Factory for virus scanner implementations.
 * Reads VIRUS_SCANNER from env to select the backend.
 * Currently only 'none' is implemented; 'clamav' is reserved for future use.
 */
export function createScanner(): IVirusScanner {
  const driver = process.env.VIRUS_SCANNER ?? 'none';
  switch (driver) {
    case 'none':
    default:
      return new NoneScanner();
    // case 'clamav': return new ClamAvScanner(); // future
  }
}

export const virusScanner: IVirusScanner = createScanner();
