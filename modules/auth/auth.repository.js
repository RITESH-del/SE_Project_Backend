import prisma from '../../db.js';

class AuthRepository {
  constructor(db = prisma) {
    this.db = db;
  }

  async findByEmail(email) {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findById(id) {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async createUser(data) {
    return this.db.user.create({
      data,
    });
  }
}

export { AuthRepository };
export default AuthRepository;
