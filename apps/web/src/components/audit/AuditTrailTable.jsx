import {
  Chip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

const AUDIT_TRAIL_COLUMNS = [
  { key: 'event', label: 'Event' },
  { key: 'actor', label: 'Actor' },
  { key: 'target', label: 'Target User' },
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'details', label: 'Status / Details' },
];

const EVENT_GROUP_CHIP_COLORS = {
  LOGIN: 'primary',
  PASSWORD: 'secondary',
  ACCOUNT: 'warning',
  SALARY: 'success',
  PAYROLL: 'primary',
};

const STATUS_CHIP_COLORS = {
  ACTIVE: 'success',
  LOCKED: 'danger',
  DISABLED: 'default',
  PENDING_FIRST_LOGIN: 'secondary',
};

const dateTimeFormatter = new Intl.DateTimeFormat('en-SG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatEnumLabel(value) {
  return String(value || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatTimestamp(value) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateTimeFormatter.format(date);
}

function renderUserSummary(user, fallbackEmail, emptyLabel) {
  if (!user && !fallbackEmail) {
    return <span className="text-[color:var(--app-muted)]">{emptyLabel}</span>;
  }

  return (
    <div className="space-y-1">
      <p className="font-medium text-[color:var(--app-foreground-strong)]">
        {user?.fullName || emptyLabel}
      </p>
      <p className="text-xs text-[color:var(--app-muted)]">
        {user?.workEmail || fallbackEmail || 'No email recorded'}
      </p>
    </div>
  );
}

function buildDetailSummary(entry) {
  const details = entry.details || {};

  switch (entry.action) {
    case 'ACCOUNT_STATUS_CHANGED':
      return {
        previousStatus: details.previousStatus || null,
        nextStatus: details.nextStatus || null,
        summary:
          details.reason
            ? `Reason: ${formatEnumLabel(details.reason)}`
            : 'Account status updated.',
      };
    case 'ACCOUNT_LOCKED':
    case 'ACCOUNT_UNLOCKED':
      return {
        summary: details.reason
          ? `Reason: ${formatEnumLabel(details.reason)}`
          : formatEnumLabel(entry.action),
      };
    case 'LOGIN_FAILURE':
      return {
        summary: details.reason ? formatEnumLabel(details.reason) : 'Failed sign-in attempt',
        secondary: details.failedLoginAttempts
          ? `Failed attempts: ${details.failedLoginAttempts}`
          : null,
      };
    case 'LOGIN_SUCCESS':
      return {
        status: details.status || null,
        summary: 'Signed in successfully.',
      };
    case 'PASSWORD_RESET_REQUESTED':
      return {
        summary: 'Password reset instructions requested.',
      };
    case 'PASSWORD_RESET_COMPLETED':
      return {
        summary: 'Password reset completed.',
      };
    case 'PASSWORD_CHANGED':
      return {
        summary: 'Password changed successfully.',
      };
    case 'FIRST_LOGIN_PASSWORD_RESET_COMPLETED':
      return {
        status: details.status || null,
        summary: 'First-login password setup completed.',
      };
    case 'SALARY_RECORD_UPDATED':
      return {
        summary:
          details.operation === 'update'
            ? `Salary updated to ${details.baseSalary} effective ${details.effectiveDate}.`
            : `Salary created at ${details.baseSalary} effective ${details.effectiveDate}.`,
        secondary:
          details.previousValues?.baseSalary !== undefined
            ? `Previous salary: ${details.previousValues.baseSalary} effective ${details.previousValues.effectiveDate}`
            : null,
      };
    case 'SALARY_VIEWED':
      return {
        summary:
          details.scope === 'self'
            ? 'Sensitive salary data viewed by the employee.'
            : 'Sensitive salary data viewed by an administrator.',
        secondary: details.viewedUserId ? `Viewed user id: ${details.viewedUserId}` : null,
      };
    case 'PAYROLL_GENERATED':
      return {
        summary: `Payroll run issued for ${details.payrollMonth}.`,
        secondary:
          details.generatedCount !== undefined
            ? `Generated: ${details.generatedCount}, already issued: ${details.alreadyIssuedCount || 0}, skipped: ${details.skippedCount || 0}`
            : null,
      };
    case 'PAYROLL_VIEWED':
      return {
        summary:
          details.scope === 'self'
            ? 'Payroll records viewed by the employee.'
            : 'Payroll records viewed by an administrator.',
        secondary: details.viewedUserId ? `Viewed user id: ${details.viewedUserId}` : null,
      };
    case 'PAYROLL_CORRECTION_ISSUED':
      return {
        summary: `Payroll correction issued for ${details.payrollMonth}.`,
        secondary:
          details.correctionReason || details.sequenceNumber
            ? `Correction #${details.sequenceNumber || 'N/A'}${details.correctionReason ? `: ${details.correctionReason}` : ''}`
            : null,
      };
    default:
      return {
        summary: null,
      };
  }
}

function renderEventCell(entry) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-[color:var(--app-foreground-strong)]">
        {formatEnumLabel(entry.action)}
      </p>
      <Chip
        color={EVENT_GROUP_CHIP_COLORS[entry.eventGroup] || 'default'}
        size="sm"
        variant="flat"
      >
        {formatEnumLabel(entry.eventGroup)}
      </Chip>
    </div>
  );
}

