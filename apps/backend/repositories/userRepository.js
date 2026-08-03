import prisma from '../models/prismaClient.js';

class UserRepository {
  /**
   * Find a user record by email address.
   *
   * @param {string} email
   * @returns {Promise<object|null>} User object or null
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user record by primary key ID.
   *
   * @param {string} id
   * @returns {Promise<object|null>} User object or null
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user record.
   *
   * @param {object} userData
   * @returns {Promise<object>} Created user record
   */
  async createUser(userData) {
    return prisma.user.create({
      data: userData,
    });
  }

  /**
   * Update an existing user record.
   *
   * @param {string} id
   * @param {object} updateData
   * @returns {Promise<object>} Updated user record
   */
  async updateUser(id, updateData) {
    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async findMany(options = {}){
    return prisma.user.findMany(options);
  }

  async count(options = {}) {
    return prisma.user.count(options);
  }

  async aggregateRoleCounts() {
    return prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });
  }

  async aggregateStatusCounts() {
    return prisma.user.groupBy({
      by: ['status'],
      _count: true,
    });
  }

  /**
   * Get aggregated statistics for dashboard in a single query
   * @returns {Promise<Object>} Object with totalUsers, activeUsers, inactiveUsers,
   *                            administrators, treasurers, budgetOfficers, auditors
   */
  async getDashboardStatsAggregated() {
    const groups = await prisma.user.groupBy({
      by: ['role', 'status'],
      _count: true,
    });

    // Initialize counters
    let totalUsers = 0;
    let activeUsers = 0;
    let inactiveUsers = 0;
    const roleCounts = {
      Administrator: 0,
      Treasurer: 0,
      BudgetOfficer: 0,
      Auditor: 0,
    };

    groups.forEach(g => {
      const count = Number(g._count);
      totalUsers += count;
      if (g.status === 'Active') {
        activeUsers += count;
        // Increment role-specific active count
        if (roleCounts.hasOwnProperty(g.role)) {
          roleCounts[g.role] += count;
        }
      } else if (g.status === 'Inactive') {
        inactiveUsers += count;
      }
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      administrators: roleCounts.Administrator,
      treasurers: roleCounts.Treasurer,
      budgetOfficers: roleCounts.BudgetOfficer,
      auditors: roleCounts.Auditor,
    };
  }

  /**
   * Find the most recently created users.
   *
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Recent users (without password hash)
   */
  async findRecentlyCreated(limit = 10) {
    return prisma.user.findMany({
      select: { id: true, fullName: true, role: true, status: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deleteUser(id) {
    return prisma.user.delete({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();
