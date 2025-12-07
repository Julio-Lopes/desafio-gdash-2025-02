import {
  IsString,
  IsDate,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsInt,
  IsDefined,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LocationDto {
  @ApiProperty({ example: 'Boa Esperança', description: 'Nome da cidade' })
  @IsDefined()
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'Minas Gerais', description: 'Estado' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'Brazil', description: 'País' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: -21.09, description: 'Latitude' })
  @IsDefined()
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ example: -45.56, description: 'Longitude' })
  @IsDefined()
  @IsNumber()
  @Type(() => Number)
  longitude: number;
}

class WeatherDataDto {
  @ApiProperty({ example: 25.5, description: 'Temperatura em Celsius' })
  @IsDefined()
  @IsNumber()
  @Type(() => Number)
  temperature: number;

  @ApiProperty({ example: 26.2, description: 'Sensação térmica em Celsius' })
  @IsDefined()
  @IsNumber()
  @Type(() => Number)
  feels_like: number;

  @ApiProperty({ example: 65, description: 'Umidade relativa (%)', minimum: 0, maximum: 100 })
  @IsDefined()
  @IsInt()
  @Min(0)
  @Max(100)
  humidity: number;

  @ApiProperty({ example: 10.5, description: 'Velocidade do vento (km/h)' })
  @IsDefined()
  @IsNumber()
  @Type(() => Number)
  wind_speed: number;

  @ApiPropertyOptional({ example: 180, description: 'Direção do vento (graus)' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  wind_direction?: number;

  @ApiPropertyOptional({ example: 40, description: 'Cobertura de nuvens (%)' })
  @IsOptional()
  @IsInt()
  cloud_cover?: number;

  @ApiPropertyOptional({ example: 0.0, description: 'Precipitação (mm)' })
  @IsOptional()
  @IsNumber()
  precipitation?: number;

  @ApiPropertyOptional({ example: 20, description: 'Probabilidade de precipitação (%)' })
  @IsOptional()
  @IsInt()
  precipitation_probability?: number;

  @ApiPropertyOptional({ example: 1013.25, description: 'Pressão atmosférica (hPa)' })
  @IsOptional()
  @IsNumber()
  pressure?: number;

  @ApiPropertyOptional({ example: 1, description: 'Código do tempo (WMO)' })
  @IsOptional()
  @IsInt()
  weather_code?: number;

  @ApiPropertyOptional({ example: 'Mainly Clear', description: 'Condição climática' })
  @IsOptional()
  @IsString()
  condition?: string;
}

export class CreateWeatherLogDto {
  @ApiProperty({ description: 'Dados de localização' })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ description: 'Dados meteorológicos' })
  @ValidateNested()
  @Type(() => WeatherDataDto)
  data: WeatherDataDto;

  @ApiProperty({ example: '2025-11-20T10:30:00Z', description: 'Data/hora da coleta (ISO 8601)' })
  @IsString()
  collected_at: string;

  @ApiPropertyOptional({ example: 'Open-Meteo API', description: 'Fonte dos dados' })
  @IsOptional()
  @IsString()
  source?: string;
}