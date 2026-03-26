import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  getKeyValue,
} from '@heroui/react';

const EMPLOYEE_DIRECTORY_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
];

const STATUS_CHIP_COLORS = {
  ACTIVE: 'success',
  LOCKED: 'danger',
  DISABLED: 'default',
  PENDING_FIRST_LOGIN: 'secondary',
};

function formatEnumLabel(value) {
  return String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(' ');
}

function renderCell(row, columnKey) {
  if (columnKey === 'name') {
    return (
      <span className="font-medium text-[color:var(--app-foreground-strong)]">
        {getKeyValue(row, columnKey)}
      </span>
    );
  }

  if (columnKey === 'status') {
    return (
      <Chip
        color={STATUS_CHIP_COLORS[row.status] || 'default'}
        size="sm"
        variant="flat"
      >
        {formatEnumLabel(row.status)}
      </Chip>
    );
  }

  return (
    <span
      className={
        columnKey === 'email'
          ? 'text-[color:var(--app-muted)]'
          : 'text-[color:var(--app-foreground)]'
      }
    >
      {getKeyValue(row, columnKey)}
    </span>
  );
}

export function EmployeeDirectoryTable({ employees, onRowAction }) {
  const rows = employees.map((employee) => ({
    key: employee.id,
    name: employee.fullName,
    role: formatEnumLabel(employee.role),
    email: employee.workEmail,
    status: employee.status,
  }));

  return (
    <div className="overflow-x-auto">
      <Table
        aria-label="Employee directory table"
        classNames={{
          base: 'min-w-full',
          table: 'min-w-[720px]',
          th: 'bg-transparent text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted-soft)]',
          td: 'border-b border-[color:var(--app-border)] py-4',
          tr: 'cursor-pointer transition data-[hover=true]:bg-[color:var(--app-overlay)]',
          wrapper: 'border border-[color:var(--app-border)] bg-[color:var(--field-bg)] shadow-none',
        }}
        onRowAction={onRowAction}
      >
        <TableHeader columns={EMPLOYEE_DIRECTORY_COLUMNS}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody items={rows}>
          {(item) => (
            <TableRow key={item.key}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
