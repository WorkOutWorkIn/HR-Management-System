import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ROLES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PageLoader } from '@/components/common/PageLoader';
import { Description, FieldError, Input, Label, TextArea, TextField } from '@/components/forms/TextField';
import { useAuth } from '@/hooks/useAuth';
import {
  generatePayrollForEveryone,
  getMyPayroll,
  getPayrollForUser,
  issuePayrollCorrectionForUser,
  listPayrollUsers,
} from '@/services/payroll/payroll.api';

const correctionSchema = z.object({
  baseSalary: z.coerce.number().min(0, 'Corrected base salary must be 0 or more'),
  deductionAmount: z.coerce.number().min(0, 'Corrected deduction amount must be 0 or more'),
  correctionReason: z
    .string()
    .trim()
    .min(1, 'Correction reason is required')
    .max(255, 'Correction reason must be 255 characters or fewer'),
});

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMoney(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return '0.00';
  }

  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPayrollMonth(payrollMonth) {
  if (!payrollMonth) {
    return 'Unknown month';
  }

  const date = new Date(`${payrollMonth}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return payrollMonth;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

function PayrollBreakdownCard({ payrollRecord }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-slate-950/50 p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">
            {payrollRecord.isCorrection ? 'Correction record' : 'Payslip'}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {formatPayrollMonth(payrollRecord.payrollMonth)}
          </h3>
          {payrollRecord.isCorrection ? (
            <p className="mt-2 text-sm text-amber-300">
              Correction #{payrollRecord.sequenceNumber}
              {payrollRecord.correctionReason ? ` • ${payrollRecord.correctionReason}` : ''}
            </p>
          ) : null}
        </div>
        <p className="text-sm text-slate-400">Issued {payrollRecord.createdAt?.slice(0, 10)}</p>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-900/70 px-4 py-3">
          <span className="text-sm text-slate-300">Base salary</span>
          <span className="font-medium text-white">{formatMoney(payrollRecord.baseSalary)}</span>
        </div>
        {payrollRecord.deductions.map((deduction) => (
          <div
            key={`${payrollRecord.id}-${deduction.label}`}
            className="flex items-center justify-between rounded-2xl border border-white/8 bg-slate-900/70 px-4 py-3"
          >
            <span className="text-sm text-slate-300">{deduction.label}</span>
            <span className="font-medium text-amber-300">-{formatMoney(deduction.amount)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <span className="text-sm font-medium text-emerald-100">Net pay</span>
          <span className="text-lg font-semibold text-white">{formatMoney(payrollRecord.netPay)}</span>
        </div>
      </div>
    </div>
  );
}

export function PayrollPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(user?.id || null);
  const [selectedEmployee, setSelectedEmployee] = useState(user || null);
  const [payrollItems, setPayrollItems] = useState([]);
  const [payrollMonth, setPayrollMonth] = useState(getCurrentMonthValue());
  const [notice, setNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(false);
  const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);
  const [selectedPayrollRecordId, setSelectedPayrollRecordId] = useState(null);
  const {
    formState: { errors: correctionErrors, isSubmitting: isSubmittingCorrection },
    handleSubmit: handleCorrectionSubmit,
    register: registerCorrection,
    reset: resetCorrection,
  } = useForm({
    resolver: zodResolver(correctionSchema),
    defaultValues: {
      baseSalary: '',
      deductionAmount: '',
      correctionReason: '',
    },
  });

  async function loadEmployees(search = '') {
    if (!isAdmin) {
      return;
    }

    setIsLoadingEmployees(true);

    try {
      const result = await listPayrollUsers(search ? { search } : {});
      setEmployees(result.items);
      setSelectedEmployeeId((currentSelectedEmployeeId) => {
        if (result.items.some((employee) => employee.id === currentSelectedEmployeeId)) {
          return currentSelectedEmployeeId;
        }

        return result.items[0]?.id || null;
      });
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to load payroll users.');
    } finally {
      setIsLoadingEmployees(false);
    }
  }

  async function loadPayrollForUser(userId) {
    if (!userId) {
      setSelectedEmployee(null);
      setPayrollItems([]);
      return;
    }

    setIsLoadingPayroll(true);

    try {
      const result = await getPayrollForUser(userId);
      setSelectedEmployee(result.user);
      setPayrollItems(result.items);
      setSelectedPayrollRecordId((currentSelectedPayrollRecordId) => {
        if (result.items.some((item) => item.id === currentSelectedPayrollRecordId)) {
          return currentSelectedPayrollRecordId;
        }

        return result.items[0]?.id || null;
      });
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Failed to load payroll.');
    } finally {
      setIsLoadingPayroll(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setErrorMessage(null);

      try {
        if (isAdmin) {
          const result = await listPayrollUsers();

          if (!isMounted) {
            return;
          }

          setEmployees(result.items);
          const initialSelectedEmployeeId =
            result.items.find((employee) => employee.id === user?.id)?.id || result.items[0]?.id || null;
          setSelectedEmployeeId(initialSelectedEmployeeId);
        } else {
          const result = await getMyPayroll();

          if (!isMounted) {
            return;
          }

          setSelectedEmployee(user || null);
          setPayrollItems(result.items);
          setSelectedPayrollRecordId(result.items[0]?.id || null);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error?.response?.data?.message || 'Failed to load payroll workspace.');
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, user]);

  useEffect(() => {
    if (!isAdmin || isBootstrapping) {
      return;
    }

    loadPayrollForUser(selectedEmployeeId);
  }, [isAdmin, isBootstrapping, selectedEmployeeId]);

  async function handleGeneratePayroll() {
    setNotice(null);
    setErrorMessage(null);
    setIsGeneratingPayroll(true);

    try {
      const result = await generatePayrollForEveryone({
        payrollMonth,
      });

      setNotice(
        `Payroll processed for ${result.payrollMonth}: ${result.generatedCount} new issuance(s), ${result.alreadyIssuedCount} already issued, ${result.skippedCount} skipped.`,
      );

      await loadEmployees(employeeSearch);

      if (selectedEmployeeId) {
        await loadPayrollForUser(selectedEmployeeId);
      }
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to generate payroll.');
    } finally {
      setIsGeneratingPayroll(false);
    }
  }

  async function handleSearch() {
    setNotice(null);
    setErrorMessage(null);
    await loadEmployees(employeeSearch);
  }

  const selectedPayrollRecord =
    payrollItems.find((payrollRecord) => payrollRecord.id === selectedPayrollRecordId) || null;

  const onSubmitCorrection = handleCorrectionSubmit(async (values) => {
    if (!selectedEmployeeId || !selectedPayrollRecordId) {
      return;
    }

    setNotice(null);
    setErrorMessage(null);

    try {
      await issuePayrollCorrectionForUser(selectedEmployeeId, selectedPayrollRecordId, values);
      setNotice('Payroll correction issued successfully. The original payroll record remains unchanged.');
      resetCorrection({
        baseSalary: '',
        deductionAmount: '',
        correctionReason: '',
      });
      await loadPayrollForUser(selectedEmployeeId);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to issue payroll correction.');
    }
  });

  if (isBootstrapping) {
    return <PageLoader label="Loading payroll workspace..." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] border border-white/8 bg-slate-900/80 p-7 shadow-[0_22px_55px_rgba(2,12,27,0.4)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Payroll</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight text-white">
              {isAdmin ? 'Payroll management' : 'My payroll'}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">
              {isAdmin
                ? 'Generate monthly payroll for the team, prevent duplicate month issuance, and review each employee payslip.'
                : 'View your issued payslips with a simple breakdown of base salary, deductions, and net pay.'}
            </p>
          </div>
          {isAdmin ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <TextField fullWidth name="payrollMonth" type="month">
                <Label>Payroll month</Label>
                <Input type="month" value={payrollMonth} onValueChange={setPayrollMonth} />
              </TextField>
              <Button color="primary" isLoading={isGeneratingPayroll} onPress={handleGeneratePayroll}>
                Generate payroll for everyone
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}
      {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

      {isAdmin ? (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
            <CardHeader className="flex flex-col items-start gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Employees</p>
              <TextField fullWidth name="payrollEmployeeSearch">
                <Label>Search by name or email</Label>
                <Input
                  value={employeeSearch}
                  onValueChange={setEmployeeSearch}
                  endContent={
                    <Button size="sm" variant="light" onPress={handleSearch}>
                      Search
                    </Button>
                  }
                />
              </TextField>
            </CardHeader>
            <CardBody>
              {isLoadingEmployees ? (
                <PageLoader label="Loading employees..." />
              ) : employees.length ? (
                <div className="space-y-3">
                  {employees.map((employee) => {
                    const isSelected = employee.id === selectedEmployeeId;

                    return (
                      <button
                        key={employee.id}
                        type="button"
                        className={[
                          'w-full rounded-2xl border p-4 text-left transition',
                          isSelected
                            ? 'border-cyan-400/50 bg-cyan-400/10'
                            : 'border-white/8 bg-slate-950/50 hover:border-cyan-500/30',
                        ].join(' ')}
                        onClick={() => {
                          setNotice(null);
                          setErrorMessage(null);
                          setSelectedEmployeeId(employee.id);
                        }}
                      >
                        <p className="font-medium text-white">{employee.fullName}</p>
                        <p className="mt-1 text-sm text-slate-400">{employee.workEmail}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                          Latest payroll
                        </p>
                        <p className="mt-1 text-sm text-slate-200">
                          {employee.latestPayroll
                            ? `${formatPayrollMonth(employee.latestPayroll.payrollMonth)} • ${formatMoney(employee.latestPayroll.netPay)}`
                            : 'No payroll issued yet'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <NoticeBanner tone="info">No employees match the current search.</NoticeBanner>
              )}
            </CardBody>
          </Card>

          <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Payslips</p>
              <h2 className="text-3xl font-semibold text-white">
                {selectedEmployee ? selectedEmployee.fullName : 'Select an employee'}
              </h2>
              {selectedEmployee ? (
                <p className="text-sm text-slate-400">
                  {selectedEmployee.workEmail}
                  {selectedEmployee.jobTitle ? ` • ${selectedEmployee.jobTitle}` : ''}
                  {selectedEmployee.department ? ` • ${selectedEmployee.department}` : ''}
                </p>
              ) : null}
            </CardHeader>
            <CardBody>
              {isLoadingPayroll ? (
                <PageLoader label="Loading payslips..." />
              ) : payrollItems.length ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {payrollItems.map((payrollRecord) => (
                      <button
                        key={payrollRecord.id}
                        type="button"
                        className={[
                          'block w-full rounded-3xl text-left transition',
                          payrollRecord.id === selectedPayrollRecordId
                            ? 'ring-2 ring-cyan-400/50'
                            : '',
                        ].join(' ')}
                        onClick={() => setSelectedPayrollRecordId(payrollRecord.id)}
                      >
                        <PayrollBreakdownCard payrollRecord={payrollRecord} />
                      </button>
                    ))}
                  </div>

                  {selectedPayrollRecord ? (
                    <Card className="border border-white/8 bg-slate-950/40 shadow-none">
                      <CardHeader className="flex flex-col items-start gap-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">
                          Correction workflow
                        </p>
                        <h3 className="text-2xl font-semibold text-white">
                          Issue correction for {formatPayrollMonth(selectedPayrollRecord.payrollMonth)}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Payroll rows are immutable. If a mistake is found, issue a new correction record.
                        </p>
                      </CardHeader>
                      <CardBody>
                        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmitCorrection}>
                          <TextField
                            fullWidth
                            isInvalid={Boolean(correctionErrors.baseSalary)}
                            name="correctionBaseSalary"
                            type="number"
                          >
                            <Label>Corrected base salary</Label>
                            <Input {...registerCorrection('baseSalary')} step="0.01" />
                            {correctionErrors.baseSalary ? (
                              <FieldError>{correctionErrors.baseSalary.message}</FieldError>
                            ) : (
                              <Description>Enter the corrected gross salary for this payroll row.</Description>
                            )}
                          </TextField>
                          <TextField
                            fullWidth
                            isInvalid={Boolean(correctionErrors.deductionAmount)}
                            name="correctionDeductionAmount"
                            type="number"
                          >
                            <Label>Corrected deduction amount</Label>
                            <Input {...registerCorrection('deductionAmount')} step="0.01" />
                            {correctionErrors.deductionAmount ? (
                              <FieldError>{correctionErrors.deductionAmount.message}</FieldError>
                            ) : (
                              <Description>Enter the corrected CPF employee contribution.</Description>
                            )}
                          </TextField>
                          <TextField
                            className="md:col-span-2"
                            fullWidth
                            isInvalid={Boolean(correctionErrors.correctionReason)}
                            name="correctionReason"
                          >
                            <Label>Correction reason</Label>
                            <TextArea minRows={3} {...registerCorrection('correctionReason')} />
                            {correctionErrors.correctionReason ? (
                              <FieldError>{correctionErrors.correctionReason.message}</FieldError>
                            ) : (
                              <Description>Describe what was wrong and why this correction was issued.</Description>
                            )}
                          </TextField>
                          <div className="md:col-span-2">
                            <Button color="warning" isLoading={isSubmittingCorrection} type="submit">
                              Issue correction record
                            </Button>
                          </div>
                        </form>
                      </CardBody>
                    </Card>
                  ) : null}
                </div>
              ) : (
                <NoticeBanner tone="info">
                  {selectedEmployee
                    ? 'No payroll has been issued for this employee yet.'
                    : 'Select an employee to view payroll.'}
                </NoticeBanner>
              )}
            </CardBody>
          </Card>
        </div>
      ) : (
        <Card className="border border-white/8 bg-slate-900/80 shadow-[0_22px_55px_rgba(2,12,27,0.38)]">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Payslips</p>
            <h2 className="text-3xl font-semibold text-white">Issued payslips</h2>
          </CardHeader>
          <CardBody>
            {isLoadingPayroll ? (
              <PageLoader label="Loading payslips..." />
            ) : payrollItems.length ? (
              <div className="space-y-4">
                {payrollItems.map((payrollRecord) => (
                  <PayrollBreakdownCard key={payrollRecord.id} payrollRecord={payrollRecord} />
                ))}
              </div>
            ) : (
              <NoticeBanner tone="info">No payroll has been issued to your account yet.</NoticeBanner>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
