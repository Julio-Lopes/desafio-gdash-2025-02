import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { WeatherService } from './weather.service';
import { CreateWeatherLogDto } from './dto/create-weather-log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as fs from 'fs';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post('logs')
  @ApiOperation({ summary: 'Criar log meteorológico (público - usado pelo Worker Go)' })
  @ApiResponse({ status: 201, description: 'Log criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createWeatherLogDto: CreateWeatherLogDto) {
    return this.weatherService.create(createWeatherLogDto);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar logs meteorológicos com paginação' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados', example: 100 })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Offset para paginação', example: 0 })
  @ApiResponse({ status: 200, description: 'Lista de logs meteorológicos' })
  async findAll(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const skipNum = skip ? parseInt(skip, 10) : 0;
    return this.weatherService.findAll(limitNum, skipNum);
  }

  @Get('logs/range')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar logs por intervalo de datas' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Data inicial', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'Data final', example: '2025-12-31' })
  @ApiResponse({ status: 200, description: 'Logs no período especificado' })
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.weatherService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter estatísticas meteorológicas' })
  @ApiResponse({ status: 200, description: 'Estatísticas calculadas' })
  async getStatistics() {
    return this.weatherService.getStatistics();
  }

  @Get('insights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter insights gerados por IA (Google Gemini)' })
  @ApiResponse({ status: 200, description: 'Insights sobre os dados meteorológicos' })
  async getInsights() {
    return this.weatherService.getInsights();
  }

  @Get('export/csv')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Exportar dados em formato CSV' })
  @ApiResponse({ status: 200, description: 'Arquivo CSV gerado', schema: { type: 'string', format: 'binary' } })
  async exportCSV(@Res() res: Response) {
    try {
      const filePath = await this.weatherService.exportCSV();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="weather_export_${Date.now()}.csv"`,
      );

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('close', () => {
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Erro ao exportar CSV',
        error: error.message,
      });
    }
  }

  @Get('export/xlsx')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Exportar dados em formato Excel (XLSX)' })
  @ApiResponse({ status: 200, description: 'Arquivo Excel gerado', schema: { type: 'string', format: 'binary' } })
  async exportXLSX(@Res() res: Response) {
    try {
      const filePath = await this.weatherService.exportXLSX();
      
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="weather_export_${Date.now()}.xlsx"`,
      );

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('close', () => {
        fs.unlinkSync(filePath); 
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Erro ao exportar XLSX',
        error: error.message,
      });
    }
  }
}