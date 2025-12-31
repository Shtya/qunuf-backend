import { ensureDir, remove } from 'fs-extra';
import { join, extname } from 'path';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';

export function ensureDirectory(dir: string) {
    return ensureDir(dir);
}

export function randName(orig: string) {
    const ext = extname(orig);
    const name = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    return `${name}${ext}`;
}

export async function deleteFile(filePath: string | null) {
    try {
        if (!filePath) return;
        await remove(filePath);
    } catch (err) {
        // ignore missing file errors
    }
}



export const IMG_RE = /^image\/(jpeg|png|webp|gif|bmp|tiff)$/;

export function imageUploadConfig(folder: string, size: number = 10) { // size in MB
    return {
        storage: diskStorage({
            destination: (_req, file, cb) => {
                if (!IMG_RE.test(file.mimetype)) {
                    return cb(new Error('Only image files allowed'), '');
                }

                const dir = join(process.cwd(), 'uploads', 'images', folder);
                if (!existsSync(dir)) {
                    mkdirSync(dir, { recursive: true });
                }
                cb(null, dir);
            },
            filename: (_req, file, cb) => {
                file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
                cb(null, randName(file.originalname));
            }
        }),

        fileFilter: (_req, file, cb) => {
            IMG_RE.test(file.mimetype) ? cb(null, true) : cb(null, false);
        },

        limits: { fileSize: (size || 10) * 1024 * 1024 } // 10MB
    };
}