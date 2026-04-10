import {
  Body,
  Controller,
  Delete,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const allowedExt = /\.(jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|zip)$/i;

function uploadDir() {
  return process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
}

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const cat = (req.query['category'] as string) || 'attachments';
          const dest = join(uploadDir(), cat);
          if (!existsSync(dest)) {
            mkdirSync(dest, { recursive: true });
          }
          cb(null, dest);
        },
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = allowedExt.test(extname(file.originalname).toLowerCase());
        cb(ok ? null : new Error('File type not allowed'), ok);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category?: string,
  ) {
    const cat = category || 'attachments';
    return {
      url: `/uploads/${cat}/${file.filename}`,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  @Delete()
  remove(@Body() body: { url: string }) {
    if (!body.url?.startsWith('/uploads/')) {
      return { ok: false };
    }
    const rel = body.url.replace('/uploads/', '');
    const full = join(uploadDir(), rel);
    if (existsSync(full)) unlinkSync(full);
    return { ok: true };
  }
}
