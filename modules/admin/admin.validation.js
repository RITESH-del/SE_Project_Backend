import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createFacultySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  department: z.string().min(2, 'Department must be at least 2 characters'),
  workloadHours: z.coerce.number().int().nonnegative('Workload hours cannot be negative').optional().default(0),
  maxHoursPerWeek: z.coerce.number().int().positive('Max hours per week must be positive').optional().default(20),
  userId: z.string().optional().nullable(),
});

const updateFacultySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address format').optional(),
  department: z.string().min(2, 'Department must be at least 2 characters').optional(),
  workloadHours: z.coerce.number().int().nonnegative('Workload hours cannot be negative').optional(),
  maxHoursPerWeek: z.coerce.number().int().positive('Max hours per week must be positive').optional(),
  userId: z.string().optional().nullable(),
});

const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.coerce.number().int().positive('Capacity must be greater than 0'),
  type: z.enum(['lecture', 'lab', 'seminar']).optional().default('lecture'),
  building: z.string().optional().nullable(),
});

const updateRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').optional(),
  capacity: z.coerce.number().int().positive('Capacity must be greater than 0').optional(),
  type: z.enum(['lecture', 'lab', 'seminar']).optional(),
  building: z.string().optional().nullable(),
});

const createStudentGroupSchema = z.object({
  name: z.string().min(1, 'Student group name is required'),
});

const createStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  studentGroupId: z.string().min(1, 'Student group ID is required'),
  userId: z.string().optional().nullable(),
});

const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  name: z.string().min(1, 'Course name is required'),
  credits: z.coerce.number().int().positive('Credits must be at least 1'),
  studentGroupId: z.string().min(1, 'Student group ID is required'),
  facultyId: z.string().optional().nullable(),
});

const createTimetableSlotSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(1, 'Day must be between 1 (Monday) and 7 (Sunday)').max(7, 'Day must be between 1 and 7'),
  startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format'),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format'),
  roomId: z.string().min(1, 'Room ID is required'),
  facultyId: z.string().min(1, 'Faculty ID is required'),
  studentGroupId: z.string().min(1, 'Student group ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
});

const defaultTimeSlots = [
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:15', endTime: '12:15' },
  { startTime: '13:00', endTime: '14:00' },
  { startTime: '14:00', endTime: '15:00' },
  { startTime: '15:15', endTime: '16:15' },
];

const generateTimetableSchema = z.object({
  studentGroupId: z.string().optional().nullable(),
  daysOfWeek: z.array(z.coerce.number().int().min(1).max(7)).optional().default([1, 2, 3, 4, 5]),
  timeSlots: z.array(
    z.object({
      startTime: z.string().regex(timeRegex, 'Start time must be in HH:MM format'),
      endTime: z.string().regex(timeRegex, 'End time must be in HH:MM format'),
    })
  ).optional().default(defaultTimeSlots),
  clearExisting: z.boolean().optional().default(false),
});

const verifyTimetableSchema = z.object({
  studentGroupId: z.string().optional().nullable(),
});

export {
  createFacultySchema,
  updateFacultySchema,
  createRoomSchema,
  updateRoomSchema,
  createStudentGroupSchema,
  createStudentSchema,
  createCourseSchema,
  createTimetableSlotSchema,
  generateTimetableSchema,
  verifyTimetableSchema,
  defaultTimeSlots,
};

export default {
  createFacultySchema,
  updateFacultySchema,
  createRoomSchema,
  updateRoomSchema,
  createStudentGroupSchema,
  createStudentSchema,
  createCourseSchema,
  createTimetableSlotSchema,
  generateTimetableSchema,
  verifyTimetableSchema,
  defaultTimeSlots,
};
