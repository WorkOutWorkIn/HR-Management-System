import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES, ROLES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PageLoader } from '@/components/common/PageLoader';
import { useAuth } from '@/hooks/useAuth';
import { getMySalary } from '@/services/salary/salary.api';

function formatSalary(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'Not available';
  }

  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatEffectiveDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function SalaryPage() {
  const { user } = useAuth();
  const [salaryRecord, setSalaryRecord] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadSalary() {
      try {
        const result = await getMySalary();

        if (!isMounted) {
          return;
        }

        setSalaryRecord(result.salaryRecord);
        setSalaryHistory(result.history || []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error?.response?.data?.message || 'Failed to load salary record');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSalary();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <PageLoader label="Loading your salary..." />;
  }

  return (
    <div className="space-y-6">
      {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

      <section className="rounded-[34px] border border-white/8 bg-slate-900/80 p-7 shadow-[0_22px_55px_rgba(2,12,27,0.4)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Salary</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight text-white">My salary</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">
              View your current salary record, including the latest base salary and its effective
              date.
            </p>
          </div>
          {user?.role === ROLES.ADMIN ? (
            <Button
              as={Link}
              color="primary"
              to={APP_ROUTES.SALARY_MANAGE}
              variant="solid"
            >
              Manage team salaries
            </Button>
          ) : null}
        </div>
      </section>

      <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Salary record</p>
          <h2 className="text-3xl font-semibold text-white">Current details</h2>
        </CardHeader>
        <CardBody>
          {salaryRecord ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/8 bg-slate-950/40 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Base salary</p>
                <p className="mt-4 text-4xl font-semibold text-white">
                  {formatSalary(salaryRecord.baseSalary)}
                </p>
              </div>
              <div className="rounded-3xl border border-white/8 bg-slate-950/40 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Effective date
                </p>
                <p className="mt-4 text-2xl font-semibold text-white">
                  {formatEffectiveDate(salaryRecord.effectiveDate)}
                </p>
              </div>
            </div>
          ) : (
            <NoticeBanner tone="warning">No salary record is available for your account yet.</NoticeBanner>
          )}
        </CardBody>
      </Card>

      <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Salary history</p>
          <h2 className="text-3xl font-semibold text-white">Version history</h2>
        </CardHeader>
        <CardBody>
          {salaryHistory.length ? (
            <div className="space-y-3">
              {salaryHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col gap-3 rounded-3xl border border-white/8 bg-slate-950/40 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                      Effective date
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatEffectiveDate(record.effectiveDate)}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                      Base salary
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatSalary(record.baseSalary)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <NoticeBanner tone="info">No salary history is available yet.</NoticeBanner>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
