// apps/api/src/modules/encounters/encounters.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('encounters')
@UseGuards(JwtAuthGuard)
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  // EXISTING ROUTES...
  @Post()
  create(@Body() createEncounterDto: CreateEncounterDto) {
    // ...
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // ...
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    // ...
  }

  // NEW: GET /encounters with pagination + filters
  @Get()
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @CurrentUser() user: User,
  ) {
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    
    const result = await this.encountersService.findAllPaginated({
      page: parsedPage,
      limit: parsedLimit,
      patientId,
      status,
      clinicId: user.clinicId, // Scope to caller's clinic
    });

    return {
      status: 'success',
      data: result.data,
      meta: {
        total: result.total,
        page: parsedPage,
        limit: parsedLimit,
      },
    };
  }
}