function renderDetailsCell(entry) {
  const detailSummary = buildDetailSummary(entry);

  return (
    <div className="space-y-2">
      {detailSummary.previousStatus || detailSummary.nextStatus ? (
        <div className="flex flex-wrap items-center gap-2">
          {detailSummary.previousStatus ? (
            <Chip
              color={STATUS_CHIP_COLORS[detailSummary.previousStatus] || 'default'}
              size="sm"
              variant="flat"
            >
              {formatEnumLabel(detailSummary.previousStatus)}
            </Chip>
          ) : null}
          <span className="text-xs uppercase tracking-[0.18em] text-[color:var(--app-muted-soft)]">
            to
          </span>
          {detailSummary.nextStatus ? (
            <Chip
              color={STATUS_CHIP_COLORS[detailSummary.nextStatus] || 'default'}
              size="sm"
              variant="flat"
            >
              {formatEnumLabel(detailSummary.nextStatus)}
            </Chip>
          ) : null}
        </div>
      ) : null}
      {detailSummary.status ? (
        <Chip
          color={STATUS_CHIP_COLORS[detailSummary.status] || 'default'}
          size="sm"
          variant="flat"
        >
          {formatEnumLabel(detailSummary.status)}
        </Chip>
      ) : null}
      <div className="space-y-1">
        {detailSummary.summary ? (
          <p className="text-sm text-[color:var(--app-foreground)]">{detailSummary.summary}</p>
        ) : (
          <p className="text-sm text-[color:var(--app-muted)]">No additional details.</p>
        )}
        {detailSummary.secondary ? (
          <p className="text-xs text-[color:var(--app-muted)]">{detailSummary.secondary}</p>
        ) : null}
      </div>
    </div>
  );
}

function renderCell(entry, columnKey) {
  if (columnKey === 'event') {
    return renderEventCell(entry);
  }

  if (columnKey === 'actor') {
    return renderUserSummary(
      entry.actorUser,
      entry.details?.workEmail,
      entry.details?.workEmail ? 'Unknown account' : 'System',
    );
  }

  if (columnKey === 'target') {
    return renderUserSummary(
      entry.targetUser,
      entry.details?.targetWorkEmail,
      'Not applicable',
    );
  }

  if (columnKey === 'timestamp') {
    return (
      <div className="space-y-1">
        <p className="font-medium text-[color:var(--app-foreground-strong)]">
          {formatTimestamp(entry.createdAt)}
        </p>
      </div>
    );
  }

  if (columnKey === 'details') {
    return renderDetailsCell(entry);
  }

  return null;
}

export function AuditTrailTable({ records, isLoading = false }) {
  return (
    <div className="overflow-x-auto">
      <Table
        aria-label="Audit trail table"
        classNames={{
          base: 'min-w-full',
          table: 'min-w-[1040px]',
          th: 'bg-transparent text-[11px] uppercase tracking-[0.18em] text-[color:var(--app-muted-soft)]',
          td: 'border-b border-[color:var(--app-border)] py-4 align-top',
          tr: 'transition data-[hover=true]:bg-[color:var(--app-overlay)]',
          wrapper: 'border border-[color:var(--app-border)] bg-[color:var(--field-bg)] shadow-none',
        }}
      >
        <TableHeader columns={AUDIT_TRAIL_COLUMNS}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody
          emptyContent="No audit trail records are available yet."
          isLoading={isLoading}
          items={records}
          loadingContent={
            <div className="flex items-center gap-3 py-8 text-[color:var(--app-foreground)]">
              <Spinner color="primary" size="sm" />
              <span>Loading audit trail...</span>
            </div>
          }
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
