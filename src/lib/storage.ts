import { User } from "firebase/auth";
import { buildApiUrl } from '@/lib/api-config';

const BUNNY_CDN_URL = process.env.NEXT_PUBLIC_BUNNY_CDN_URL || "https://histoview.b-cdn.net";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

function getTenantId(user: User): string {
  return `tenant_${user.uid}`;
}

function compressImage(file: File, maxWidth: number, quality: number): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
              type: 'image/webp',
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };
  });
}

export const bunnyStorage = {
  async uploadFile(user: User, file: File, folder: string = "products"): Promise<UploadResult> {
    try {
      const compressedFile = await compressImage(file, 800, 0.7);

      const token = await user.getIdToken(true);

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('folder', folder);

      const response = await fetch(buildApiUrl('/api/upload'), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Upload failed' };
      }

      return { success: true, url: data.url };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Upload failed" };
    }
  },

  async deleteFile(user: User, fileUrl: string): Promise<boolean> {
    try {
      const token = await user.getIdToken(true);
      const response = await fetch(buildApiUrl(`/api/upload?url=${encodeURIComponent(fileUrl)}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  getFileUrl(user: User, filename: string, folder: string = "products"): string {
    if (!BUNNY_CDN_URL) return "";
    const tenantId = getTenantId(user);
    return `${BUNNY_CDN_URL}/${tenantId}/${folder}/${filename}`;
  },
};