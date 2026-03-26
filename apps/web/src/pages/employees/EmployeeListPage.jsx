import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES, ROLES } from '@hrms/shared';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { Description, Input, Label, TextField } from '@/components/forms/TextField';
import { PageLoader } from '@/components/common/PageLoader';
import { EmployeeDirectoryTable } from '@/components/employees/EmployeeDirectoryTable';
import { EmployeeOnboardingModal } from '@/components/employees/EmployeeOnboardingModal';
import { useAuth } from '@/hooks/useAuth';
import { listEmployees } from '@/services/employees/employees.api';

export function EmployeeListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canOnboardEmployees = user?.role === ROLES.ADMIN;
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [directoryErrorMessage, setDirectoryErrorMessage] = useState(null);
  const managerOptions = employees.filter((employee) =>
    [ROLES.MANAGER, ROLES.ADMIN].includes(employee.role),
  );

  async function loadEmployees(nextSearch = '') {
    setLoading(true);
    setDirectoryErrorMessage(null);

    try {
      const result = await listEmployees(nextSearch ? { search: nextSearch } : {});
      setEmployees(result.items);
    } catch (error) {
      setDirectoryErrorMessage(error?.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleOnboardingSuccess(result) {
    setNotice(
      `Account created for ${result.user.fullName}. Onboarding delivery: ${result.onboarding.delivery}.`,
    );
    await loadEmployees(search);
  }

  return (
    <div className="space-y-6">
      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}

      <Card className="border border-slate-800 bg-slate-900/80">
        <CardHeader className="flex flex-col items-start gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Employee directory</h3>
            <div className="w-full max-w-md">
              <TextField fullWidth name="employeeSearch">
                <Label>Search by name or email</Label>
                <Input
                  value={search}
                  onValueChange={(value) => setSearch(value)}
                  endContent={
                    <Button size="sm" variant="light" onPress={() => loadEmployees(search)}>
                      Search
                    </Button>
                  }
                />
                <Description>Search refreshes the current employee directory table.</Description>
              </TextField>
            </div>
          </div>

          {canOnboardEmployees ? (
            <Button color="primary" radius="lg" onPress={() => setIsOnboardingOpen(true)}>
              Onboard employee
            </Button>
          ) : null}
        </CardHeader>
        <CardBody className="space-y-4">
          {directoryErrorMessage ? <NoticeBanner tone="danger">{directoryErrorMessage}</NoticeBanner> : null}
          {loading ? (
            <PageLoader label="Loading employees..." />
          ) : employees.length ? (
            <EmployeeDirectoryTable
              employees={employees}
              onRowAction={(employeeId) => navigate(`${APP_ROUTES.EMPLOYEES}/${employeeId}`)}
            />
          ) : (
            <NoticeBanner tone="info">No employee records match the current filters.</NoticeBanner>
          )}
        </CardBody>
      </Card>

      {canOnboardEmployees ? (
        <EmployeeOnboardingModal
          isOpen={isOnboardingOpen}
          managerOptions={managerOptions}
          onOpenChange={setIsOnboardingOpen}
          onSuccess={handleOnboardingSuccess}
        />
      ) : null}
    </div>
  );
}
