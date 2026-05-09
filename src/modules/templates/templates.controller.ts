import {
  Controller, Get, Post, Delete,
  Body, Param, Query, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, TemplateQueryDto } from './dto/template.dto';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORG_ADMIN, Role.SUPER_ADMIN)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image or document file for template',
        },
        dto: {
          type: 'string',
          description: 'Template creation data as JSON string',
        },
      },
    },
  })
  create(
    @CurrentUser('orgId') orgId: string,
    @Body('dto') dtoString: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const dto = JSON.parse(dtoString);
    return this.templatesService.create(orgId, dto, file);
  }

  @Post('sync')
  sync(
    @CurrentUser('orgId') orgId: string,
    @Query('wabaId') wabaId?: string,
  ) {
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
  findOne(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.templatesService.findOne(id, orgId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.templatesService.remove(id, orgId);
  }
}
