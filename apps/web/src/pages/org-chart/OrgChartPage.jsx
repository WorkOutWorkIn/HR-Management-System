import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ROLES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PageLoader } from '@/components/common/PageLoader';
import { OrgChartCanvas } from '@/components/org-chart/OrgChartCanvas';
import { useAuth } from '@/hooks/useAuth';
import { assignEmployeeManager } from '@/services/org-chart/orgChart.api';
import { loadOrgChartDirectoryWorkspace } from '@/services/org-chart/orgChart.workspace';

const assignmentSchema = z.object({
  employeeId: z.string().uuid('Select an employee'),
  managerUserId: z.string().uuid('Select a valid manager').optional().or(z.literal('')),
});

export function OrgChartPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;
  const canViewDirectReports = user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER;
  const defaultViewMode = isAdmin ? 'organization' : 'reporting-line';
  const [workspace, setWorkspace] = useState(null);
  const [reportingLine, setReportingLine] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [directReports, setDirectReports] = useState([]);
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      employeeId: '',
      managerUserId: '',
    },
  });

  const loadOrgChartData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const nextWorkspace = await loadOrgChartDirectoryWorkspace(user, {
        showFullOrganization: viewMode === 'organization',
      });

      setWorkspace(nextWorkspace);
      setSelectedNodeId(null);
      setReportingLine(nextWorkspace.reportingLine);
      setRelationships(nextWorkspace.relationships || []);
      setDirectReports(nextWorkspace.directReports || []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to load the organization chart.');
    } finally {
      setLoading(false);
    }
  }, [user, viewMode]);

  useEffect(() => {
    setViewMode(defaultViewMode);
  }, [defaultViewMode]);

  useEffect(() => {
    loadOrgChartData();
  }, [loadOrgChartData]);

  const relationshipUsers = useMemo(
    () => relationships.map((entry) => entry.employee),
    [relationships],
  );
  const managerOptions = useMemo(
    () =>
      relationshipUsers.filter((employee) => [ROLES.MANAGER, ROLES.ADMIN].includes(employee.role)),
    [relationshipUsers],
  );

  const onAssignManager = handleSubmit(async (values) => {
    setNotice(null);
    setErrorMessage(null);

    try {
      const result = await assignEmployeeManager(values.employeeId, {
        managerUserId: values.managerUserId || null,
      });

      setNotice(
        result.manager
          ? `Reporting line updated. ${result.employee.fullName} now reports to ${result.manager.fullName}.`
          : `Reporting line cleared for ${result.employee.fullName}.`,
      );
      await loadOrgChartData();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to update reporting line.');
    }
  });

  if (loading) {
    return <PageLoader label="Loading org chart workspace..." />;
  }

  return (
    <div className="space-y-7">
      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}
      {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

      {workspace ? (
        <OrgChartCanvas
          headerActions={
            <div className="inline-flex rounded-full border border-white/8 bg-slate-950/60 p-1 shadow-[0_12px_30px_rgba(2,12,27,0.24)]">
              <button
                type="button"
                className={[
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  viewMode === 'reporting-line'
                    ? 'bg-cyan-400/14 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]'
                    : 'text-slate-400 hover:text-white',
                ].join(' ')}
                onClick={() => setViewMode('reporting-line')}
              >
                My Reporting Line
              </button>
              <button
                type="button"
                className={[
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  viewMode === 'organization'
                    ? 'bg-cyan-400/14 text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.18)]'
                    : 'text-slate-400 hover:text-white',
                ].join(' ')}
                onClick={() => setViewMode('organization')}
              >
                Whole Organization
              </button>
            </div>
          }
          workspace={workspace}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="border border-white/8 bg-slate-900/80 shadow-[0_20px_50px_rgba(2,12,27,0.38)]">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Reporting Line</p>
            <h2 className="text-3xl font-semibold text-white">Your place in the org</h2>
          </CardHeader>
          <CardBody className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Current employee</p>
              <p className="mt-4 text-2xl font-semibold text-white">
                {reportingLine?.employee?.fullName}
              </p>
              <p className="mt-1 text-sm text-slate-400">{reportingLine?.employee?.workEmail}</p>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-slate-950/60 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Reports to</p>
              {reportingLine?.manager ? (
                <>
                  <p className="mt-4 text-2xl font-semibold text-white">
                    {reportingLine.manager.fullName}
                  </p>
                  <p className="mt-1 text-sm text-cyan-200">
                    {reportingLine.manager.jobTitle || reportingLine.manager.role}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">{reportingLine.manager.workEmail}</p>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  No manager is assigned yet. Leave requests remain visible to ADMIN for approval.
                </p>
              )}
            </div>
          </CardBody>
        </Card>

        {canViewDirectReports ? (
          <Card className="border border-white/8 bg-slate-900/80 shadow-[0_20px_50px_rgba(2,12,27,0.38)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Team Snapshot</p>
              <h2 className="text-3xl font-semibold text-white">Direct reports</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {directReports.length ? (
                directReports.map((employee) => (
                  <div
                    key={employee.id}
                    className="rounded-[22px] border border-white/8 bg-slate-950/55 p-4"
                  >
                    <p className="text-lg font-semibold text-white">{employee.fullName}</p>
                    <p className="text-sm text-slate-400">{employee.jobTitle || employee.role}</p>
                  </div>
                ))
              ) : (
                <NoticeBanner tone="info">
                  {isAdmin
                    ? 'No direct reports are assigned to the current admin context.'
                    : 'No direct reports are assigned to you yet.'}
                </NoticeBanner>
              )}
            </CardBody>
          </Card>
        ) : null}
      </div>

      {isAdmin ? (
        <Card className="border border-white/8 bg-slate-900/80 shadow-[0_20px_50px_rgba(2,12,27,0.38)]">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Admin Controls</p>
            <h2 className="text-3xl font-semibold text-white">Reporting line management</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={onAssignManager}>
              <label className="space-y-2 text-sm text-slate-200">
                <span className="block">Employee</span>
                <select
                  className="app-select"
                  value={watch('employeeId')}
                  onChange={(event) =>
                    setValue('employeeId', event.target.value, { shouldValidate: true })
                  }
                >
                  <option value="">Select employee</option>
                  {relationshipUsers.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} ({employee.role})
                    </option>
                  ))}
                </select>
                {errors.employeeId ? (
                  <span className="block text-xs text-rose-400">{errors.employeeId.message}</span>
                ) : null}
              </label>

              <label className="space-y-2 text-sm text-slate-200">
                <span className="block">Manager</span>
                <select
                  className="app-select"
                  value={watch('managerUserId')}
                  onChange={(event) =>
                    setValue('managerUserId', event.target.value, { shouldValidate: true })
                  }
                >
                  <option value="">No manager assigned</option>
                  {managerOptions.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.fullName} ({manager.role})
                    </option>
                  ))}
                </select>
                {errors.managerUserId ? (
                  <span className="block text-xs text-rose-400">
                    {errors.managerUserId.message}
                  </span>
                ) : null}
              </label>

              <div className="md:col-span-2">
                <Button color="primary" isLoading={isSubmitting} type="submit">
                  Save reporting line
                </Button>
              </div>
            </form>

            <div className="grid gap-4 lg:grid-cols-2">
              {relationships.map((relationship) => (
                <div
                  key={relationship.employee.id}
                  className="rounded-[24px] border border-white/8 bg-slate-950/55 p-4"
                >
                  <p className="text-lg font-semibold text-white">
                    {relationship.employee.fullName}
                  </p>
                  <p className="text-sm text-slate-400">
                    {relationship.employee.workEmail} ({relationship.employee.role})
                  </p>
                  <p className="mt-3 text-sm text-cyan-200">
                    Manager:{' '}
                    {relationship.manager
                      ? `${relationship.manager.fullName} (${relationship.manager.role})`
                      : 'Unassigned'}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
