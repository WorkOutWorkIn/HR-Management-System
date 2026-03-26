import { Button } from '@heroui/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { NoticeBanner } from '@/components/common/NoticeBanner';
import { PageLoader } from '@/components/common/PageLoader';
import { DirectReportsGrid } from '@/components/org-chart/DirectReportsGrid';
import { OrgChartTabs } from '@/components/org-chart/OrgChartTabs';
import { TeamManagerCard } from '@/components/org-chart/TeamManagerCard';
import { useAuth } from '@/hooks/useAuth';
import { loadTeamWorkspace } from '@/services/org-chart/orgChart.workspace';

export function TeamViewPage() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    async function loadTeamData() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const result = await loadTeamWorkspace(user);
        setWorkspace({
          ...result,
          manager: {
            ...result.manager,
            reportsCount: result.directReports.length,
          },
        });
      } catch (error) {
        setErrorMessage(error?.response?.data?.message || 'Unable to load team view.');
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [user]);

  if (loading) {
    return <PageLoader label="Loading team view..." />;
  }

  if (!workspace) {
    return <NoticeBanner tone="danger">{errorMessage || 'Unable to load team view.'}</NoticeBanner>;
  }

  return (
    <div className="space-y-6">
      <OrgChartTabs items={workspace.tabs} />

      {errorMessage ? <NoticeBanner tone="danger">{errorMessage}</NoticeBanner> : null}

      <section className="rounded-[36px] border border-white/8 bg-[#08111a] px-6 py-7 shadow-[0_26px_60px_rgba(2,12,27,0.45)] lg:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              {workspace.breadcrumbs.map((crumb, index) => (
                <div key={`${crumb.label}-${index}`} className="flex items-center gap-3">
                  {crumb.to ? (
                    <Link className="hover:text-cyan-200" to={crumb.to}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-cyan-200">{crumb.label}</span>
                  )}
                  {index < workspace.breadcrumbs.length - 1 ? <span>›</span> : null}
                </div>
              ))}
            </div>
            <div>
              <h1 className="text-5xl font-semibold tracking-tight text-white">
                {workspace.header.title}
              </h1>
              <p className="mt-3 text-xl text-slate-400">{workspace.header.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button color="default" radius="lg" variant="faded">
              Export PDF
            </Button>
            <Button color="primary" radius="lg">
              Add Member
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[380px,1fr] xl:items-start">
          <TeamManagerCard manager={workspace.manager} />
          <DirectReportsGrid
            directReports={workspace.directReports}
            openPosition={workspace.openPosition}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </section>
    </div>
  );
}
