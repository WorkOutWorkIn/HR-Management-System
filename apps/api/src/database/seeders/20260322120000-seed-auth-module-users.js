import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { ROLES } from '@hrms/shared';
import { ACCOUNT_STATUSES } from '../../constants/account-statuses.js';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    const now = new Date();
    const adminId = randomUUID();
    const managerId = randomUUID();
    const employeeId = randomUUID();
    const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
    const managerPasswordHash = await bcrypt.hash('Manager123!', 12);
    const employeePasswordHash = await bcrypt.hash('EmployeeTemp123!', 12);

    await queryInterface.bulkDelete('users', {
      work_email: ['admin@hrms.local', 'manager@hrms.local', 'employee@hrms.local'],
    });

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        full_name: 'Default Admin',
        work_email: 'admin@hrms.local',
        role: ROLES.ADMIN,
        status: ACCOUNT_STATUSES.ACTIVE,
        password_hash: adminPasswordHash,
        must_change_password: false,
        failed_login_attempts: 0,
        locked_at: null,
        last_login_at: null,
        password_changed_at: now,
        department: 'Administration',
        job_title: 'System Administrator',
        phone_number: '+10000000000',
        address_line_1: null,
        address_line_2: null,
        city: null,
        state: null,
        postal_code: null,
        country: 'Malaysia',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        created_by_user_id: null,
        manager_user_id: null,
        annual_leave_quota: 18,
        created_at: now,
        updated_at: now,
      },
      {
        id: managerId,
        full_name: 'Default Manager',
        work_email: 'manager@hrms.local',
        role: ROLES.MANAGER,
        status: ACCOUNT_STATUSES.ACTIVE,
        password_hash: managerPasswordHash,
        must_change_password: false,
        failed_login_attempts: 0,
        locked_at: null,
        last_login_at: null,
        password_changed_at: now,
        department: 'Management',
        job_title: 'HR Manager',
        phone_number: '+10000000001',
        address_line_1: null,
        address_line_2: null,
        city: null,
        state: null,
        postal_code: null,
        country: 'Malaysia',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        created_by_user_id: adminId,
        manager_user_id: null,
        annual_leave_quota: 18,
        created_at: now,
        updated_at: now,
      },
      {
        id: employeeId,
        full_name: 'First Login Employee',
        work_email: 'employee@hrms.local',
        role: ROLES.EMPLOYEE,
        status: ACCOUNT_STATUSES.PENDING_FIRST_LOGIN,
        password_hash: employeePasswordHash,
        must_change_password: true,
        failed_login_attempts: 0,
        locked_at: null,
        last_login_at: null,
        password_changed_at: null,
        department: 'Operations',
        job_title: 'HR Executive',
        phone_number: '+10000000002',
        address_line_1: null,
        address_line_2: null,
        city: null,
        state: null,
        postal_code: null,
        country: 'Malaysia',
        emergency_contact_name: null,
        emergency_contact_phone: null,
        created_by_user_id: adminId,
        manager_user_id: managerId,
        annual_leave_quota: 14,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      work_email: ['admin@hrms.local', 'manager@hrms.local', 'employee@hrms.local'],
    });
  },
};
