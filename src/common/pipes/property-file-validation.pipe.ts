import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { unlinkSync, existsSync } from 'fs';

@Injectable()
export class PropertyFileValidationPipe implements PipeTransform {
    transform(files: { images?: any[]; documentImage?: any[] }) {
        if (!files) return files;

        const IMAGE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
        const DOCUMENT_SIZE_LIMIT = 30 * 1024 * 1024; // 30MB

        const allFiles = [...(files.images || []), ...(files.documentImage || [])];

        try {
            // 1. Validate Images
            if (files.images) {
                for (const file of files.images) {
                    if (file.size > IMAGE_SIZE_LIMIT) {
                        throw new BadRequestException(`Image ${file.originalname} exceeds 5MB`);
                    }
                }
            }

            // 2. Validate Document
            if (files.documentImage?.[0]) {
                if (files.documentImage[0].size > DOCUMENT_SIZE_LIMIT) {
                    throw new BadRequestException(`Document ${files.documentImage[0].originalname} exceeds 30MB`);
                }
            }
        } catch (error) {
            // 3. Cleanup: Delete ALL uploaded files if ANY validation fails
            this.cleanupFiles(allFiles);
            throw error;
        }

        return files;
    }

    private cleanupFiles(files: any[]) {
        files.forEach(file => {
            if (file.path && existsSync(file.path)) {
                try {
                    unlinkSync(file.path);
                } catch (err) {
                    console.error(`Failed to delete file: ${file.path}`, err);
                }
            }
        });
    }
}