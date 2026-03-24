import { DataTypes, Model } from 'sequelize';
import { buildBaseModelOptions } from './base.model.js';

class RefreshToken extends Model {
  static initialize(sequelize) {
    RefreshToken.init(
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
        tokenId: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          field: 'token_id',
        },
        tokenHash: {
          type: DataTypes.STRING(64),
          allowNull: false,
          unique: true,
          field: 'token_hash',
        },
        familyId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'family_id',
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'expires_at',
        },
        lastUsedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'last_used_at',
        },
        revokedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'revoked_at',
        },
        revokedReason: {
          type: DataTypes.STRING(120),
          allowNull: true,
          field: 'revoked_reason',
        },
        replacedByTokenId: {
          type: DataTypes.UUID,
          allowNull: true,
          field: 'replaced_by_token_id',
        },
        createdByIp: {
          type: DataTypes.STRING(64),
          allowNull: true,
          field: 'created_by_ip',
        },
        userAgent: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'user_agent',
        },
      },
      buildBaseModelOptions('refresh_tokens', {
        sequelize,
        modelName: 'RefreshToken',
      }),
    );

    return RefreshToken;
  }

  static associate(models) {
    RefreshToken.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
    });
  }
}

export default RefreshToken;
