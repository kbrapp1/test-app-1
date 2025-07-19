/**
 * Operating Hours Mapper
 * 
 * AI INSTRUCTIONS:
 * - Handles bidirectional mapping between OperatingHours domain value objects and DTOs
 * - Manages business hours, holiday schedules, and timezone configurations
 * - Maintains DDD principle: Clean transformation without business logic
 * - Preserves schedule integrity and timezone handling
 */

import { OperatingHours } from '../../domain/value-objects/session-management/OperatingHours';
import { OperatingHoursDto } from '../dto/ChatbotConfigDto';

export class OperatingHoursMapper {
  static toDto(oh: OperatingHours): OperatingHoursDto {
    return {
      timezone: oh.timezone,
      businessHours: oh.businessHours.map((bh) => ({
        dayOfWeek: bh.dayOfWeek,
        startTime: bh.startTime,
        endTime: bh.endTime,
        isOpen: bh.isActive, // Map isActive to isOpen for DTO
      })),
      holidaySchedule: oh.holidaySchedule.map((h) => ({
        date: h.date,
        name: h.name,
        isRecurring: h.isRecurring,
      })),
      outsideHoursMessage: oh.outsideHoursMessage,
    };
  }

  static fromDto(dto: OperatingHoursDto): OperatingHours {
    return OperatingHours.create({
      timezone: dto.timezone,
      businessHours: dto.businessHours.map(bh => ({
        dayOfWeek: bh.dayOfWeek,
        startTime: bh.startTime,
        endTime: bh.endTime,
        isActive: bh.isOpen, // Map isOpen from DTO to isActive for domain
      })),
      holidaySchedule: dto.holidaySchedule,
      outsideHoursMessage: dto.outsideHoursMessage,
    });
  }
}
