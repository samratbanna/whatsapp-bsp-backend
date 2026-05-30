import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, TemplateQueryDto } from './dto/template.dto';

const MAX_TEMPLATE_MEDIA_UPLOAD_BYTES = 100 * 1024 * 1024;
const TEMPLATE_MEDIA_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'video/mp4',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  create(@CurrentUser('orgId') orgId: string, @Body() dto: CreateTemplateDto) {
    return this.templatesService.create(orgId, dto);
  }

  @Post('upload-media')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_TEMPLATE_MEDIA_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!TEMPLATE_MEDIA_MIME_TYPES.has(file.mimetype)) {
          cb(
            new BadRequestException(
              'Unsupported media type. Upload JPG, PNG, MP4, PDF, DOC, or DOCX files.',
            ),
            false,
          );
          return;
        }

        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Media file to upload (image, video, or document)',
        },
      },
    },
  })
  uploadMedia(
    @CurrentUser('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.templatesService.uploadMedia(orgId, file);
  }

  @Post('sync')
  sync(@CurrentUser('orgId') orgId: string, @Query('wabaId') wabaId?: string) {
    return this.templatesService.syncFromMeta(orgId, wabaId);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: TemplateQueryDto,
  ) {
    return this.templatesService.findAll(orgId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.templatesService.findOne(id, orgId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, orgId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.templatesService.remove(id, orgId);
  }
}
