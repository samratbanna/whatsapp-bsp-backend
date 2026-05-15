import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { ContactImportsService } from './contact-imports.service';
import { ContactImportQueryDto } from './dto/contact-import.dto';

const ALLOWED_MIMETYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

@ApiTags('Contact Imports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Controller('contact-imports')
export class ContactImportsController {
  constructor(private readonly importsService: ContactImportsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
          cb(new BadRequestException('Only .xlsx and .xls files are allowed'), false);
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
      required: ['file', 'groupId'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Excel file (.xlsx or .xls)' },
        groupId: { type: 'string', description: 'Target contact group ID' },
      },
    },
  })
  create(
    @CurrentUser('orgId') orgId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('groupId') groupId: string,
  ) {
    if (!file) throw new BadRequestException('Excel file is required');
    if (!groupId) throw new BadRequestException('groupId is required');
    return this.importsService.createImport(orgId, groupId, file);
  }

  @Get()
  findAll(
    @CurrentUser('orgId') orgId: string,
    @Query() query: ContactImportQueryDto,
  ) {
    return this.importsService.findAll(orgId, query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.importsService.findOne(id, orgId);
  }

  @Get(':id/report')
  async downloadReport(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.importsService.generateFailureReport(id, orgId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="import-report-${id}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
