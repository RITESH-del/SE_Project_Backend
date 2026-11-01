import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../../shared/errors/AppError.js';
import { defaultTimeSlots } from './admin.validation.js';

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const slotsOverlap = (slotA, slotB) => {
  if (Number(slotA.dayOfWeek) !== Number(slotB.dayOfWeek)) return false;
  const startA = timeToMinutes(slotA.startTime);
  const endA = timeToMinutes(slotA.endTime);
  const startB = timeToMinutes(slotB.startTime);
  const endB = timeToMinutes(slotB.endTime);
  return startA < endB && startB < endA;
};

class AdminService {
  constructor(adminRepository) {
    this.adminRepository = adminRepository;
  }

  // ==========================================
  // FACULTY MANAGEMENT
  // ==========================================

  async createFaculty({ name, email, department, workloadHours = 0, maxHoursPerWeek = 20, userId = null }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.adminRepository.findFacultyByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError('Faculty with this email already exists');
    }

    return this.adminRepository.createFaculty({
      name: name.trim(),
      email: normalizedEmail,
      department: department.trim(),
      workloadHours,
      maxHoursPerWeek,
      userId: userId || null,
    });
  }

  async getAllFaculty() {
    return this.adminRepository.findAllFaculty();
  }

  async getFacultyById(id) {
    const faculty = await this.adminRepository.findFacultyById(id);
    if (!faculty) {
      throw new NotFoundError('Faculty member not found');
    }
    return faculty;
  }

  async updateFaculty(id, data) {
    const existing = await this.adminRepository.findFacultyById(id);
    if (!existing) {
      throw new NotFoundError('Faculty member not found');
    }

    if (data.email) {
      const normalizedEmail = data.email.toLowerCase().trim();
      const duplicate = await this.adminRepository.findFacultyByEmail(normalizedEmail);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError('Another faculty member with this email already exists');
      }
      data.email = normalizedEmail;
    }

    if (data.name) data.name = data.name.trim();
    if (data.department) data.department = data.department.trim();

    return this.adminRepository.updateFaculty(id, data);
  }

  async deleteFaculty(id) {
    const existing = await this.adminRepository.findFacultyById(id);
    if (!existing) {
      throw new NotFoundError('Faculty member not found');
    }
    return this.adminRepository.deleteFaculty(id);
  }

  // ==========================================
  // ROOM MANAGEMENT
  // ==========================================

  async createRoom({ name, capacity, type = 'lecture', building = null }) {
    const trimmedName = name.trim();
    const existing = await this.adminRepository.findRoomByName(trimmedName);
    if (existing) {
      throw new ConflictError('Room with this name already exists');
    }

    return this.adminRepository.createRoom({
      name: trimmedName,
      capacity,
      type,
      building: building ? building.trim() : null,
    });
  }

  async getAllRooms() {
    return this.adminRepository.findAllRooms();
  }

  async getRoomById(id) {
    const room = await this.adminRepository.findRoomById(id);
    if (!room) {
      throw new NotFoundError('Room not found');
    }
    return room;
  }

  async updateRoom(id, data) {
    const existing = await this.adminRepository.findRoomById(id);
    if (!existing) {
      throw new NotFoundError('Room not found');
    }

    if (data.name) {
      const trimmedName = data.name.trim();
      const duplicate = await this.adminRepository.findRoomByName(trimmedName);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError('Another room with this name already exists');
      }
      data.name = trimmedName;
    }

    if (data.building) data.building = data.building.trim();

    return this.adminRepository.updateRoom(id, data);
  }

  async deleteRoom(id) {
    const existing = await this.adminRepository.findRoomById(id);
    if (!existing) {
      throw new NotFoundError('Room not found');
    }
    return this.adminRepository.deleteRoom(id);
  }

  // ==========================================
  // CAMPUS ENTITIES (Student Groups, Students, Courses)
  // ==========================================

  async createStudentGroup({ name }) {
    const trimmedName = name.trim();
    const existing = await this.adminRepository.findStudentGroupByName(trimmedName);
    if (existing) {
      throw new ConflictError('Student group with this name already exists');
    }
    return this.adminRepository.createStudentGroup({ name: trimmedName });
  }

  async getAllStudentGroups() {
    return this.adminRepository.findAllStudentGroups();
  }

  async createStudent({ name, email, rollNumber, studentGroupId, userId = null }) {
    const normalizedEmail = email.toLowerCase().trim();
    const trimmedRoll = rollNumber.trim();

    const existingEmail = await this.adminRepository.findStudentByEmail(normalizedEmail);
    if (existingEmail) {
      throw new ConflictError('Student with this email already exists');
    }

    const existingRoll = await this.adminRepository.findStudentByRollNumber(trimmedRoll);
    if (existingRoll) {
      throw new ConflictError('Student with this roll number already exists');
    }

    const group = await this.adminRepository.findStudentGroupById(studentGroupId);
    if (!group) {
      throw new NotFoundError('Student group not found');
    }

    return this.adminRepository.createStudent({
      name: name.trim(),
      email: normalizedEmail,
      rollNumber: trimmedRoll,
      studentGroupId,
      userId: userId || null,
    });
  }

  async getAllStudents() {
    return this.adminRepository.findAllStudents();
  }

  async createCourse({ code, name, credits, studentGroupId, facultyId = null }) {
    const trimmedCode = code.toUpperCase().trim();
    const existingCode = await this.adminRepository.findCourseByCode(trimmedCode);
    if (existingCode) {
      throw new ConflictError('Course with this code already exists');
    }

    const group = await this.adminRepository.findStudentGroupById(studentGroupId);
    if (!group) {
      throw new NotFoundError('Student group not found');
    }

    if (facultyId) {
      const faculty = await this.adminRepository.findFacultyById(facultyId);
      if (!faculty) {
        throw new NotFoundError('Faculty member not found');
      }
    }

    return this.adminRepository.createCourse({
      code: trimmedCode,
      name: name.trim(),
      credits,
      studentGroupId,
      facultyId: facultyId || null,
    });
  }

  async getAllCourses(filter = {}) {
    return this.adminRepository.findAllCourses(filter);
  }

  // ==========================================
  // TIMETABLE ENGINE & SLOTS
  // ==========================================

  async getAllSlots(filter = {}) {
    return this.adminRepository.findAllSlots(filter);
  }

  async createSlot({ dayOfWeek, startTime, endTime, roomId, facultyId, studentGroupId, courseId }) {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    if (startMin >= endMin) {
      throw new BadRequestError('Start time must be strictly before end time');
    }

    // Verify entities exist
    const [room, faculty, group, course] = await Promise.all([
      this.adminRepository.findRoomById(roomId),
      this.adminRepository.findFacultyById(facultyId),
      this.adminRepository.findStudentGroupById(studentGroupId),
      this.adminRepository.findCourseById(courseId),
    ]);

    if (!room) throw new NotFoundError('Room not found');
    if (!faculty) throw new NotFoundError('Faculty not found');
    if (!group) throw new NotFoundError('Student group not found');
    if (!course) throw new NotFoundError('Course not found');

    // Conflict detection against existing slots
    const targetSlot = { dayOfWeek, startTime, endTime };
    const allSlots = await this.adminRepository.findAllSlots();

    for (const existingSlot of allSlots) {
      if (slotsOverlap(targetSlot, existingSlot)) {
        if (existingSlot.roomId === roomId) {
          throw new ConflictError(
            `Room conflict: Room ${room.name} is already booked on day ${dayOfWeek} from ${existingSlot.startTime} to ${existingSlot.endTime}`
          );
        }
        if (existingSlot.facultyId === facultyId) {
          throw new ConflictError(
            `Faculty conflict: Faculty ${faculty.name} is already assigned on day ${dayOfWeek} from ${existingSlot.startTime} to ${existingSlot.endTime}`
          );
        }
        if (existingSlot.studentGroupId === studentGroupId) {
          throw new ConflictError(
            `Group conflict: Student group ${group.name} already has a class on day ${dayOfWeek} from ${existingSlot.startTime} to ${existingSlot.endTime}`
          );
        }
      }
    }

    const createdSlot = await this.adminRepository.createTimetableSlot({
      dayOfWeek,
      startTime,
      endTime,
      roomId,
      facultyId,
      studentGroupId,
      courseId,
    });

    await this.refreshFacultyWorkload(facultyId);

    return createdSlot;
  }

  async deleteSlot(id) {
    const slot = await this.adminRepository.findSlotById(id);
    if (!slot) {
      throw new NotFoundError('Timetable slot not found');
    }
    const facultyId = slot.facultyId;
    const deleted = await this.adminRepository.deleteSlot(id);
    await this.refreshFacultyWorkload(facultyId);
    return deleted;
  }

  async refreshFacultyWorkload(facultyId) {
    const faculty = await this.adminRepository.findFacultyById(facultyId);
    if (!faculty) return;
    const slots = faculty.slots || [];
    let totalMinutes = 0;
    for (const slot of slots) {
      totalMinutes += timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
    }
    const workloadHours = Math.round(totalMinutes / 60);
    await this.adminRepository.updateFaculty(facultyId, { workloadHours });
  }

  // ==========================================
  // TIMETABLE VERIFICATION
  // ==========================================

  async verifyTimetable(studentGroupId = null) {
    const filter = studentGroupId ? { studentGroupId } : {};
    const [slots, rooms, facultyList, groups, courses] = await Promise.all([
      this.adminRepository.findAllSlots(filter),
      this.adminRepository.findAllRooms(),
      this.adminRepository.findAllFaculty(),
      this.adminRepository.findAllStudentGroups(),
      this.adminRepository.findAllCourses(filter),
    ]);

    const conflicts = [];
    const warnings = [];

    const roomMap = new Map(rooms.map((r) => [r.id, r]));
    const facultyMap = new Map(facultyList.map((f) => [f.id, f]));
    const groupMap = new Map(groups.map((g) => [g.id, g]));
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // Check pairwise overlap collisions
    for (let i = 0; i < slots.length; i++) {
      const slotA = slots[i];
      const roomA = roomMap.get(slotA.roomId) || slotA.room;
      const facultyA = facultyMap.get(slotA.facultyId) || slotA.faculty;
      const groupA = groupMap.get(slotA.studentGroupId) || slotA.studentGroup;

      for (let j = i + 1; j < slots.length; j++) {
        const slotB = slots[j];

        if (slotsOverlap(slotA, slotB)) {
          // Room collision
          if (slotA.roomId === slotB.roomId) {
            conflicts.push({
              type: 'room_double_booking',
              severity: 'error',
              message: `Room "${roomA?.name || slotA.roomId}" is double-booked on day ${slotA.dayOfWeek} (${slotA.startTime}-${slotA.endTime} vs ${slotB.startTime}-${slotB.endTime})`,
              slotIds: [slotA.id, slotB.id],
              roomId: slotA.roomId,
            });
          }

          // Faculty collision
          if (slotA.facultyId === slotB.facultyId) {
            conflicts.push({
              type: 'faculty_collision',
              severity: 'error',
              message: `Faculty "${facultyA?.name || slotA.facultyId}" is double-booked on day ${slotA.dayOfWeek} (${slotA.startTime}-${slotA.endTime} vs ${slotB.startTime}-${slotB.endTime})`,
              slotIds: [slotA.id, slotB.id],
              facultyId: slotA.facultyId,
            });
          }

          // Student group collision
          if (slotA.studentGroupId === slotB.studentGroupId) {
            conflicts.push({
              type: 'group_collision',
              severity: 'error',
              message: `Student group "${groupA?.name || slotA.studentGroupId}" has overlapping classes on day ${slotA.dayOfWeek} (${slotA.startTime}-${slotA.endTime} vs ${slotB.startTime}-${slotB.endTime})`,
              slotIds: [slotA.id, slotB.id],
              studentGroupId: slotA.studentGroupId,
            });
          }
        }
      }

      // Check room capacity
      if (roomA && groupA && groupA.students) {
        const studentCount = groupA.students.length;
        if (studentCount > roomA.capacity) {
          warnings.push({
            type: 'capacity_violation',
            severity: 'warning',
            message: `Room "${roomA.name}" (capacity ${roomA.capacity}) is under-capacity for group "${groupA.name}" (${studentCount} students)`,
            slotId: slotA.id,
            roomId: slotA.roomId,
            studentGroupId: slotA.studentGroupId,
          });
        }
      }
    }

    // Check unscheduled courses
    const scheduledCourseIds = new Set(slots.map((s) => s.courseId));
    const unscheduledCourses = [];
    for (const course of courses) {
      if (!scheduledCourseIds.has(course.id)) {
        unscheduledCourses.push({
          id: course.id,
          code: course.code,
          name: course.name,
          studentGroupId: course.studentGroupId,
          facultyId: course.facultyId,
        });
      }
    }

    if (unscheduledCourses.length > 0) {
      warnings.push({
        type: 'unscheduled_courses',
        severity: 'warning',
        message: `${unscheduledCourses.length} course(s) have no scheduled timetable slots`,
        courses: unscheduledCourses,
      });
    }

    // Check faculty workload
    for (const faculty of facultyList) {
      const assignedSlots = slots.filter((s) => s.facultyId === faculty.id);
      let totalMinutes = 0;
      for (const s of assignedSlots) {
        totalMinutes += timeToMinutes(s.endTime) - timeToMinutes(s.startTime);
      }
      const totalHours = Math.round(totalMinutes / 60);
      if (totalHours > faculty.maxHoursPerWeek) {
        warnings.push({
          type: 'workload_overflow',
          severity: 'warning',
          message: `Faculty "${faculty.name}" workload (${totalHours}h) exceeds weekly limit (${faculty.maxHoursPerWeek}h)`,
          facultyId: faculty.id,
          totalHours,
          maxHours: faculty.maxHoursPerWeek,
        });
      }
    }

    const facultyConflictCount = conflicts.filter((c) => c.type === 'faculty_collision').length;
    const roomConflictCount = conflicts.filter((c) => c.type === 'room_double_booking').length;
    const groupConflictCount = conflicts.filter((c) => c.type === 'group_collision').length;

    return {
      isValid: conflicts.length === 0,
      summary: {
        totalSlots: slots.length,
        totalConflicts: conflicts.length,
        facultyConflicts: facultyConflictCount,
        roomConflicts: roomConflictCount,
        groupConflicts: groupConflictCount,
        totalWarnings: warnings.length,
        unscheduledCoursesCount: unscheduledCourses.length,
      },
      conflicts,
      warnings,
    };
  }

  // ==========================================
  // TIMETABLE GENERATION
  // ==========================================

  async generateTimetable({
    studentGroupId = null,
    daysOfWeek = [1, 2, 3, 4, 5],
    timeSlots = defaultTimeSlots,
    clearExisting = false,
  }) {
    if (clearExisting) {
      if (studentGroupId) {
        await this.adminRepository.deleteSlotsByGroup(studentGroupId);
      } else {
        await this.adminRepository.deleteAllSlots();
      }
    }

    const courseFilter = studentGroupId ? { studentGroupId } : {};
    const [courses, rooms, facultyList, existingSlots, groups] = await Promise.all([
      this.adminRepository.findAllCourses(courseFilter),
      this.adminRepository.findAllRooms(),
      this.adminRepository.findAllFaculty(),
      this.adminRepository.findAllSlots(),
      this.adminRepository.findAllStudentGroups(),
    ]);

    if (rooms.length === 0) {
      throw new BadRequestError('Cannot generate timetable: No rooms available. Please create rooms first.');
    }
    if (courses.length === 0) {
      throw new BadRequestError('Cannot generate timetable: No courses available.');
    }

    const groupMap = new Map(groups.map((g) => [g.id, g]));
    const bookedSlots = [...existingSlots];
    const generatedSlots = [];
    const unscheduledCourses = [];

    // Helper to test if a candidate (day, timeSlot, roomId, facultyId, groupId) has any conflict
    const isConflictFree = (day, tSlot, rId, fId, gId) => {
      const candidate = {
        dayOfWeek: day,
        startTime: tSlot.startTime,
        endTime: tSlot.endTime,
      };

      for (const b of bookedSlots) {
        if (slotsOverlap(candidate, b)) {
          if (b.roomId === rId) return false;
          if (b.facultyId === fId) return false;
          if (b.studentGroupId === gId) return false;
        }
      }
      return true;
    };

    // Sort courses by credits descending (larger requirements first)
    const sortedCourses = [...courses].sort((a, b) => b.credits - a.credits);

    for (const course of sortedCourses) {
      let facultyId = course.facultyId;
      if (!facultyId) {
        // Fallback: Pick faculty with least workload
        const eligibleFaculty = facultyList.length > 0 ? facultyList[0].id : null;
        if (!eligibleFaculty) {
          unscheduledCourses.push({
            courseId: course.id,
            code: course.code,
            reason: 'No assigned or available faculty',
          });
          continue;
        }
        facultyId = eligibleFaculty;
      }

      const group = groupMap.get(course.studentGroupId);
      const studentCount = group?.students ? group.students.length : 0;

      // Filter rooms: prefer capacity >= studentCount, and match lab type if lab
      const isLab = course.name.toLowerCase().includes('lab') || course.code.toLowerCase().includes('lab');
      const suitableRooms = [...rooms].sort((a, b) => {
        // Prioritize type match
        if (isLab && a.type === 'lab' && b.type !== 'lab') return -1;
        if (isLab && b.type === 'lab' && a.type !== 'lab') return 1;
        // Prioritize fitting capacity
        const aFits = a.capacity >= studentCount;
        const bFits = b.capacity >= studentCount;
        if (aFits && !bFits) return -1;
        if (!aFits && bFits) return 1;
        return a.capacity - b.capacity;
      });

      const requiredSessions = course.credits; // e.g. 3 credits = 3 sessions/slots
      let scheduledForThisCourse = 0;
      const scheduledDaysForCourse = new Set();

      for (let session = 0; session < requiredSessions; session++) {
        let placed = false;

        // Try distinct days first for balanced distribution
        const dayCandidates = [...daysOfWeek].sort((d1, d2) => {
          const d1Used = scheduledDaysForCourse.has(d1) ? 1 : 0;
          const d2Used = scheduledDaysForCourse.has(d2) ? 1 : 0;
          return d1Used - d2Used;
        });

        for (const day of dayCandidates) {
          if (placed) break;

          for (const tSlot of timeSlots) {
            if (placed) break;

            for (const room of suitableRooms) {
              if (isConflictFree(day, tSlot, room.id, facultyId, course.studentGroupId)) {
                const newSlot = {
                  dayOfWeek: day,
                  startTime: tSlot.startTime,
                  endTime: tSlot.endTime,
                  roomId: room.id,
                  facultyId,
                  studentGroupId: course.studentGroupId,
                  courseId: course.id,
                  status: 'scheduled',
                };

                bookedSlots.push(newSlot);
                generatedSlots.push(newSlot);
                scheduledDaysForCourse.add(day);
                scheduledForThisCourse++;
                placed = true;
                break;
              }
            }
          }
        }

        if (!placed) {
          unscheduledCourses.push({
            courseId: course.id,
            code: course.code,
            reason: `Could not schedule session ${session + 1} of ${requiredSessions} without conflict`,
          });
          break;
        }
      }
    }

    // Persist all generated slots
    const createdRecords = await this.adminRepository.createManySlots(generatedSlots);

    // Refresh workload for all affected faculty
    const uniqueFacultyIds = [...new Set(generatedSlots.map((s) => s.facultyId))];
    await Promise.all(uniqueFacultyIds.map((fId) => this.refreshFacultyWorkload(fId)));

    // Run verification on overall timetable
    const verification = await this.verifyTimetable(studentGroupId);

    return {
      scheduledCount: createdRecords.length,
      unscheduledCount: unscheduledCourses.length,
      unscheduledCourses,
      slots: createdRecords,
      verification,
    };
  }

  // ==========================================
  // SERVER-DRIVEN UI (SDUI) DASHBOARD
  // ==========================================

  async getDashboardData() {
    const [coursesCount, facultyCount, studentsCount, roomsCount, rooms, facultyList, slots, groups, courses] =
      await Promise.all([
        this.adminRepository.countCourses(),
        this.adminRepository.countFaculty(),
        this.adminRepository.countStudents(),
        this.adminRepository.countRooms(),
        this.adminRepository.findAllRooms(),
        this.adminRepository.findAllFaculty(),
        this.adminRepository.findAllSlots(),
        this.adminRepository.findAllStudentGroups(),
        this.adminRepository.findAllCourses(),
      ]);

    // Pie chart: Room utilization
    const activeRoomIds = new Set(slots.map((s) => s.roomId));
    const roomsInUse = rooms.filter((r) => activeRoomIds.has(r.id)).length;
    const roomsAvailable = Math.max(0, rooms.length - roomsInUse);

    // Bar chart: Teacher workload (top 15 faculty)
    const facultyClassCounts = new Map();
    for (const faculty of facultyList) {
      facultyClassCounts.set(faculty.id, {
        name: faculty.name,
        classes: 0,
      });
    }
    for (const slot of slots) {
      if (facultyClassCounts.has(slot.facultyId)) {
        facultyClassCounts.get(slot.facultyId).classes++;
      }
    }

    const teacherWorkloadData = Array.from(facultyClassCounts.values())
      .slice(0, 15)
      .map((item) => ({
        teacher: item.name,
        classes: item.classes,
      }));

    // Scheduling status metrics
    const scheduledCourseIds = new Set(slots.map((s) => s.courseId));
    const scheduledCoursesCount = scheduledCourseIds.size;
    const unscheduledCoursesCount = Math.max(0, coursesCount - scheduledCoursesCount);

    const facultyWithClassesCount = new Set(slots.map((s) => s.facultyId)).size;
    const verification = await this.verifyTimetable();

    const facultyConflicts = verification.summary.facultyConflicts;
    const roomConflicts = verification.summary.roomConflicts;
    const totalConflicts = verification.summary.totalConflicts;

    // Table rows: Student group progress
    const tableRows = groups.map((g, index) => {
      const groupCourses = g.courses || [];
      const totalGroupCourses = groupCourses.length;
      const scheduledGroupCourses = groupCourses.filter((c) => scheduledCourseIds.has(c.id)).length;

      const completion = totalGroupCourses > 0
        ? Math.round((scheduledGroupCourses / totalGroupCourses) * 100)
        : 100;

      let status = 'Complete';
      if (completion < 50) {
        status = 'Needs Attention';
      } else if (completion < 100) {
        status = 'In Progress';
      }

      return {
        id: index + 1,
        className: g.name,
        students: g.students ? g.students.length : 0,
        courses: totalGroupCourses,
        completion,
        status,
      };
    });

    return {
      components: [
        {
          type: 'stats',
          data: {
            courses: coursesCount,
            faculty: facultyCount,
            students: studentsCount,
            rooms: roomsCount,
          },
        },
        {
          type: 'row',
          data: {
            children: [
              {
                type: 'pie-chart',
                span: 4,
                data: {
                  title: 'Room Utilization',
                  data: [
                    { label: 'In use', value: roomsInUse },
                    { label: 'Available', value: roomsAvailable },
                  ],
                },
              },
              {
                type: 'bar-chart',
                span: 8,
                data: {
                  title: 'Teacher Workload',
                  xKey: 'teacher',
                  dataKey: 'classes',
                  xLabel: 'Teacher',
                  yLabel: 'Classes',
                  data: teacherWorkloadData,
                },
              },
            ],
          },
        },
        {
          type: 'row',
          data: {
            children: [
              {
                type: 'scheduling-status',
                span: 4,
                data: {
                  items: [
                    {
                      title: 'Timetable Completion',
                      current: scheduledCoursesCount,
                      total: coursesCount,
                      description: `${unscheduledCoursesCount} courses still need scheduling`,
                    },
                    {
                      title: 'Faculty Assignment',
                      current: facultyWithClassesCount,
                      total: facultyCount,
                      description: `${Math.max(0, facultyCount - facultyWithClassesCount)} faculty members still need assignment`,
                    },
                    {
                      title: 'Scheduling Conflicts',
                      value: totalConflicts,
                      description: `${facultyConflicts} faculty conflicts · ${roomConflicts} room conflicts`,
                      status: totalConflicts > 0 ? 'warning' : 'success',
                    },
                    {
                      title: 'Unscheduled Courses',
                      value: unscheduledCoursesCount,
                      description: 'Courses without a valid timetable slot',
                      status: unscheduledCoursesCount > 0 ? 'warning' : 'success',
                    },
                  ],
                },
              },
              {
                type: 'table',
                span: 8,
                data: {
                  title: null,
                  columns: [
                    { key: 'className', label: 'Class' },
                    { key: 'students', label: 'Students' },
                    { key: 'courses', label: 'Courses' },
                    {
                      key: 'completion',
                      label: 'Timetable Completion',
                      format: { type: 'progress' },
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      format: { type: 'badge' },
                    },
                  ],
                  rows: tableRows,
                },
              },
            ],
          },
        },
      ],
    };
  }
}

export { AdminService };
export default AdminService;
