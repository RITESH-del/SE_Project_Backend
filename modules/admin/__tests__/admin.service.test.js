import { jest } from '@jest/globals';
import AdminService from '../admin.service.js';
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../../../shared/errors/AppError.js';
describe('AdminService Unit Tests', () => {
  let adminRepository;
  let adminService;

  beforeEach(() => {
    adminRepository = {
      createFaculty: jest.fn(),
      findAllFaculty: jest.fn(),
      findFacultyById: jest.fn(),
      findFacultyByEmail: jest.fn(),
      updateFaculty: jest.fn(),
      deleteFaculty: jest.fn(),

      createRoom: jest.fn(),
      findAllRooms: jest.fn(),
      findRoomById: jest.fn(),
      findRoomByName: jest.fn(),
      updateRoom: jest.fn(),
      deleteRoom: jest.fn(),

      createStudentGroup: jest.fn(),
      findAllStudentGroups: jest.fn(),
      findStudentGroupById: jest.fn(),
      findStudentGroupByName: jest.fn(),

      createStudent: jest.fn(),
      findAllStudents: jest.fn(),
      findStudentById: jest.fn(),
      findStudentByEmail: jest.fn(),
      findStudentByRollNumber: jest.fn(),

      createCourse: jest.fn(),
      findAllCourses: jest.fn(),
      findCourseById: jest.fn(),
      findCourseByCode: jest.fn(),

      createTimetableSlot: jest.fn(),
      findAllSlots: jest.fn(),
      findSlotById: jest.fn(),
      deleteSlot: jest.fn(),
      deleteSlotsByGroup: jest.fn(),
      deleteAllSlots: jest.fn(),
      createManySlots: jest.fn(),

      countCourses: jest.fn(),
      countFaculty: jest.fn(),
      countStudents: jest.fn(),
      countRooms: jest.fn(),
      countSlots: jest.fn(),
    };

    adminService = new AdminService(adminRepository);
  });

  // ==========================================
  // FACULTY
  // ==========================================
  describe('Faculty Management', () => {
    it('throws ConflictError if faculty email already exists', async () => {
      adminRepository.findFacultyByEmail.mockResolvedValue({ id: 'f1', email: 'prof@campus.edu' });

      await expect(
        adminService.createFaculty({
          name: 'Prof. X',
          email: 'prof@campus.edu',
          department: 'CSE',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('creates faculty member successfully', async () => {
      adminRepository.findFacultyByEmail.mockResolvedValue(null);
      adminRepository.createFaculty.mockImplementation(async (d) => ({ id: 'f1', ...d }));

      const res = await adminService.createFaculty({
        name: 'Dr. Alan Turing',
        email: 'turing@campus.edu',
        department: 'Computer Science',
      });

      expect(res).toMatchObject({
        name: 'Dr. Alan Turing',
        email: 'turing@campus.edu',
        department: 'Computer Science',
        workloadHours: 0,
      });
      expect(adminRepository.createFaculty).toHaveBeenCalled();
    });

    it('throws NotFoundError when getting non-existent faculty', async () => {
      adminRepository.findFacultyById.mockResolvedValue(null);

      await expect(adminService.getFacultyById('f-none')).rejects.toThrow(NotFoundError);
    });

    it('updates faculty successfully and checks email conflict', async () => {
      adminRepository.findFacultyById.mockResolvedValue({ id: 'f1', email: 'old@campus.edu' });
      adminRepository.findFacultyByEmail.mockResolvedValue({ id: 'f2', email: 'taken@campus.edu' });

      await expect(
        adminService.updateFaculty('f1', { email: 'taken@campus.edu' })
      ).rejects.toThrow(ConflictError);
    });
    it('retrieves all faculty', async () => {
      adminRepository.findAllFaculty.mockResolvedValue([{ id: 'f1' }, { id: 'f2' }]);
      const res = await adminService.getAllFaculty();
      expect(res.length).toBe(2);
    });

    it('deletes faculty successfully', async () => {
      adminRepository.findFacultyById.mockResolvedValue({ id: 'f1' });
      adminRepository.deleteFaculty.mockResolvedValue({ id: 'f1' });

      const res = await adminService.deleteFaculty('f1');
      expect(res.id).toBe('f1');
      expect(adminRepository.deleteFaculty).toHaveBeenCalledWith('f1');
    });

    it('throws NotFoundError when deleting non-existent faculty', async () => {
      adminRepository.findFacultyById.mockResolvedValue(null);
      await expect(adminService.deleteFaculty('f-none')).rejects.toThrow(NotFoundError);
    });
  });

  // ==========================================
  // ROOMS
  // ==========================================
  describe('Room Management', () => {
    it('throws ConflictError if room name already exists', async () => {
      adminRepository.findRoomByName.mockResolvedValue({ id: 'r1', name: 'LH-101' });

      await expect(
        adminService.createRoom({
          name: 'LH-101',
          capacity: 60,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('creates room successfully', async () => {
      adminRepository.findRoomByName.mockResolvedValue(null);
      adminRepository.createRoom.mockImplementation(async (d) => ({ id: 'r1', ...d }));

      const res = await adminService.createRoom({
        name: 'LH-101',
        capacity: 60,
        type: 'lecture',
        building: 'Academic Block A',
      });

      expect(res.name).toBe('LH-101');
      expect(res.capacity).toBe(60);
      expect(res.building).toBe('Academic Block A');
    });

    it('throws NotFoundError if deleting non-existent room', async () => {
      adminRepository.findRoomById.mockResolvedValue(null);

      await expect(adminService.deleteRoom('r-404')).rejects.toThrow(NotFoundError);
    });
    it('retrieves all rooms', async () => {
      adminRepository.findAllRooms.mockResolvedValue([{ id: 'r1' }]);
      const res = await adminService.getAllRooms();
      expect(res.length).toBe(1);
    });

    it('updates room successfully', async () => {
      adminRepository.findRoomById.mockResolvedValue({ id: 'r1', name: 'LH-1' });
      adminRepository.findRoomByName.mockResolvedValue(null);
      adminRepository.updateRoom.mockResolvedValue({ id: 'r1', name: 'LH-1-New', capacity: 100 });

      const res = await adminService.updateRoom('r1', { name: 'LH-1-New', capacity: 100 });
      expect(res.name).toBe('LH-1-New');
    });

    it('throws ConflictError if room name is taken by another room', async () => {
      adminRepository.findRoomById.mockResolvedValue({ id: 'r1', name: 'LH-1' });
      adminRepository.findRoomByName.mockResolvedValue({ id: 'r2', name: 'LH-2' });

      await expect(adminService.updateRoom('r1', { name: 'LH-2' })).rejects.toThrow(ConflictError);
    });

    it('deletes room successfully', async () => {
      adminRepository.findRoomById.mockResolvedValue({ id: 'r1' });
      adminRepository.deleteRoom.mockResolvedValue({ id: 'r1' });
      const res = await adminService.deleteRoom('r1');
      expect(res.id).toBe('r1');
    });
  });

  // ==========================================
  // CAMPUS ENTITIES (STUDENT GROUPS, STUDENTS, COURSES)
  // ==========================================
  describe('Campus Entities Management', () => {
    it('creates and lists student groups', async () => {
      adminRepository.findStudentGroupByName.mockResolvedValue(null);
      adminRepository.createStudentGroup.mockResolvedValue({ id: 'g1', name: 'CS-A' });
      adminRepository.findAllStudentGroups.mockResolvedValue([{ id: 'g1', name: 'CS-A' }]);

      const created = await adminService.createStudentGroup({ name: 'CS-A' });
      expect(created.name).toBe('CS-A');

      const all = await adminService.getAllStudentGroups();
      expect(all.length).toBe(1);
    });

    it('throws ConflictError on duplicate student group', async () => {
      adminRepository.findStudentGroupByName.mockResolvedValue({ id: 'g1', name: 'CS-A' });
      await expect(adminService.createStudentGroup({ name: 'CS-A' })).rejects.toThrow(ConflictError);
    });

    it('creates student successfully', async () => {
      adminRepository.findStudentByEmail.mockResolvedValue(null);
      adminRepository.findStudentByRollNumber.mockResolvedValue(null);
      adminRepository.findStudentGroupById.mockResolvedValue({ id: 'g1' });
      adminRepository.createStudent.mockResolvedValue({ id: 's1', name: 'Alice' });

      const res = await adminService.createStudent({
        name: 'Alice',
        email: 'alice@campus.edu',
        rollNumber: 'R101',
        studentGroupId: 'g1',
      });
      expect(res.name).toBe('Alice');
    });

    it('throws ConflictError on duplicate student email or roll number', async () => {
      adminRepository.findStudentByEmail.mockResolvedValue({ id: 's1' });
      await expect(
        adminService.createStudent({ name: 'Alice', email: 'alice@campus.edu', rollNumber: 'R1', studentGroupId: 'g1' })
      ).rejects.toThrow(ConflictError);

      adminRepository.findStudentByEmail.mockResolvedValue(null);
      adminRepository.findStudentByRollNumber.mockResolvedValue({ id: 's2' });
      await expect(
        adminService.createStudent({ name: 'Alice', email: 'alice2@campus.edu', rollNumber: 'R1', studentGroupId: 'g1' })
      ).rejects.toThrow(ConflictError);
    });

    it('creates course and lists courses', async () => {
      adminRepository.findCourseByCode.mockResolvedValue(null);
      adminRepository.findStudentGroupById.mockResolvedValue({ id: 'g1' });
      adminRepository.findFacultyById.mockResolvedValue({ id: 'f1' });
      adminRepository.createCourse.mockResolvedValue({ id: 'c1', code: 'CS101' });
      adminRepository.findAllCourses.mockResolvedValue([{ id: 'c1', code: 'CS101' }]);

      const crs = await adminService.createCourse({
        code: 'CS101',
        name: 'Algorithms',
        credits: 4,
        studentGroupId: 'g1',
        facultyId: 'f1',
      });
      expect(crs.code).toBe('CS101');

      const list = await adminService.getAllCourses();
      expect(list.length).toBe(1);
    });
  });

  // ==========================================
  // TIMETABLE SLOTS & CONFLICT ENGINE
  // ==========================================
  describe('Timetable Slot Creation & Collision Detection', () => {
    beforeEach(() => {
      adminRepository.findRoomById.mockResolvedValue({ id: 'r1', name: 'Room 101', capacity: 50 });
      adminRepository.findFacultyById.mockResolvedValue({ id: 'f1', name: 'Dr. Smith', slots: [] });
      adminRepository.findStudentGroupById.mockResolvedValue({ id: 'g1', name: 'CS-A', students: [] });
      adminRepository.findCourseById.mockResolvedValue({ id: 'c1', name: 'Data Structures' });
    });

    it('throws BadRequestError if startTime is after or equal to endTime', async () => {
      await expect(
        adminService.createSlot({
          dayOfWeek: 1,
          startTime: '11:00',
          endTime: '10:00',
          roomId: 'r1',
          facultyId: 'f1',
          studentGroupId: 'g1',
          courseId: 'c1',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('throws ConflictError if faculty is double-booked', async () => {
      adminRepository.findAllSlots.mockResolvedValue([
        {
          id: 's1',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:30',
          roomId: 'r2',
          facultyId: 'f1', // Same faculty
          studentGroupId: 'g2',
          courseId: 'c2',
        },
      ]);

      await expect(
        adminService.createSlot({
          dayOfWeek: 1,
          startTime: '10:00', // Overlaps 09:00-10:30
          endTime: '11:30',
          roomId: 'r1',
          facultyId: 'f1',
          studentGroupId: 'g1',
          courseId: 'c1',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError if room is double-booked', async () => {
      adminRepository.findAllSlots.mockResolvedValue([
        {
          id: 's1',
          dayOfWeek: 2,
          startTime: '10:00',
          endTime: '11:00',
          roomId: 'r1', // Same room
          facultyId: 'f2',
          studentGroupId: 'g2',
          courseId: 'c2',
        },
      ]);

      await expect(
        adminService.createSlot({
          dayOfWeek: 2,
          startTime: '10:30', // Overlaps 10:00-11:00
          endTime: '11:30',
          roomId: 'r1',
          facultyId: 'f1',
          studentGroupId: 'g1',
          courseId: 'c1',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('creates slot when there are no time collisions', async () => {
      adminRepository.findAllSlots.mockResolvedValue([
        {
          id: 's1',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          roomId: 'r1',
          facultyId: 'f1',
          studentGroupId: 'g1',
          courseId: 'c2',
        },
      ]);
      adminRepository.createTimetableSlot.mockImplementation(async (d) => ({ id: 'new-slot', ...d }));

      const result = await adminService.createSlot({
        dayOfWeek: 1,
        startTime: '10:00', // Adjacent, does NOT overlap
        endTime: '11:00',
        roomId: 'r1',
        facultyId: 'f1',
        studentGroupId: 'g1',
        courseId: 'c1',
      });

      expect(result).toHaveProperty('id', 'new-slot');
      expect(adminRepository.createTimetableSlot).toHaveBeenCalled();
    });

    it('deletes timetable slot and refreshes faculty workload', async () => {
      adminRepository.findSlotById.mockResolvedValue({ id: 's1', facultyId: 'f1' });
      adminRepository.deleteSlot.mockResolvedValue({ id: 's1' });
      adminRepository.findFacultyById.mockResolvedValue({ id: 'f1', slots: [] });
      adminRepository.updateFaculty.mockResolvedValue({});

      const res = await adminService.deleteSlot('s1');
      expect(res.id).toBe('s1');
      expect(adminRepository.deleteSlot).toHaveBeenCalledWith('s1');
    });

    it('throws NotFoundError when deleting non-existent slot', async () => {
      adminRepository.findSlotById.mockResolvedValue(null);
      await expect(adminService.deleteSlot('s-404')).rejects.toThrow(NotFoundError);
    });
  });

  // ==========================================
  // TIMETABLE VERIFICATION
  // ==========================================
  describe('Timetable Verification', () => {
    it('identifies room and faculty conflicts accurately', async () => {
      const room = { id: 'r1', name: 'LH-1', capacity: 30 };
      const faculty = { id: 'f1', name: 'Dr. Adams', maxHoursPerWeek: 10, slots: [] };
      const group = { id: 'g1', name: 'CSE-1', students: [{}, {}, {}] };
      const course = { id: 'c1', code: 'CS101', name: 'Programming', studentGroupId: 'g1', facultyId: 'f1' };

      adminRepository.findAllRooms.mockResolvedValue([room]);
      adminRepository.findAllFaculty.mockResolvedValue([faculty]);
      adminRepository.findAllStudentGroups.mockResolvedValue([group]);
      adminRepository.findAllCourses.mockResolvedValue([course]);

      // 2 overlapping slots with same room & faculty
      adminRepository.findAllSlots.mockResolvedValue([
        {
          id: 'slot-1',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:30',
          roomId: 'r1',
          facultyId: 'f1',
          studentGroupId: 'g1',
          courseId: 'c1',
          room,
          faculty,
          studentGroup: group,
        },
        {
          id: 'slot-2',
          dayOfWeek: 1,
          startTime: '10:00',
          endTime: '11:00',
          roomId: 'r1',
          facultyId: 'f1',
          studentGroupId: 'g1',
          courseId: 'c1',
          room,
          faculty,
          studentGroup: group,
        },
      ]);

      const report = await adminService.verifyTimetable();

      expect(report.isValid).toBe(false);
      expect(report.summary.totalConflicts).toBeGreaterThan(0);
      expect(report.conflicts.some((c) => c.type === 'room_double_booking')).toBe(true);
      expect(report.conflicts.some((c) => c.type === 'faculty_collision')).toBe(true);
    });

    it('detects capacity violations, unscheduled courses, and workload overflow warnings', async () => {
      const smallRoom = { id: 'r-small', name: 'Small Room', capacity: 2 };
      const facultyOverload = { id: 'f-over', name: 'Dr. Busy', maxHoursPerWeek: 1, slots: [] };
      const group = { id: 'g1', name: 'Large Group', students: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }] };
      const course1 = { id: 'c1', code: 'C1', name: 'Course 1', studentGroupId: 'g1', facultyId: 'f-over' };
      const courseUnscheduled = { id: 'c2', code: 'C2', name: 'Unscheduled', studentGroupId: 'g1', facultyId: 'f-over' };

      adminRepository.findAllRooms.mockResolvedValue([smallRoom]);
      adminRepository.findAllFaculty.mockResolvedValue([facultyOverload]);
      adminRepository.findAllStudentGroups.mockResolvedValue([group]);
      adminRepository.findAllCourses.mockResolvedValue([course1, courseUnscheduled]);

      adminRepository.findAllSlots.mockResolvedValue([
        {
          id: 's1',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '11:00', // 2 hours > 1 hour max
          roomId: 'r-small',
          facultyId: 'f-over',
          studentGroupId: 'g1',
          courseId: 'c1',
          room: smallRoom,
          faculty: facultyOverload,
          studentGroup: group,
        },
      ]);

      const report = await adminService.verifyTimetable();
      expect(report.isValid).toBe(true); // zero hard collisions
      expect(report.warnings.some((w) => w.type === 'capacity_violation')).toBe(true);
      expect(report.warnings.some((w) => w.type === 'unscheduled_courses')).toBe(true);
      expect(report.warnings.some((w) => w.type === 'workload_overflow')).toBe(true);
    });

    it('returns isValid: true when schedule is collision-free', async () => {
      const room = { id: 'r1', name: 'LH-1', capacity: 40 };
      const faculty = { id: 'f1', name: 'Dr. Adams', maxHoursPerWeek: 20 };
      const group = { id: 'g1', name: 'CSE-1', students: [{ id: 's1' }] };
      const course = { id: 'c1', code: 'CS101', name: 'Programming', studentGroupId: 'g1', facultyId: 'f1' };

      adminRepository.findAllRooms.mockResolvedValue([room]);
      adminRepository.findAllFaculty.mockResolvedValue([faculty]);
      adminRepository.findAllStudentGroups.mockResolvedValue([group]);
      adminRepository.findAllCourses.mockResolvedValue([course]);

      adminRepository.findAllSlots.mockResolvedValue([
        {
          id: 'slot-1',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          roomId: 'r1',
          facultyId: 'f1',
          studentGroupId: 'g1',
          courseId: 'c1',
          room,
          faculty,
          studentGroup: group,
        },
        {
          id: 'slot-2',
          dayOfWeek: 2,
          startTime: '09:00',
          endTime: '10:00',
          roomId: 'r1',
          facultyId: 'f1',
          studentGroupId: 'g1',
          courseId: 'c1',
          room,
          faculty,
          studentGroup: group,
        },
      ]);

      const report = await adminService.verifyTimetable();
      expect(report.isValid).toBe(true);
      expect(report.summary.totalConflicts).toBe(0);
    });
  });

  // ==========================================
  // TIMETABLE GENERATION
  // ==========================================
  describe('Timetable Generation Engine', () => {
    it('throws BadRequestError if no rooms are configured', async () => {
      adminRepository.findAllCourses.mockResolvedValue([{ id: 'c1', credits: 3 }]);
      adminRepository.findAllRooms.mockResolvedValue([]);
      adminRepository.findAllFaculty.mockResolvedValue([{ id: 'f1' }]);
      adminRepository.findAllSlots.mockResolvedValue([]);
      adminRepository.findAllStudentGroups.mockResolvedValue([]);

      await expect(adminService.generateTimetable({})).rejects.toThrow(BadRequestError);
    });

    it('generates non-conflicting slots for courses', async () => {
      const rooms = [
        { id: 'r1', name: 'Room 101', capacity: 40, type: 'lecture' },
        { id: 'r2', name: 'Room 102', capacity: 40, type: 'lecture' },
      ];
      const faculty = [
        { id: 'f1', name: 'Prof. Gauss', department: 'Math', slots: [] },
        { id: 'f2', name: 'Prof. Euler', department: 'CS', slots: [] },
      ];
      const group = { id: 'g1', name: 'CS-2026', students: [] };
      const courses = [
        { id: 'c1', code: 'CS101', name: 'Calculus', credits: 2, studentGroupId: 'g1', facultyId: 'f1' },
        { id: 'c2', code: 'CS102', name: 'Data Structures', credits: 2, studentGroupId: 'g1', facultyId: 'f2' },
      ];

      adminRepository.findAllCourses.mockResolvedValue(courses);
      adminRepository.findAllRooms.mockResolvedValue(rooms);
      adminRepository.findAllFaculty.mockResolvedValue(faculty);
      adminRepository.findAllSlots.mockResolvedValue([]);
      adminRepository.findAllStudentGroups.mockResolvedValue([group]);
      adminRepository.createManySlots.mockImplementation(async (slots) => slots.map((s, i) => ({ id: `slot-${i}`, ...s })));
      adminRepository.findFacultyById.mockResolvedValue({ id: 'f1', slots: [] });
      adminRepository.updateFaculty.mockResolvedValue({});

      const result = await adminService.generateTimetable({
        studentGroupId: 'g1',
        clearExisting: true,
      });

      expect(result.scheduledCount).toBe(4); // 2 credits + 2 credits = 4 slots
      expect(adminRepository.deleteSlotsByGroup).toHaveBeenCalledWith('g1');
      expect(result.verification.isValid).toBe(true);
    });
  });

  // ==========================================
  // SDUI DASHBOARD CONTRACT
  // ==========================================
  describe('Server-Driven UI Dashboard', () => {
    it('returns exact SDUI schema structure', async () => {
      adminRepository.countCourses.mockResolvedValue(10);
      adminRepository.countFaculty.mockResolvedValue(5);
      adminRepository.countStudents.mockResolvedValue(120);
      adminRepository.countRooms.mockResolvedValue(6);
      adminRepository.findAllRooms.mockResolvedValue([{ id: 'r1', name: 'R1' }]);
      adminRepository.findAllFaculty.mockResolvedValue([{ id: 'f1', name: 'Dr. Turing' }]);
      adminRepository.findAllSlots.mockResolvedValue([]);
      adminRepository.findAllStudentGroups.mockResolvedValue([
        { id: 'g1', name: 'CS-A', students: [{}, {}], courses: [{ id: 'c1' }] },
      ]);
      adminRepository.findAllCourses.mockResolvedValue([{ id: 'c1' }]);

      const dashboard = await adminService.getDashboardData();

      expect(dashboard).toHaveProperty('components');
      expect(Array.isArray(dashboard.components)).toBe(true);

      const types = dashboard.components.map((c) => c.type);
      expect(types).toContain('stats');
      expect(types).toContain('row');

      const statsComp = dashboard.components.find((c) => c.type === 'stats');
      expect(statsComp.data).toEqual({
        courses: 10,
        faculty: 5,
        students: 120,
        rooms: 6,
      });
    });
  });
});
