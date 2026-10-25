import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Exporte et partage un fichier texte (JSON ou CSV) via le système natif Android
 * ou via téléchargement navigateur sur le Web.
 */
export async function exportAndShareTextFile(params: {
  filename: string;
  content: string;
  mimeType: string;
  dialogTitle: string;
}): Promise<{ method: 'native_share' | 'browser_download'; pathOrName: string }> {
  const { filename, content, mimeType, dialogTitle } = params;

  if (Capacitor.isNativePlatform()) {
    try {
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: dialogTitle,
        url: writeResult.uri,
        dialogTitle,
      });

      return { method: 'native_share', pathOrName: writeResult.uri };
    } catch {
      // Fallback téléchargement si le partage natif est annulé
    }
  }

  if (typeof document !== 'undefined') {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return { method: 'browser_download', pathOrName: filename };
}
