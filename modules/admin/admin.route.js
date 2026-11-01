import { Router } from 'express';
import AdminRepository from './admin.repository.js';
import AdminService from './admin.service.js';
import AdminController from './admin.controller.js';
import {
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
} from './admin.validation.js';
import validate from '../../shared/middleware/validate.js';
import { requireAuth, requireRole } from '../../shared/middleware/auth.js';

const router = Router();

// Instantiate dependencies (Dependency Injection)
const adminRepository = new AdminRepository();
const adminService = new AdminService(adminRepository);
const adminController = new AdminController(adminService);

// Protect all admin routes with authentication and admin role requirement
router.use(requireAuth, requireRole('admin'));

/**
 * @swagger
 * tags:
 *   - name: Admin - Dashboard
 *     description: Server-Driven UI (SDUI) dynamic dashboard layouts and system metrics
 *   - name: Admin - Faculty
 *     description: Faculty CRUD operations, workload tracking, and user account linking
 *   - name: Admin - Rooms
 *     description: Classrooms and laboratories management with capacity and type attributes
 *   - name: Admin - Student Groups
 *     description: Academic cohort and student group management
 *   - name: Admin - Students
 *     description: Student records and cohort enrollment
 *   - name: Admin - Courses
 *     description: Academic course catalog with credit weights and faculty assignments
 *   - name: Admin - Timetable
 *     description: Automated schedule generation, slot allocation, and collision verification
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Faculty:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "f1a2b3c4-1234-5678-abcd-000000000001"
 *         name:
 *           type: string
 *           example: "Prof. Ada Lovelace"
 *         email:
 *           type: string
 *           format: email
 *           example: "ada.lovelace@campus.edu"
 *         department:
 *           type: string
 *           example: "Computer Science"
 *         workloadHours:
 *           type: integer
 *           example: 6
 *         maxHoursPerWeek:
 *           type: integer
 *           example: 20
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *     CreateFacultyInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - department
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           example: "Prof. Ada Lovelace"
 *         email:
 *           type: string
 *           format: email
 *           example: "ada.lovelace@campus.edu"
 *         department:
 *           type: string
 *           minLength: 2
 *           example: "Computer Science"
 *         workloadHours:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           example: 0
 *         maxHoursPerWeek:
 *           type: integer
 *           minimum: 1
 *           default: 20
 *           example: 20
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *     UpdateFacultyInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           example: "Prof. Ada Lovelace"
 *         email:
 *           type: string
 *           format: email
 *           example: "ada.lovelace@campus.edu"
 *         department:
 *           type: string
 *           minLength: 2
 *           example: "Computer Science"
 *         workloadHours:
 *           type: integer
 *           minimum: 0
 *           example: 8
 *         maxHoursPerWeek:
 *           type: integer
 *           minimum: 1
 *           example: 24
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *     Room:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "r1a2b3c4-1234-5678-abcd-000000000001"
 *         name:
 *           type: string
 *           example: "Lecture Hall 101"
 *         capacity:
 *           type: integer
 *           example: 60
 *         type:
 *           type: string
 *           enum: [lecture, lab, seminar]
 *           example: "lecture"
 *         building:
 *           type: string
 *           nullable: true
 *           example: "Turing Block"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *     CreateRoomInput:
 *       type: object
 *       required:
 *         - name
 *         - capacity
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           example: "Lecture Hall 101"
 *         capacity:
 *           type: integer
 *           minimum: 1
 *           example: 60
 *         type:
 *           type: string
 *           enum: [lecture, lab, seminar]
 *           default: lecture
 *           example: "lecture"
 *         building:
 *           type: string
 *           nullable: true
 *           example: "Turing Block"
 *     UpdateRoomInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           example: "Lecture Hall 101-A"
 *         capacity:
 *           type: integer
 *           minimum: 1
 *           example: 75
 *         type:
 *           type: string
 *           enum: [lecture, lab, seminar]
 *           example: "lecture"
 *         building:
 *           type: string
 *           nullable: true
 *           example: "Turing Block"
 *     StudentGroup:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "g1a2b3c4-1234-5678-abcd-000000000001"
 *         name:
 *           type: string
 *           example: "CS-2026-A"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *     CreateStudentGroupInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           example: "CS-2026-A"
 *     Student:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "s1a2b3c4-1234-5678-abcd-000000000001"
 *         name:
 *           type: string
 *           example: "Alice Johnson"
 *         email:
 *           type: string
 *           format: email
 *           example: "alice.j@campus.edu"
 *         rollNumber:
 *           type: string
 *           example: "CS26-001"
 *         studentGroupId:
 *           type: string
 *           format: uuid
 *           example: "g1a2b3c4-1234-5678-abcd-000000000001"
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *     CreateStudentInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - rollNumber
 *         - studentGroupId
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           example: "Alice Johnson"
 *         email:
 *           type: string
 *           format: email
 *           example: "alice.j@campus.edu"
 *         rollNumber:
 *           type: string
 *           minLength: 1
 *           example: "CS26-001"
 *         studentGroupId:
 *           type: string
 *           format: uuid
 *           example: "g1a2b3c4-1234-5678-abcd-000000000001"
 *         userId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *     Course:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "c1a2b3c4-1234-5678-abcd-000000000001"
 *         code:
 *           type: string
 *           example: "CS301"
 *         name:
 *           type: string
 *           example: "Algorithms & Data Structures"
 *         credits:
 *           type: integer
 *           example: 3
 *         studentGroupId:
 *           type: string
 *           format: uuid
 *           example: "g1a2b3c4-1234-5678-abcd-000000000001"
 *         facultyId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: "f1a2b3c4-1234-5678-abcd-000000000001"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *     CreateCourseInput:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - credits
 *         - studentGroupId
 *       properties:
 *         code:
 *           type: string
 *           minLength: 1
 *           example: "CS301"
 *         name:
 *           type: string
 *           minLength: 1
 *           example: "Algorithms & Data Structures"
 *         credits:
 *           type: integer
 *           minimum: 1
 *           example: 3
 *         studentGroupId:
 *           type: string
 *           format: uuid
 *           example: "g1a2b3c4-1234-5678-abcd-000000000001"
 *         facultyId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: "f1a2b3c4-1234-5678-abcd-000000000001"
 *     TimetableSlot:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "t1a2b3c4-1234-5678-abcd-000000000001"
 *         dayOfWeek:
 *           type: integer
 *           minimum: 1
 *           maximum: 7
 *           description: "1 = Monday, 2 = Tuesday, ..., 7 = Sunday"
 *           example: 1
 *         startTime:
 *           type: string
 *           pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           pattern: '^([01]\d|2[0-3]):([0-5]\d)$'
 *           example: "10:00"
 *         status:
 *           type: string
 *           enum: [scheduled, verified, conflict]
 *           example: "scheduled"
 *         roomId:
 *           type: string
 *           format: uuid
 *           example: "r1a2b3c4-1234-5678-abcd-000000000001"
 *         facultyId:
 *           type: string
 *           format: uuid
 *           example: "f1a2b3c4-1234-5678-abcd-000000000001"
 *         studentGroupId:
 *           type: string
 *           format: uuid
 *           example: "g1a2b3c4-1234-5678-abcd-000000000001"
 *         courseId:
 *           type: string
 *           format: uuid
 *           example: "c1a2b3c4-1234-5678-abcd-000000000001"
 *         room:
 *           $ref: '#/components/schemas/Room'
 *         faculty:
 *           $ref: '#/components/schemas/Faculty'
 *         studentGroup:
 *           $ref: '#/components/schemas/StudentGroup'
 *         course:
 *           $ref: '#/components/schemas/Course'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-31T09:00:00.000Z"
 *     CreateTimetableSlotInput:
 *       type: object
 *       required:
 *         - dayOfWeek
 *         - startTime
 *         - endTime
 *         - roomId
 *         - facultyId
 *         - studentGroupId
 *         - courseId
 *       properties:
 *         dayOfWeek:
 *           type: integer
 *           minimum: 1
 *           maximum: 7
 *           description: "1 = Monday ... 7 = Sunday"
 *           example: 1
 *         startTime:
 *           type: string
 *           example: "09:00"
 *         endTime:
 *           type: string
 *           example: "10:00"
 *         roomId:
 *           type: string
 *           format: uuid
 *           example: "r1a2b3c4-1234-5678-abcd-000000000001"
 *         facultyId:
 *           type: string
 *           format: uuid
 *           example: "f1a2b3c4-1234-5678-abcd-000000000001"
 *         studentGroupId:
 *           type: string
 *           format: uuid
 *           example: "g1a2b3c4-1234-5678-abcd-000000000001"
 *         courseId:
 *           type: string
 *           format: uuid
 *           example: "c1a2b3c4-1234-5678-abcd-000000000001"
 *     GenerateTimetableInput:
 *       type: object
 *       properties:
 *         studentGroupId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Optional group filter. If omitted, generates for all student groups.
 *           example: null
 *         daysOfWeek:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 1
 *             maximum: 7
 *           default: [1, 2, 3, 4, 5]
 *           example: [1, 2, 3, 4, 5]
 *         timeSlots:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *             properties:
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "10:00"
 *         clearExisting:
 *           type: boolean
 *           default: false
 *           example: false
 *     VerifyTimetableInput:
 *       type: object
 *       properties:
 *         studentGroupId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           example: null
 *     DashboardApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Admin dashboard data retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             components:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "stats"
 *                   data:
 *                     type: object
 */

