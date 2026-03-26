import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { ROLES } from '@hrms/shared';
import { ACCOUNT_STATUSES } from '../../constants/account-statuses.js';

const DEFAULT_ADMIN_EMAIL = 'admin@hrms.local';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    const now = new Date();
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
    const [existingAdmins] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE work_email = ? LIMIT 1',
      {
        replacements: [DEFAULT_ADMIN_EMAIL],
      },
    );

    if (existingAdmins.length > 0) {
      await queryInterface.bulkUpdate(
        'users',
        {
          full_name: 'Default Admin',
          role: ROLES.ADMIN,
          status: ACCOUNT_STATUSES.ACTIVE,
          password_hash: passwordHash,
          must_change_password: false,
          failed_login_attempts: 0,
          locked_at: null,
          password_changed_at: now,
          department: 'Administration',
          job_title: 'System Administrator',
          phone_number: '+10000000000',
          country: 'Malaysia',
          annual_leave_quota: 18,
          updated_at: now,
        },
        {
          work_email: DEFAULT_ADMIN_EMAIL,
        },
      );

      return;
    }

    await queryInterface.bulkInsert('users', [
      {
        id: randomUUID(),
        full_name: 'Default Admin',
        work_email: DEFAULT_ADMIN_EMAIL,
        role: ROLES.ADMIN,
        status: ACCOUNT_STATUSES.ACTIVE,
        password_hash: passwordHash,
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
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      work_email: DEFAULT_ADMIN_EMAIL,
    });
  },
};
