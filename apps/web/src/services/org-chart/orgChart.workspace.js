import { APP_ROUTES, ROLES } from '@hrms/shared';
import { getMyReportingLine, listDirectReports, listReportingRelationships } from './orgChart.api';

const DEPARTMENT_ACCENTS = ['cyan', 'amber', 'violet', 'emerald'];

const DIRECTORY_TABS = Object.freeze([
  { key: 'overview', label: 'Overview', disabled: true },
  { key: 'analytics', label: 'Analytics', disabled: true },
  { key: 'directory', label: 'Directory', to: APP_ROUTES.ORG_CHART, exact: true, current: true },
  { key: 'teams', label: 'Teams', to: APP_ROUTES.ORG_CHART_TEAM },
]);

const TEAM_TABS = Object.freeze([
  { key: 'team', label: 'Team View', to: APP_ROUTES.ORG_CHART_TEAM, exact: true, current: true },
  { key: 'analytics', label: 'Analytics', disabled: true },
  { key: 'hiring', label: 'Hiring', disabled: true },
]);

function slugify(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function normalizePerson(person, overrides = {}) {
  if (!person) {
    return null;
  }

  return {
    id: person.id,
    fullName: person.fullName || person.name || 'Unassigned',
    workEmail: person.workEmail || '',
    role: person.role || ROLES.EMPLOYEE,
    jobTitle: person.jobTitle || '',
    department: person.department || '',
    status: person.status || 'ACTIVE',
    managerUserId: person.managerUserId || null,
    ...overrides,
  };
}

function mergePeopleRecords(previous, next) {
  if (!previous) {
    return next;
  }

  if (!next) {
    return previous;
  }

  return {
    ...previous,
    ...next,
    fullName: next.fullName || previous.fullName,
    workEmail: next.workEmail || previous.workEmail,
    role: next.role || previous.role,
    jobTitle: next.jobTitle || previous.jobTitle,
    department: next.department || previous.department,
    status: next.status || previous.status,
    managerUserId: next.managerUserId || previous.managerUserId,
  };
}

function uniquePeople(items = []) {
  return Array.from(
    items
      .filter(Boolean)
      .reduce((accumulator, item) => {
        const existing = accumulator.get(item.id);
        accumulator.set(item.id, mergePeopleRecords(existing, item));
        return accumulator;
      }, new Map())
      .values(),
  );
}

function sortByName(items = []) {
  return [...items].sort((left, right) => left.fullName.localeCompare(right.fullName));
}

function buildChartPeople({ rootNode, relationships, employee, manager, directReports }) {
  return sortByName(
    uniquePeople([
      rootNode,
      employee,
      manager,
      ...(directReports || []),
      ...relationships.flatMap((entry) => [
        normalizePerson(entry.employee),
        normalizePerson(entry.manager),
      ]),
    ]).filter(Boolean),
  );
}

function buildDepartmentGroups({ rootNode, relationships, fallbackPeople }) {
  const relationshipEmployees = relationships.map((entry) => normalizePerson(entry.employee));
  const people = uniquePeople([...relationshipEmployees, ...(fallbackPeople || [])]).filter(
    (person) => person && person.id !== rootNode?.id,
  );

  if (!people.length) {
    return [];
  }

  const grouped = people.reduce((accumulator, person) => {
    const department = person.department || 'Core Team';

    if (!accumulator.has(department)) {
      accumulator.set(department, []);
    }

    accumulator.get(department).push(person);
    return accumulator;
  }, new Map());

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([department, members], index) => {
      const sortedMembers = sortByName(members);
      const lead =
        sortedMembers.find((member) => [ROLES.ADMIN, ROLES.MANAGER].includes(member.role)) ||
        sortedMembers[0];
      const contributors = sortedMembers.filter((member) => member.id !== lead.id).slice(0, 4);

      return {
        id: slugify(department),
        department,
        accent: DEPARTMENT_ACCENTS[index % DEPARTMENT_ACCENTS.length],
        lead,
        members: contributors,
        headcount: sortedMembers.length,
        openRoles:
          contributors.length < 3 && lead.role !== ROLES.EMPLOYEE
            ? [
                {
                  id: `${slugify(department)}-open-role`,
                  title: `Open ${department} role`,
                  subtitle: 'Hiring pipeline ready',
                },
              ]
            : [],
      };
    });
}

function buildBreadcrumbs(manager) {
  return [
    { label: 'Directory', to: APP_ROUTES.ORG_CHART },
    { label: manager?.department || 'Team', to: APP_ROUTES.ORG_CHART_TEAM },
    { label: manager?.department ? `${manager.department} Team` : 'Direct Reports' },
  ];
}

