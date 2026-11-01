import prisma from '../../db.js';

class AdminRepository {
  constructor(db = prisma) {
    this.db = db;
  }

  // --- Faculty Data Access ---
  async createFaculty(data) {
    return this.db.faculty.create({
      data,
    });
  }

  async findAllFaculty() {
    return this.db.faculty.findMany({
      include: {
        courses: true,
        slots: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findFacultyById(id) {
    return this.db.faculty.findUnique({
      where: { id },
      include: {
        courses: true,
        slots: {
          include: {
            room: true,
            course: true,
            studentGroup: true,
          },
        },
      },
    });
  }

  async findFacultyByEmail(email) {
    return this.db.faculty.findUnique({
      where: { email },
    });
  }

  async updateFaculty(id, data) {
    return this.db.faculty.update({
      where: { id },
      data,
    });
  }

  async deleteFaculty(id) {
    return this.db.faculty.delete({
      where: { id },
    });
  }

  // --- Room Data Access ---
  async createRoom(data) {
    return this.db.room.create({
      data,
    });
  }

  async findAllRooms() {
    return this.db.room.findMany({
      include: {
        slots: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findRoomById(id) {
    return this.db.room.findUnique({
      where: { id },
      include: {
        slots: {
          include: {
            faculty: true,
            course: true,
            studentGroup: true,
          },
        },
      },
    });
  }

  async findRoomByName(name) {
    return this.db.room.findUnique({
      where: { name },
    });
  }

  async updateRoom(id, data) {
    return this.db.room.update({
      where: { id },
      data,
    });
  }

  async deleteRoom(id) {
    return this.db.room.delete({
      where: { id },
    });
  }

  // --- Student Groups Data Access ---
  async createStudentGroup(data) {
    return this.db.studentGroup.create({
      data,
    });
  }

  async findAllStudentGroups() {
    return this.db.studentGroup.findMany({
      include: {
        students: true,
        courses: true,
        slots: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findStudentGroupById(id) {
    return this.db.studentGroup.findUnique({
      where: { id },
      include: {
        students: true,
        courses: {
          include: { faculty: true },
        },
        slots: {
          include: {
            room: true,
            faculty: true,
            course: true,
          },
        },
      },
    });
  }

  async findStudentGroupByName(name) {
    return this.db.studentGroup.findUnique({
      where: { name },
    });
  }

  // --- Student Data Access ---
  async createStudent(data) {
    return this.db.student.create({
      data,
      include: {
        studentGroup: true,
      },
    });
  }

  async findAllStudents() {
    return this.db.student.findMany({
      include: {
        studentGroup: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findStudentById(id) {
    return this.db.student.findUnique({
      where: { id },
      include: {
        studentGroup: true,
      },
    });
  }

  async findStudentByEmail(email) {
    return this.db.student.findUnique({
      where: { email },
    });
  }

  async findStudentByRollNumber(rollNumber) {
    return this.db.student.findUnique({
      where: { rollNumber },
    });
  }

  // --- Course Data Access ---
  async createCourse(data) {
    return this.db.course.create({
      data,
      include: {
        faculty: true,
        studentGroup: true,
      },
    });
  }

  async findAllCourses(filter = {}) {
    return this.db.course.findMany({
      where: filter,
      include: {
        faculty: true,
        studentGroup: true,
        slots: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  async findCourseById(id) {
    return this.db.course.findUnique({
      where: { id },
      include: {
        faculty: true,
        studentGroup: true,
        slots: true,
      },
    });
  }

  async findCourseByCode(code) {
    return this.db.course.findUnique({
      where: { code },
    });
  }

  // --- Timetable Slot Data Access ---
  async createTimetableSlot(data) {
    return this.db.timetableSlot.create({
      data,
      include: {
        room: true,
        faculty: true,
        studentGroup: true,
        course: true,
      },
    });
  }

  async findAllSlots(filter = {}) {
    return this.db.timetableSlot.findMany({
      where: filter,
      include: {
        room: true,
        faculty: true,
        studentGroup: true,
        course: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findSlotById(id) {
    return this.db.timetableSlot.findUnique({
      where: { id },
      include: {
        room: true,
        faculty: true,
        studentGroup: true,
        course: true,
      },
    });
  }

  async deleteSlot(id) {
    return this.db.timetableSlot.delete({
      where: { id },
    });
  }

  async deleteSlotsByGroup(studentGroupId) {
    return this.db.timetableSlot.deleteMany({
      where: { studentGroupId },
    });
  }

  async deleteAllSlots() {
    return this.db.timetableSlot.deleteMany({});
  }

  async createManySlots(slots) {
    return this.db.$transaction(
      slots.map((slot) =>
        this.db.timetableSlot.create({
          data: slot,
          include: {
            room: true,
            faculty: true,
            studentGroup: true,
            course: true,
          },
        })
      )
    );
  }

  // --- Dashboard Aggregates ---
  async countCourses() {
    return this.db.course.count();
  }

  async countFaculty() {
    return this.db.faculty.count();
  }

  async countStudents() {
    return this.db.student.count();
  }

  async countRooms() {
    return this.db.room.count();
  }

  async countSlots() {
    return this.db.timetableSlot.count();
  }
}

export { AdminRepository };
export default AdminRepository;
