import { DataTypes, Model } from 'sequelize';
import { buildBaseModelOptions } from './base.model.js';

class AuditLog extends Model {
  static initialize(sequelize) {
    AuditLog.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        actorUserId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'actor_user_id',
        },
        targetUserId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'target_user_id',
        },
        action: {
          type: DataTypes.STRING(120),
          allowNull: false,
        },
        ipAddress: {
          type: DataTypes.STRING(64),
          allowNull: true,
          field: 'ip_address',
        },
        userAgent: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'user_agent',
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
        },
      },
      buildBaseModelOptions('audit_logs', {
        sequelize,
        modelName: 'AuditLog',
        updatedAt: false,
      }),
    );

    return AuditLog;
  }

  static associate(models) {
    AuditLog.belongsTo(models.User, {
      as: 'actorUser',
      foreignKey: 'actorUserId',
    });
    AuditLog.belongsTo(models.User, {
      as: 'targetUser',
      foreignKey: 'targetUserId',
    });
  }
}

export default AuditLog;