// --- SDUI Dashboard ---
/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Retrieve SDUI dynamic dashboard
 *     description: Provides the dynamic Server-Driven UI (SDUI) component layout and analytics consumed by the frontend SDUI renderer (stats, room utilization pie-chart, faculty workload bar-chart, schedule collision alerts, and timetable table).
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SDUI dashboard layout returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardApiResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Admin role required)
 */
router.get('/dashboard', adminController.getDashboard);

// --- Faculty Endpoints ---
/**
 * @swagger
 * /api/admin/faculty:
 *   post:
 *     summary: Create a faculty member
 *     description: Registers a new faculty profile with department, optional workload constraints, and optional user link.
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFacultyInput'
 *     responses:
 *       201:
 *         description: Faculty created successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Faculty with this email already exists
 *   get:
 *     summary: List all faculty members
 *     description: Returns all registered faculty members with their current workload hours and course counts.
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Faculty list retrieved successfully
 */
router.post('/faculty', validate(createFacultySchema), adminController.createFaculty);
router.get('/faculty', adminController.getAllFaculty);

/**
 * @swagger
 * /api/admin/faculty/{id}:
 *   get:
 *     summary: Get faculty member by ID
 *     description: Returns single faculty member details including assigned courses and timetable slots.
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Faculty details retrieved successfully
 *       404:
 *         description: Faculty member not found
 *   put:
 *     summary: Update faculty member
 *     description: Updates specified fields on an existing faculty member.
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFacultyInput'
 *     responses:
 *       200:
 *         description: Faculty updated successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Faculty member not found
 *       409:
 *         description: Faculty email collision
 *   delete:
 *     summary: Delete faculty member
 *     description: Removes faculty member record from the database.
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Faculty deleted successfully
 *       404:
 *         description: Faculty member not found
 */