function buildOpenRoleNodes(groups = []) {
  return groups.flatMap((group) =>
    group.openRoles.map((role) => ({
      id: role.id,
      fullName: role.title,
      jobTitle: role.subtitle,
      department: group.department,
      role: 'OPEN_ROLE',
      status: 'OPEN',
      managerUserId: group.lead.id,
      kind: 'open-role',
    })),
  );
}

export async function loadOrgChartDirectoryWorkspace(currentUser, options = {}) {
  const showFullOrganization =
    options.showFullOrganization ?? currentUser?.role === ROLES.ADMIN;
  const reportingLine = await getMyReportingLine();
  let relationships = [];
  let directReports = reportingLine.directReports || [];

  if ([ROLES.ADMIN, ROLES.MANAGER].includes(currentUser?.role)) {
    try {
      const directReportsResult = await listDirectReports();
      directReports = directReportsResult.items || directReports;
    } catch {
      // Use reporting-line payload as the fallback.
    }
  }

  if (showFullOrganization) {
    try {
      const relationshipResult = await listReportingRelationships();
      relationships = relationshipResult.items || [];
    } catch {
      relationships = [];
    }
  }

  const employee = normalizePerson(reportingLine.employee || currentUser);
  const manager = normalizePerson(reportingLine.manager, { roleLabel: 'Reports To' });
  const normalizedDirectReports = sortByName(
    (directReports || []).map((person) => normalizePerson(person)),
  );
  const rootNode =
    normalizePerson(
      relationships.find(
        (entry) =>
          entry.employee?.role === ROLES.ADMIN &&
          (!entry.employee?.managerUserId || entry.employee?.id === currentUser?.id),
      )?.employee,
      { emphasis: true },
    ) ||
    manager ||
    employee;
  const departmentGroups = buildDepartmentGroups({
    rootNode,
    relationships,
    fallbackPeople: [employee, manager, ...normalizedDirectReports],
  });
  const chartPeople = buildChartPeople({
    rootNode,
    relationships,
    employee,
    manager,
    directReports: normalizedDirectReports,
  });
  const openRoleNodes = buildOpenRoleNodes(departmentGroups);

  return {
    tabs: DIRECTORY_TABS,
    header: {
      title: 'Organization Chart',
      subtitle: showFullOrganization
        ? 'Visualizing the full reporting structure, departments, and live leadership coverage.'
        : 'Visualizing your reporting line, department context, and nearby team structure.',
      // eyebrow: 'Module 3',
    },
    liveView: {
      label: showFullOrganization ? 'Org View' : 'Line View',
      employeeCount: chartPeople.length,
      departmentCount: departmentGroups.length,
    },
    showFullOrganization,
    reportingLine: {
      employee,
      manager,
      directReports: normalizedDirectReports,
    },
    relationships,
    directReports: normalizedDirectReports,
    rootNode,
    focusEmployee: employee,
    manager,
    departmentGroups,
    chartPeople,
    openRoleNodes,
  };
}

export async function loadTeamWorkspace(currentUser) {
  const reportingLine = await getMyReportingLine();
  let manager = normalizePerson(reportingLine.employee || currentUser);
  let directReports = [];

  if (currentUser?.role === ROLES.ADMIN) {
    const relationshipResult = await listReportingRelationships();
    const relationships = relationshipResult.items || [];
    const managerCandidate =
      relationships
        .map((entry) => normalizePerson(entry.employee))
        .find((person) => person.role === ROLES.MANAGER) || manager;
    const directReportResult = await listDirectReports({ managerUserId: managerCandidate.id });

    manager = normalizePerson(directReportResult.manager || managerCandidate);
    directReports = sortByName(
      (directReportResult.items || []).map((person) => normalizePerson(person)),
    );
  } else {
    const directReportResult = await listDirectReports();
    manager = normalizePerson(directReportResult.manager || manager);
    directReports = sortByName(
      (directReportResult.items || []).map((person) => normalizePerson(person)),
    );
  }

  return {
    tabs: TEAM_TABS,
    breadcrumbs: buildBreadcrumbs(manager),
    header: {
      title: 'Team View',
      subtitle: `Visualizing reporting structure for ${manager.department || 'your team'}.`,
    },
    manager,
    directReports,
    openPosition: {
      id: 'open-position',
      title: 'Open Position',
      subtitle: manager.department
        ? `Next ${manager.department.toLowerCase()} hire`
        : 'Hiring pipeline ready',
    },
  };
}

export async function loadOrganizationalFocusWorkspace(currentUser) {
  const reportingLine = await getMyReportingLine();

  return {
    employee: normalizePerson(reportingLine.employee || currentUser),
    manager: normalizePerson(reportingLine.manager),
    directReports: sortByName(
      (reportingLine.directReports || []).map((person) => normalizePerson(person)),
    ),
  };
}
