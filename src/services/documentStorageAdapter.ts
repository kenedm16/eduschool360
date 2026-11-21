/**
 * Penyesuai Storan Fail Modul Pusat Dokumentasi Digital Sekolah (V1.5)
 *
 * Mod Semasa (Prototaip):
 * - Menyimpan fail kecil (maksimum 2 MB) dalam storan tempatan pelayar (data URL) supaya
 *   pengguna boleh menguji muat naik dan muat turun fail secara terus tanpa pelayan luar.
 * - Belum bersambung ke Firebase Storage / storan awan.
 *
 * Kesiapsiagaan Fasa 2 (Firebase Storage):
 * - Gantikan `uploadLocalPrototypeFile` dan `downloadDocumentFile` dengan panggilan
 *   `uploadBytes` / `getDownloadURL` daripada SDK `firebase/storage` tanpa mengubah UI.
 */

export const MAX_DOC_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB had storan tempatan pelayar

export const ALLOWED_DOC_EXTENSIONS = [
  'PDF',
  'DOC',
  'DOCX',
  'XLS',
  'XLSX',
  'PPT',
  'PPTX',
  'PNG',
  'JPG',
  'JPEG',
  'CSV',
  'TXT',
] as const;

export interface FileValidationResult {
  valid: boolean;
  extension: string;
  sizeLabel: string;
  error?: string;
}

export function formatFileSizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function validateDocumentFile(file: File): FileValidationResult {
  const ext = (file.name.split('.').pop() || '').toUpperCase();
  const sizeLabel = formatFileSizeLabel(file.size);

  if (!ALLOWED_DOC_EXTENSIONS.includes(ext as (typeof ALLOWED_DOC_EXTENSIONS)[number])) {
    return {
      valid: false,
      extension: ext || 'TIDAK DIKETAHUI',
      sizeLabel,
      error: `Format fail .${ext || '?'} tidak disokong. Format dibenarkan: ${ALLOWED_DOC_EXTENSIONS.join(', ')}.`,
    };
  }

  if (file.size > MAX_DOC_FILE_SIZE_BYTES) {
    return {
      valid: false,
      extension: ext,
      sizeLabel,
      error: `Saiz fail (${sizeLabel}) melebihi had maksimum 2.00 MB untuk penyimpanan setempat pelayar.`,
    };
  }

  return {
    valid: true,
    extension: ext,
    sizeLabel,
  };
}

export interface UploadedLocalFilePayload {
  namaFail: string;
  jenisFail: string;
  saiz: string;
  fileDataUrl: string;
  cloudStoragePath: string;
}

export function readFileForLocalPrototype(
  file: File,
  folderName = 'umum'
): Promise<UploadedLocalFilePayload> {
  return new Promise((resolve, reject) => {
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error || 'Fail tidak sah.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Gagal membaca kandungan fail daripada peranti.'));
        return;
      }
      const safeFolder = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_');
      resolve({
        namaFail: file.name,
        jenisFail: validation.extension,
        saiz: validation.sizeLabel,
        fileDataUrl: result,
        // Laluan sasaran yang sedia dipetakan ke Firebase Storage pada Fasa 2
        cloudStoragePath: `smk-salaping/dokumentasi/${safeFolder}/${Date.now()}_${safeName}`,
      });
    };
    reader.onerror = () => {
      reject(new Error('Ralat semasa membaca fail dari storan peranti.'));
    };
    reader.readAsDataURL(file);
  });
}

export function triggerLocalFileDownload(fileDataUrl: string, fileName: string): void {
  const anchor = document.createElement('a');
  anchor.href = fileDataUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