router.get('/faculty/:id', adminController.getFacultyById);
router.put('/faculty/:id', validate(updateFacultySchema), adminController.updateFaculty);
router.delete('/faculty/:id', adminController.deleteFaculty);

// Alias: /campus/faculty
/**
 * @swagger
 * /api/admin/campus/faculty:
 *   post:
 *     summary: Create a faculty member (campus alias)
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFacultyInput'
 *     responses:
 *       201:
 *         description: Faculty created successfully
 *   get:
 *     summary: List all faculty members (campus alias)
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Faculty list retrieved successfully
 */
router.post('/campus/faculty', validate(createFacultySchema), adminController.createFaculty);
router.get('/campus/faculty', adminController.getAllFaculty);

/**
 * @swagger
 * /api/admin/campus/faculty/{id}:
 *   get:
 *     summary: Get faculty member by ID (campus alias)
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Faculty details retrieved successfully
 *   put:
 *     summary: Update faculty member (campus alias)
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateFacultyInput'
 *     responses:
 *       200:
 *         description: Faculty updated successfully
 *   delete:
 *     summary: Delete faculty member (campus alias)
 *     tags: [Admin - Faculty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Faculty deleted successfully
 */
router.get('/campus/faculty/:id', adminController.getFacultyById);
router.put('/campus/faculty/:id', validate(updateFacultySchema), adminController.updateFaculty);
router.delete('/campus/faculty/:id', adminController.deleteFaculty);

// --- Room Endpoints ---
/**
 * @swagger
 * /api/admin/rooms:
 *   post:
 *     summary: Create a room or lab
 *     description: Creates a classroom, laboratory, or seminar room with capacity and location metadata.
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoomInput'
 *     responses:
 *       201:
 *         description: Room created successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Room name already exists
 *   get:
 *     summary: List all rooms
 *     description: Returns all available campus rooms and their configured capacities.
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms retrieved successfully
 */
router.post('/rooms', validate(createRoomSchema), adminController.createRoom);
router.get('/rooms', adminController.getAllRooms);

/**
 * @swagger
 * /api/admin/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room details retrieved successfully
 *       404:
 *         description: Room not found
 *   put:
 *     summary: Update room
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoomInput'
 *     responses:
 *       200:
 *         description: Room updated successfully
 *       404:
 *         description: Room not found
 *   delete:
 *     summary: Delete room
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       404:
 *         description: Room not found
 */
