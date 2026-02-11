import { z } from "zod"

/**
 * Normalized calendar event category
 */
export const CalendarCategorySchema = z.enum([
  "course_meeting",
  "eval",
  "assignment",
  "institutional",
  "semester_start",
  "semester_end",
  "grades_deadline",
  "holiday",
  "private_event",
  "other"
])

/**
 * Core calendar event shape
 */
export const CalendarEventSchema = z.object({
  id: z.string(),
  code: z.string(), // raw Omnivox Type (EVAL, TRAV, ZZCR, etc.)
  category: CalendarCategorySchema,

  title: z.string(),
  titleEn: z.string().optional(),

  description: z.string().optional(),
  descriptionEn: z.string().optional(),

  start: z.string(), // ISO timestamp
  end: z.string().optional(),

  allDay: z.boolean(),
  status: z.enum(["past", "ongoing", "upcoming"]),

  course: z.object({
    course_id: z.string().optional(),
    term_id: z.string().optional(),
    name: z.string().optional()
  }).optional(),

  classType: z.string().optional(),
  location: z.string().optional(),

  link: z.string().optional(),

  weight: z.number().optional(),

  onlineSubmission: z.boolean().optional(),
  assignmentId: z.string().optional(),

  source: z.enum(["lea", "college"])
})

/**
 * Calendar page response
 */
export const CalendarPageSchema = z.object({
  events: z.array(CalendarEventSchema),

  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),

  currentPage: z.number().optional(),

  calendarType: z.string().optional()
})

export type CalendarCategory = z.infer<typeof CalendarCategorySchema>
export type CalendarEvent = z.infer<typeof CalendarEventSchema>
export type CalendarPage = z.infer<typeof CalendarPageSchema>
