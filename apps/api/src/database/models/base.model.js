export function buildBaseModelOptions(tableName, overrides = {}) {
  return {
    tableName,
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: false,
    ...overrides,
  };
}