router.get('/rooms/:id', adminController.getRoomById);
router.put('/rooms/:id', validate(updateRoomSchema), adminController.updateRoom);
router.delete('/rooms/:id', adminController.deleteRoom);

// Alias: /campus/rooms & /campus/room
/**
 * @swagger
 * /api/admin/campus/rooms:
 *   post:
 *     summary: Create a room (campus alias)
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoomInput'
 *     responses:
 *       201:
 *         description: Room created successfully
 *   get:
 *     summary: List all rooms (campus alias)
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rooms retrieved successfully
 */
router.post('/campus/rooms', validate(createRoomSchema), adminController.createRoom);
router.get('/campus/rooms', adminController.getAllRooms);

/**
 * @swagger
 * /api/admin/campus/rooms/{id}:
 *   get:
 *     summary: Get room by ID (campus alias)
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room details retrieved successfully
 *   put:
 *     summary: Update room (campus alias)
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoomInput'
 *     responses:
 *       200:
 *         description: Room updated successfully
 *   delete:
 *     summary: Delete room (campus alias)
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room deleted successfully
 */
router.get('/campus/rooms/:id', adminController.getRoomById);
router.put('/campus/rooms/:id', validate(updateRoomSchema), adminController.updateRoom);
router.delete('/campus/rooms/:id', adminController.deleteRoom);

/**
 * @swagger
 * /api/admin/campus/room:
 *   post:
 *     summary: Create a room (singular campus alias)
 *     tags: [Admin - Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoomInput'
 *     responses:
 *       201:
 *         description: Room created successfully
 */
router.post('/campus/room', validate(createRoomSchema), adminController.createRoom);

// --- Student Groups Endpoints ---
/**
 * @swagger
 * /api/admin/student-groups:
 *   post:
 *     summary: Create a student group
 *     description: Creates an academic cohort (e.g. CS-2026-A) for timetable and student assignment.
 *     tags: [Admin - Student Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentGroupInput'
 *     responses:
 *       201:
 *         description: Student group created successfully
 *       400:
 *         description: Validation failed
 *       409:
 *         description: Student group name already exists
 *   get:
 *     summary: List all student groups
 *     description: Returns all academic student cohorts.
 *     tags: [Admin - Student Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student groups retrieved successfully
 */
router.post('/student-groups', validate(createStudentGroupSchema), adminController.createStudentGroup);
router.get('/student-groups', adminController.getAllStudentGroups);

/**
 * @swagger
 * /api/admin/campus/student-groups:
 *   post:
 *     summary: Create a student group (campus alias)
 *     tags: [Admin - Student Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentGroupInput'
 *     responses:
 *       201:
 *         description: Student group created successfully
 *   get:
 *     summary: List all student groups (campus alias)
 *     tags: [Admin - Student Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student groups retrieved successfully
 */
router.post('/campus/student-groups', validate(createStudentGroupSchema), adminController.createStudentGroup);
router.get('/campus/student-groups', adminController.getAllStudentGroups);

// --- Student Endpoints ---
/**
 * @swagger
 * /api/admin/students:
 *   post:
 *     summary: Create a student
 *     description: Enrolls a student with unique roll number and links them to an academic student group.
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentInput'
 *     responses:
 *       201:
 *         description: Student created successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Referenced student group not found
 *       409:
 *         description: Student email or roll number already exists
 *   get:
 *     summary: List all students
 *     description: Returns all registered students along with their assigned student groups.
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 */
router.post('/students', validate(createStudentSchema), adminController.createStudent);
router.get('/students', adminController.getAllStudents);

/**
 * @swagger
 * /api/admin/campus/students:
 *   post:
 *     summary: Create a student (campus alias)
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentInput'
 *     responses:
 *       201:
 *         description: Student created successfully
 *   get:
 *     summary: List all students (campus alias)
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Students retrieved successfully
 */
router.post('/campus/students', validate(createStudentSchema), adminController.createStudent);
router.get('/campus/students', adminController.getAllStudents);

/**
 * @swagger
 * /api/admin/campus/student:
 *   post:
 *     summary: Create a student (singular campus alias)
 *     tags: [Admin - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStudentInput'
 *     responses:
 *       201:
 *         description: Student created successfully
 */
router.post('/campus/student', validate(createStudentSchema), adminController.createStudent);

