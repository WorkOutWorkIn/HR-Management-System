import { DataTypes, Model } from 'sequelize';
import { PASSWORD_TOKEN_PURPOSES } from '../../constants/auth.js';
import { buildBaseModelOptions } from './base.model.js';

class PasswordResetToken extends Model {
  static initialize(sequelize) {
    PasswordResetToken.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'user_id',
        },
        purpose: {
          type: DataTypes.ENUM(...Object.values(PASSWORD_TOKEN_PURPOSES)),
          allowNull: false,
        },
        tokenHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          unique: true,
          field: 'token_hash',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'expires_at',
        },
        usedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'used_at',
        },
        invalidatedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'invalidated_at',
        },
        requestedByIp: {
          type: DataTypes.STRING(64),
          allowNull: true,
          field: 'requested_by_ip',
        },
        userAgent: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'user_agent',
        },
      },
      buildBaseModelOptions('password_reset_tokens', {
        sequelize,
        modelName: 'PasswordResetToken',
      }),
    );

    return PasswordResetToken;
  }

  static associate(models) {
    PasswordResetToken.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
    });
  }
}

export default PasswordResetToken;
