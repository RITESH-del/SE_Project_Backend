class AdminController {
  constructor(adminService) {
    this.adminService = adminService;
  }

  // --- Faculty Handlers ---
  createFaculty = async (req, res, next) => {
    try {
      const result = await this.adminService.createFaculty(req.body);
      res.status(201).json({
        success: true,
        message: 'Faculty created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllFaculty = async (req, res, next) => {
    try {
      const result = await this.adminService.getAllFaculty();
      res.status(200).json({
        success: true,
        message: 'Faculty list retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getFacultyById = async (req, res, next) => {
    try {
      const result = await this.adminService.getFacultyById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Faculty details retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateFaculty = async (req, res, next) => {
    try {
      const result = await this.adminService.updateFaculty(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Faculty updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteFaculty = async (req, res, next) => {
    try {
      const result = await this.adminService.deleteFaculty(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Faculty deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Room Handlers ---
  createRoom = async (req, res, next) => {
    try {
      const result = await this.adminService.createRoom(req.body);
      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllRooms = async (req, res, next) => {
    try {
      const result = await this.adminService.getAllRooms();
      res.status(200).json({
        success: true,
        message: 'Rooms retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getRoomById = async (req, res, next) => {
    try {
      const result = await this.adminService.getRoomById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Room details retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateRoom = async (req, res, next) => {
    try {
      const result = await this.adminService.updateRoom(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Room updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteRoom = async (req, res, next) => {
    try {
      const result = await this.adminService.deleteRoom(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Room deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Student Group Handlers ---
  createStudentGroup = async (req, res, next) => {
    try {
      const result = await this.adminService.createStudentGroup(req.body);
      res.status(201).json({
        success: true,
        message: 'Student group created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllStudentGroups = async (req, res, next) => {
    try {
      const result = await this.adminService.getAllStudentGroups();
      res.status(200).json({
        success: true,
        message: 'Student groups retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Student Handlers ---
  createStudent = async (req, res, next) => {
    try {
      const result = await this.adminService.createStudent(req.body);
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllStudents = async (req, res, next) => {
    try {
      const result = await this.adminService.getAllStudents();
      res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Course Handlers ---
  createCourse = async (req, res, next) => {
    try {
      const result = await this.adminService.createCourse(req.body);
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllCourses = async (req, res, next) => {
    try {
      const result = await this.adminService.getAllCourses();
      res.status(200).json({
        success: true,
        message: 'Courses retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Timetable Handlers ---
  getAllSlots = async (req, res, next) => {
    try {
      const filter = {};
      if (req.query.studentGroupId) filter.studentGroupId = req.query.studentGroupId;
      if (req.query.facultyId) filter.facultyId = req.query.facultyId;
      if (req.query.roomId) filter.roomId = req.query.roomId;
      if (req.query.dayOfWeek) filter.dayOfWeek = Number(req.query.dayOfWeek);

      const result = await this.adminService.getAllSlots(filter);
      res.status(200).json({
        success: true,
        message: 'Timetable slots retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  createSlot = async (req, res, next) => {
    try {
      const result = await this.adminService.createSlot(req.body);
      res.status(201).json({
        success: true,
        message: 'Timetable slot created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteSlot = async (req, res, next) => {
    try {
      const result = await this.adminService.deleteSlot(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Timetable slot deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  generateTimetable = async (req, res, next) => {
    try {
      const result = await this.adminService.generateTimetable(req.body);
      res.status(201).json({
        success: true,
        message: 'Timetable generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyTimetable = async (req, res, next) => {
    try {
      const studentGroupId = req.query.studentGroupId || req.body?.studentGroupId || null;
      const result = await this.adminService.verifyTimetable(studentGroupId);
      res.status(200).json({
        success: true,
        message: result.isValid
          ? 'Timetable verified with zero collisions'
          : `Timetable has ${result.summary.totalConflicts} conflict(s)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Dashboard Handler ---
  getDashboard = async (req, res, next) => {
    try {
      const result = await this.adminService.getDashboardData();
      res.status(200).json({
        success: true,
        message: 'Admin dashboard data retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export { AdminController };
export default AdminController;
