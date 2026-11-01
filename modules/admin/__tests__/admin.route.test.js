import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../server.js';
import prisma from '../../../db.js';
import config from '../../../config/env.js';

describe('Admin API Integration Routes', () => {
  const adminToken = jwt.sign(
    { id: 'admin-1', email: 'admin@campus.edu', role: 'admin', name: 'Admin User' },
    config.JWT_SECRET
  );
  const studentToken = jwt.sign(
    { id: 'student-1', email: 'student@campus.edu', role: 'student', name: 'Student User' },
    config.JWT_SECRET
  );
  const facultyToken = jwt.sign(
    { id: 'faculty-1', email: 'faculty@campus.edu', role: 'faculty', name: 'Faculty User' },
    config.JWT_SECRET
  );

  const testSuffix = Date.now();

  beforeAll(async () => {
    // Ensure clean state for test entities
    await prisma.timetableSlot.deleteMany({});
    await prisma.course.deleteMany({ where: { code: { contains: 'TEST' } } });
    await prisma.student.deleteMany({ where: { email: { contains: 'test' } } });
    await prisma.studentGroup.deleteMany({ where: { name: { contains: 'TEST' } } });
    await prisma.room.deleteMany({ where: { name: { contains: 'TEST' } } });
    await prisma.faculty.deleteMany({ where: { email: { contains: 'test' } } });
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.timetableSlot.deleteMany({});
    await prisma.course.deleteMany({ where: { code: { contains: 'TEST' } } });
    await prisma.student.deleteMany({ where: { email: { contains: 'test' } } });
    await prisma.studentGroup.deleteMany({ where: { name: { contains: 'TEST' } } });
    await prisma.room.deleteMany({ where: { name: { contains: 'TEST' } } });
    await prisma.faculty.deleteMany({ where: { email: { contains: 'test' } } });
    await prisma.$disconnect();
  });

  // ==========================================
  // RBAC & AUTH GUARDS
  // ==========================================
  describe('RBAC & Auth Guards', () => {
    it('returns 401 when no token is supplied', async () => {
      const res = await request(app).get('/api/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 when user has student role', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 when user has faculty role', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${facultyToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 when user has admin role', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('components');
    });
  });

  // ==========================================
  // FACULTY MANAGEMENT
  // ==========================================
  describe('Faculty Endpoints', () => {
    let createdFacultyId;
    const facultyEmail = `test-faculty-${testSuffix}@campus.edu`;

    it('returns 400 when creating faculty with invalid payload', async () => {
      const res = await request(app)
        .post('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A', // too short
          email: 'not-an-email',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('successfully creates a faculty member', async () => {
      const res = await request(app)
        .post('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Test Professor',
          email: facultyEmail,
          department: 'Computer Science',
          maxHoursPerWeek: 18,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Dr. Test Professor');
      expect(res.body.data.email).toBe(facultyEmail.toLowerCase());
      createdFacultyId = res.body.data.id;
    });

    it('returns 409 when creating faculty with duplicate email', async () => {
      const res = await request(app)
        .post('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Prof',
          email: facultyEmail,
          department: 'Mathematics',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('retrieves faculty list including newly created faculty', async () => {
      const res = await request(app)
        .get('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((f) => f.id === createdFacultyId)).toBe(true);
    });

    it('retrieves faculty by id', async () => {
      const res = await request(app)
        .get(`/api/admin/faculty/${createdFacultyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdFacultyId);
    });

    it('updates faculty details', async () => {
      const res = await request(app)
        .put(`/api/admin/faculty/${createdFacultyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dr. Test Professor (Updated)',
          maxHoursPerWeek: 22,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Dr. Test Professor (Updated)');
      expect(res.body.data.maxHoursPerWeek).toBe(22);
    });
  });

  // ==========================================
  // ROOM MANAGEMENT
  // ==========================================
  describe('Room Endpoints', () => {
    let createdRoomId;
    const roomName = `TEST-ROOM-${testSuffix}`;

    it('returns 400 when creating room with invalid capacity', async () => {
      const res = await request(app)
        .post('/api/admin/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: roomName,
          capacity: -5,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('successfully creates a room', async () => {
      const res = await request(app)
        .post('/api/admin/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: roomName,
          capacity: 45,
          type: 'lecture',
          building: 'Science Complex',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(roomName);
      expect(res.body.data.capacity).toBe(45);
      expect(res.body.data.building).toBe('Science Complex');
      createdRoomId = res.body.data.id;
    });

    it('returns 409 when creating room with duplicate name', async () => {
      const res = await request(app)
        .post('/api/admin/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: roomName,
          capacity: 50,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('retrieves all rooms', async () => {
      const res = await request(app)
        .get('/api/admin/rooms')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((r) => r.id === createdRoomId)).toBe(true);
    });

    it('updates room details', async () => {
      const res = await request(app)
        .put(`/api/admin/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          capacity: 65,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.capacity).toBe(65);
    });
  });

  // ==========================================
  // CAMPUS ENTITIES (STUDENT GROUPS, STUDENTS, COURSES)
  // ==========================================
  describe('Campus Entities Endpoints', () => {
    let groupId;

    it('creates and lists student groups', async () => {
      const res = await request(app)
        .post('/api/admin/student-groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `TEST-GRP-ENT-${testSuffix}` });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      groupId = res.body.data.id;

      const listRes = await request(app)
        .get('/api/admin/student-groups')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
    });

    it('creates and lists students', async () => {
      const res = await request(app)
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Student',
          email: `test-student-${testSuffix}@campus.edu`,
          rollNumber: `ROLL-${testSuffix}`,
          studentGroupId: groupId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
    });

    it('creates and lists courses', async () => {
      const res = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: `TEST-CS-ENT-${testSuffix}`,
          name: 'Operating Systems',
          credits: 4,
          studentGroupId: groupId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const listRes = await request(app)
        .get('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
    });
  });

  // ==========================================
  // TIMETABLE ENDPOINTS & ENGINE
  // ==========================================
  describe('Timetable Scheduling & Verification Endpoints', () => {
    let facultyId;
    let roomId;
    let groupId;
    let courseId;
    let slotId;

    beforeAll(async () => {
      // Create required test entities
      const fac = await prisma.faculty.create({
        data: {
          name: 'TT Prof',
          email: `tt-prof-${testSuffix}@campus.edu`,
          department: 'TEST-DEPT',
          maxHoursPerWeek: 20,
        },
      });
      facultyId = fac.id;

      const rm = await prisma.room.create({
        data: {
          name: `TT-RM-${testSuffix}`,
          capacity: 60,
          type: 'lecture',
        },
      });
      roomId = rm.id;

      const grp = await prisma.studentGroup.create({
        data: {
          name: `TEST-GRP-${testSuffix}`,
        },
      });
      groupId = grp.id;

      const crs = await prisma.course.create({
        data: {
          code: `TEST-CS-${testSuffix}`,
          name: 'Test Algorithms',
          credits: 3,
          studentGroupId: groupId,
          facultyId,
        },
      });
      courseId = crs.id;
    });

    it('creates a timetable slot successfully', async () => {
      const res = await request(app)
        .post('/api/admin/timetable/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          roomId,
          facultyId,
          studentGroupId: groupId,
          courseId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      slotId = res.body.data.id;
    });

    it('returns 409 when slot creates room or faculty conflict', async () => {
      const res = await request(app)
        .post('/api/admin/timetable/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dayOfWeek: 1,
          startTime: '09:30', // Overlaps with 09:00-10:00
          endTime: '10:30',
          roomId,
          facultyId,
          studentGroupId: groupId,
          courseId,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('verifies timetable and returns conflict report', async () => {
      const res = await request(app)
        .get('/api/admin/timetable/verify')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('isValid');
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data.summary).toHaveProperty('totalSlots');
    });

    it('generates timetable automatically for student group', async () => {
      const res = await request(app)
        .post('/api/admin/timetable/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentGroupId: groupId,
          clearExisting: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.scheduledCount).toBe(3); // 3 credits = 3 slots
      expect(res.body.data.verification.isValid).toBe(true);
    });

    it('retrieves all timetable slots and allows deleting a slot', async () => {
      const listRes = await request(app)
        .get('/api/admin/timetable')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.data)).toBe(true);
      const existingSlot = listRes.body.data[0];

      if (existingSlot) {
        const delRes = await request(app)
          .delete(`/api/admin/timetable/slots/${existingSlot.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(delRes.status).toBe(200);
        expect(delRes.body.success).toBe(true);
      }
    });
  });

  // ==========================================
  // SDUI DASHBOARD CONTRACT
  // ==========================================
  describe('SDUI Dashboard Endpoint', () => {
    it('returns compliant SDUI structure for frontend Renderer.jsx', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('components');

      const comps = res.body.data.components;
      expect(comps.length).toBeGreaterThanOrEqual(3);

      const stats = comps.find((c) => c.type === 'stats');
      expect(stats).toBeDefined();
      expect(stats.data).toHaveProperty('courses');
      expect(stats.data).toHaveProperty('faculty');
      expect(stats.data).toHaveProperty('students');
      expect(stats.data).toHaveProperty('rooms');
    });
  });
});
