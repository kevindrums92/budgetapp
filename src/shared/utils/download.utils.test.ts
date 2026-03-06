import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock platform
vi.mock('./platform', () => ({
  isNative: vi.fn(() => false),
}));

// Mock Capacitor plugins
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    writeFile: vi.fn(() => Promise.resolve({ uri: 'file:///cache/test.pdf' })),
  },
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}));

vi.mock('@capacitor/share', () => ({
  Share: {
    share: vi.fn(() => Promise.resolve()),
  },
}));

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { downloadTextFile, downloadJSON, downloadCSV, downloadBlobFile } from './download.utils';
import { isNative } from './platform';
import { Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { logger } from './logger';

describe('download.utils', () => {
  let mockCreateElement: ReturnType<typeof vi.fn>;
  let mockClick: ReturnType<typeof vi.fn>;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isNative).mockReturnValue(false);

    // Mock DOM APIs
    mockClick = vi.fn();
    mockCreateElement = vi.fn(() => ({
      href: '',
      download: '',
      click: mockClick,
    }));
    mockCreateObjectURL = vi.fn(() => 'blob:http://test/fake-url');
    mockRevokeObjectURL = vi.fn();

    vi.stubGlobal('document', { createElement: mockCreateElement });
    vi.stubGlobal('URL', {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
  });

  describe('downloadTextFile (web)', () => {
    it('should create a blob URL and trigger download', async () => {
      await downloadTextFile('hello world', 'test.txt', 'text/plain');

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobArg = mockCreateObjectURL.mock.calls[0][0];
      expect(blobArg).toBeInstanceOf(Blob);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://test/fake-url');
    });

    it('should set correct filename on anchor element', async () => {
      await downloadTextFile('data', 'report.csv', 'text/csv');

      const anchor = mockCreateElement.mock.results[0].value;
      expect(anchor.download).toBe('report.csv');
    });
  });

  describe('downloadTextFile (native)', () => {
    beforeEach(() => {
      vi.mocked(isNative).mockReturnValue(true);
    });

    it('should write file and share on native', async () => {
      await downloadTextFile('content', 'test.json', 'application/json');

      expect(Filesystem.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'test.json',
          data: 'content',
          directory: 'CACHE',
          encoding: 'utf8',
        }),
      );

      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'file:///cache/test.pdf',
        }),
      );
    });

    it('should handle share cancellation gracefully', async () => {
      vi.mocked(Share.share).mockRejectedValueOnce(new Error('Share canceled by user'));

      // Should not throw
      await expect(downloadTextFile('content', 'test.json', 'application/json')).resolves.toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith('Download', 'Share canceled by user');
    });

    it('should handle Cancel (capitalized) gracefully', async () => {
      vi.mocked(Share.share).mockRejectedValueOnce(new Error('User pressed Cancel'));

      await expect(downloadTextFile('content', 'test.json', 'application/json')).resolves.toBeUndefined();
    });

    it('should throw on non-cancel errors', async () => {
      vi.mocked(Share.share).mockRejectedValueOnce(new Error('Disk full'));

      await expect(downloadTextFile('content', 'test.json', 'application/json'))
        .rejects.toThrow('Error al exportar archivo: Disk full');
    });
  });

  describe('downloadJSON', () => {
    it('should serialize data as formatted JSON and download', async () => {
      const data = { key: 'value', nested: { a: 1 } };
      await downloadJSON(data, 'export');

      const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blobArg).toBeInstanceOf(Blob);

      const anchor = mockCreateElement.mock.results[0].value;
      expect(anchor.download).toBe('export.json');
    });
  });

  describe('downloadCSV', () => {
    it('should prepend BOM and download with .csv extension', async () => {
      await downloadCSV('name,amount\nTest,1000', 'transactions');

      const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
      expect(blobArg).toBeInstanceOf(Blob);

      const anchor = mockCreateElement.mock.results[0].value;
      expect(anchor.download).toBe('transactions.csv');
    });
  });

  describe('downloadBlobFile (web)', () => {
    it('should create object URL from blob and trigger download', async () => {
      const blob = new Blob(['pdf content'], { type: 'application/pdf' });
      await downloadBlobFile(blob, 'report.pdf');

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:http://test/fake-url');
    });

    it('should log and re-throw on web error', async () => {
      mockCreateObjectURL.mockImplementationOnce(() => {
        throw new Error('createObjectURL failed');
      });

      const blob = new Blob(['content']);
      await expect(downloadBlobFile(blob, 'test.pdf')).rejects.toThrow('createObjectURL failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Download',
        'Failed to download blob file on web:',
        expect.any(Error),
      );
    });
  });

  describe('downloadBlobFile (native)', () => {
    beforeEach(() => {
      vi.mocked(isNative).mockReturnValue(true);

      // Mock FileReader for blobToBase64
      const mockFileReader = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        result: 'data:application/pdf;base64,dGVzdA==',
        readAsDataURL: vi.fn(function (this: typeof mockFileReader) {
          setTimeout(() => this.onload?.(), 0);
        }),
      };
      vi.stubGlobal('FileReader', vi.fn(() => mockFileReader));
    });

    it('should convert blob to base64 and share', async () => {
      const blob = new Blob(['test'], { type: 'application/pdf' });
      await downloadBlobFile(blob, 'report.pdf');

      expect(Filesystem.writeFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'report.pdf',
          data: 'dGVzdA==',
          directory: 'CACHE',
        }),
      );

      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'file:///cache/test.pdf',
        }),
      );
    });

    it('should handle share cancellation gracefully for blob files', async () => {
      vi.mocked(Share.share).mockRejectedValueOnce(new Error('User canceled'));

      const blob = new Blob(['test']);
      await expect(downloadBlobFile(blob, 'report.pdf')).resolves.toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith('Download', 'Share canceled by user');
    });

    it('should throw on non-cancel errors for blob files', async () => {
      vi.mocked(Share.share).mockRejectedValueOnce(new Error('Permission denied'));

      const blob = new Blob(['test']);
      await expect(downloadBlobFile(blob, 'report.pdf'))
        .rejects.toThrow('Error al exportar archivo: Permission denied');
    });

    it('should handle blobToBase64 failure', async () => {
      const mockFileReaderFail = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        result: null,
        readAsDataURL: vi.fn(function (this: typeof mockFileReaderFail) {
          setTimeout(() => this.onerror?.(), 0);
        }),
      };
      vi.stubGlobal('FileReader', vi.fn(() => mockFileReaderFail));

      const blob = new Blob(['test']);
      await expect(downloadBlobFile(blob, 'report.pdf'))
        .rejects.toThrow('Error al exportar archivo');
    });

    it('should handle base64 split failure', async () => {
      const mockFileReaderBadResult = {
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        result: 'invalid-no-comma-content',
        readAsDataURL: vi.fn(function (this: typeof mockFileReaderBadResult) {
          setTimeout(() => this.onload?.(), 0);
        }),
      };
      vi.stubGlobal('FileReader', vi.fn(() => mockFileReaderBadResult));

      const blob = new Blob(['test']);
      await expect(downloadBlobFile(blob, 'report.pdf'))
        .rejects.toThrow('Error al exportar archivo');
    });
  });
});