// --- Course Endpoints ---
/**
 * @swagger
 * /api/admin/courses:
 *   post:
 *     summary: Create an academic course
 *     description: Creates a course catalog item with credit hours, target student group, and optional primary faculty instructor.
 *     tags: [Admin - Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseInput'
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Student group or faculty not found
 *       409:
 *         description: Course code already exists
 *   get:
 *     summary: List all courses
 *     description: Returns all academic courses with assigned faculty and student group details.
 *     tags: [Admin - Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.post('/courses', validate(createCourseSchema), adminController.createCourse);
router.get('/courses', adminController.getAllCourses);

/**
 * @swagger
 * /api/admin/campus/courses:
 *   post:
 *     summary: Create an academic course (campus alias)
 *     tags: [Admin - Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseInput'
 *     responses:
 *       201:
 *         description: Course created successfully
 *   get:
 *     summary: List all courses (campus alias)
 *     tags: [Admin - Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.post('/campus/courses', validate(createCourseSchema), adminController.createCourse);
router.get('/campus/courses', adminController.getAllCourses);

/**
 * @swagger
 * /api/admin/campus/course:
 *   post:
 *     summary: Create an academic course (singular campus alias)
 *     tags: [Admin - Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseInput'
 *     responses:
 *       201:
 *         description: Course created successfully
 */
router.post('/campus/course', validate(createCourseSchema), adminController.createCourse);

// --- Timetable Endpoints ---
/**
 * @swagger
 * /api/admin/timetable:
 *   get:
 *     summary: List timetable slots with optional filters
 *     description: Retrieves timetable slots filtered by student group, faculty, room, or day of the week.
 *     tags: [Admin - Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: studentGroupId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter slots by student group
 *       - name: facultyId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter slots by faculty member
 *       - name: roomId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter slots by room
 *       - name: dayOfWeek
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 7
 *         description: Filter slots by day (1 = Monday ... 7 = Sunday)
 *     responses:
 *       200:
 *         description: Timetable slots retrieved successfully
 */
router.get('/timetable', adminController.getAllSlots);

/**
 * @swagger
 * /api/admin/timetable/slots:
 *   post:
 *     summary: Create a timetable slot
 *     description: Manually schedules a class slot. Verifies room, faculty, and group availability to prevent schedule double-booking collisions.
 *     tags: [Admin - Timetable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTimetableSlotInput'
 *     responses:
 *       201:
 *         description: Timetable slot created successfully
 *       400:
 *         description: Validation failed or invalid time window (startTime >= endTime)
 *       404:
 *         description: Referenced room, faculty, group, or course not found
 *       409:
 *         description: Schedule collision (room double-booking, faculty collision, or group conflict)
 */
router.post('/timetable/slots', validate(createTimetableSlotSchema), adminController.createSlot);

/**
 * @swagger
 * /api/admin/timetable/slots/{id}:
 *   delete:
 *     summary: Delete a timetable slot
 *     description: Deletes a scheduled slot and automatically recalculates faculty workload hours.
 *     tags: [Admin - Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Timetable slot deleted successfully
 *       404:
 *         description: Timetable slot not found
 */
router.delete('/timetable/slots/:id', adminController.deleteSlot);

/**
 * @swagger
 * /api/admin/timetable/generate:
 *   post:
 *     summary: Generate timetable automatically
 *     description: Executes the timetable scheduling algorithm to allocate conflict-free slots across specified days and time slots.
 *     tags: [Admin - Timetable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateTimetableInput'
 *     responses:
 *       201:
 *         description: Timetable generated successfully
 *       400:
 *         description: Missing required resources (no rooms or courses available)
 */
router.post('/timetable/generate', validate(generateTimetableSchema), adminController.generateTimetable);

/**
 * @swagger
 * /api/admin/timetable/verify:
 *   get:
 *     summary: Verify timetable for collisions & workload warnings
 *     description: Checks existing timetable slots for room double-bookings, faculty overlaps, student group collisions, and faculty workload limit overflows.
 *     tags: [Admin - Timetable]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: studentGroupId
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Optional student group ID to filter verification
 *     responses:
 *       200:
 *         description: Timetable verification report
 *   post:
 *     summary: Verify timetable for collisions & workload warnings (POST)
 *     description: Same verification logic as GET /verify, accepting optional studentGroupId in request body.
 *     tags: [Admin - Timetable]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyTimetableInput'
 *     responses:
 *       200:
 *         description: Timetable verification report
 */
router.get('/timetable/verify', adminController.verifyTimetable);
router.post('/timetable/verify', validate(verifyTimetableSchema), adminController.verifyTimetable);

export { router };
export default router;
