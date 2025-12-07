import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class Location {
  @Prop({ required: true })
  city: string;

  @Prop()
  state: string;

  @Prop()
  country: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

@Schema({ _id: false })
export class WeatherData {
  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  feels_like: number;

  @Prop({ required: true })
  humidity: number;

  @Prop({ required: true })
  wind_speed: number;

  @Prop()
  wind_direction: number;

  @Prop()
  cloud_cover: number;

  @Prop()
  precipitation: number;

  @Prop()
  precipitation_probability: number;

  @Prop()
  pressure: number;

  @Prop()
  weather_code: number;

  @Prop()
  condition: string;
}

@Schema({ timestamps: true })
export class WeatherLog extends Document {
  @Prop({ type: Location, required: true })
  location: Location;

  @Prop({ type: WeatherData, required: true })
  data: WeatherData;

  @Prop({ required: true })
  collected_at: Date;

  @Prop()
  source: string;

  @Prop()
  ai_insights: string;
}

export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);