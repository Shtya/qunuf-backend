import { ensureDir, remove } from 'fs-extra';
import { join, extname } from 'path';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

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


// Regex to strictly allow only PDF files
export const PDF_RE = /^application\/pdf$/;

export function fileUploadConfig(folder: string, size: number = 20, type = PDF_RE) { // Default 20MB for docs
    return {
        storage: diskStorage({
            destination: (_req, file, cb) => {
                // Check if it is a PDF
                if (!type.test(file.mimetype)) {
                    // Extracting extension from mimetype for a clearer general message
                    const allowedExt = file.mimetype.split('/')[1]?.toUpperCase() || 'requested';
                    return cb(new Error(`Invalid file format. The uploaded file type is not allowed.`), '');
                }

                // Store in uploads/documents instead of uploads/images
                const dir = join(process.cwd(), 'uploads', 'documents', folder);
                if (!existsSync(dir)) {
                    mkdirSync(dir, { recursive: true });
                }
                cb(null, dir);
            },
            filename: (_req, file, cb) => {
                // Ensure filename supports UTF8 characters (important for Arabic filenames)
                file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
                cb(null, randName(file.originalname)); // Using your existing randName helper
            }
        }),

        fileFilter: (_req, file, cb) => {
            type.test(file.mimetype) ? cb(null, true) : cb(null, false);
        },

        limits: { fileSize: (size || 20) * 1024 * 1024 } // 20MB limit
    };
}



export function propertyUploadConfig() {
    // Set the limit to the LARGEST allowed size (e.g., 30MB for the PDF)
    const MAX_SIZE_MB = 30;

    return {
        storage: diskStorage({
            destination: (req, file, cb) => {
                let folder = '';

                // 1. LOGIC FOR IMAGES
                if (file.fieldname === 'images') {
                    if (!IMG_RE.test(file.mimetype)) {
                        return cb(new BadRequestException('Field "images" must contain image files'), '');
                    }
                    folder = 'uploads/images/properties';
                }
                // 2. LOGIC FOR DOCUMENTS
                else if (file.fieldname === 'documentImage') {
                    if (!PDF_RE.test(file.mimetype)) {
                        return cb(new BadRequestException('Field "documentImage" must be a PDF'), '');
                    }
                    folder = 'uploads/documents/properties';
                }

                file.is_primary = true;

                // Create directory if it doesn't exist
                const dir = join(process.cwd(), folder);
                if (!existsSync(dir)) {
                    mkdirSync(dir, { recursive: true });
                }
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                // UTF-8 support for filenames
                file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            },
        }),

        fileFilter: (req, file, cb) => {
            // Allow Images ONLY for the 'images' field
            if (file.fieldname === 'images' && IMG_RE.test(file.mimetype)) {
                return cb(null, true);
            }
            // Allow PDFs ONLY for the 'documentImage' field
            if (file.fieldname === 'documentImage' && PDF_RE.test(file.mimetype)) {
                return cb(null, true);
            }

            return cb(new BadRequestException(`Invalid file type for field ${file.fieldname}`), false);
        },

        limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 }, // Global limit (30MB)
    };
}