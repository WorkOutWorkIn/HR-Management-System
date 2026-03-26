import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { AuditTrailTable } from '@/components/audit/AuditTrailTable';
import { listAuditTrail } from '@/services/audit/audit.api';

function extractErrorMessage(error, fallbackMessage) {
  const details = error?.response?.data?.details?.errors;

  if (Array.isArray(details) && details[0]?.message) {
    return details[0].message;
  }

  return error?.response?.data?.message || fallbackMessage;
}

export function AuditTrailPage() {
  const [auditRecords, setAuditRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadAuditTrail = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await listAuditTrail({ limit: 100 });
      setAuditRecords(result.items || []);
      setTotal(result.total || 0);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Failed to load audit trail records.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditTrail();
  }, [loadAuditTrail]);

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/8 bg-slate-900/80 p-7 shadow-[0_22px_55px_rgba(2,12,27,0.4)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Admin security</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight text-white">
              Audit trail
            </h1>
            <p className="mt-3 max-w-3xl text-base text-slate-300">
              Review login activity, password reset actions, and account status changes across the
              platform. Records are read-only and ordered by newest first.
            </p>
          </div>
          <Button variant="bordered" className="border-white/10" onPress={loadAuditTrail}>
            Refresh records
          </Button>
        </div>
      </section>

      {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

      <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
        <CardHeader className="flex flex-col items-start gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Security event log</h2>
            <p className="text-sm text-slate-400">
              Showing the latest {Math.min(total, 100)} of {total} tracked authentication and
              account-security events.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          <AuditTrailTable records={auditRecords} isLoading={isLoading} />
        </CardBody>
      </Card>
    </div>
  );
}
