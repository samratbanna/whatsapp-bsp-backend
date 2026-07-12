import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UploadedFile, UseInterceptors,
  UseGuards, Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiKnowledgeService } from './ai-knowledge.service';
import { VectorSearchService } from './vector-search.service';
import {
  CreateKnowledgeTextDto, CreateKnowledgeUrlDto, CreateKnowledgeCrawlerDto,
  CreateKnowledgeYoutubeDto, CreateKnowledgeQaPairsDto,
  CreateKnowledgeRulesDto, CreateKnowledgeProductCatalogDto, UpdateKnowledgeDto,
} from './dto/ai-knowledge.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai-agents/:agentId/knowledge')
export class AiKnowledgeController {
  constructor(
    private readonly knowledgeService: AiKnowledgeService,
    private readonly vectorSearch: VectorSearchService,
  ) {}

  // ── List ────────────────────────────────────────────────────────────────
  @Get()
  findAll(@Param('agentId') agentId: string, @CurrentUser('orgId') orgId: string) {
    return this.knowledgeService.findAll(agentId, orgId);
  }

  @Get('stats')
  getStats(@Param('agentId') agentId: string, @CurrentUser('orgId') orgId: string) {
    return this.knowledgeService.getStats(agentId, orgId);
  }

  @Get(':id')
  findOne(@Param('agentId') agentId: string, @Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.knowledgeService.findOne(id, orgId);
  }

  // ── Add Sources ─────────────────────────────────────────────────────────
  @Post('text')
  addText(
    @Param('agentId') agentId: string,
    @Body() dto: CreateKnowledgeTextDto,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.addText(agentId, orgId, dto);
  }

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  addFile(
    @Param('agentId') agentId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('language') language: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.addFile(
      agentId,
      orgId,
      file,
      title,
      description,
      language,
    );
  }

  @Post('website')
  addWebsite(
    @Param('agentId') agentId: string,
    @Body() dto: CreateKnowledgeUrlDto,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.addWebsite(agentId, orgId, dto);
  }

  @Post('crawler')
  addCrawler(
    @Param('agentId') agentId: string,
    @Body() dto: CreateKnowledgeCrawlerDto,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.addCrawler(agentId, orgId, dto);
  }

  @Post('youtube')
  addYoutube(
    @Param('agentId') agentId: string,
    @Body() dto: CreateKnowledgeYoutubeDto,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.addYoutube(agentId, orgId, dto);
  }

  @Post('qa-pairs')
  addQaPairs(
    @Param('agentId') agentId: string,
    @Body() dto: CreateKnowledgeQaPairsDto,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.addQaPairs(agentId, orgId, dto);
  }

  @Post('rules')
  addRules(
    @Param('agentId') agentId: string,
    @Body() dto: CreateKnowledgeRulesDto,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.addRules(agentId, orgId, dto);
  }

  @Post('product-catalog')
  addProductCatalog(
    @Param('agentId') agentId: string,
    @Body() dto: CreateKnowledgeProductCatalogDto,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.addProductCatalog(agentId, orgId, dto);
  }

  // ── Manage ──────────────────────────────────────────────────────────────
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeDto,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.knowledgeService.update(id, orgId, dto);
  }

  @Post(':id/retrigger')
  retrigger(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.knowledgeService.retrigger(id, orgId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('orgId') orgId: string) {
    return this.knowledgeService.remove(id, orgId);
  }

  // ── Vector search (test endpoint) ───────────────────────────────────────
  @Get('search')
  search(
    @Param('agentId') agentId: string,
    @Query('q') query: string,
    @Query('topK') topK: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.vectorSearch.search(query, agentId, topK ? Number(topK) : 5);
  }

  // ── Rebuild all chunks for an agent ────────────────────────────────────
  @Post('rebuild-index')
  rebuildIndex(@Param('agentId') agentId: string) {
    return this.vectorSearch.rebuildAllForAgent(agentId);
  }

  // ── Chunk stats ─────────────────────────────────────────────────────────
  @Get('chunk-stats')
  chunkStats(@Param('agentId') agentId: string) {
    return this.vectorSearch.getChunkStats(agentId);
  }
}
