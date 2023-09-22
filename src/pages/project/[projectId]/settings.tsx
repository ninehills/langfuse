import Header from "@/src/components/layouts/header";
import { ApiKeyList } from "@/src/features/publicApi/components/ApiKeyList";
import { useRouter } from "next/router";
import { ProjectMembersTable } from "@/src/features/rbac/components/ProjectMembersTable";

export default function SettingsPage() {
  const router = useRouter();
  const projectId = router.query.projectId as string;
  return (
    <div className="md:container">
      <Header title="Settings" />
      <div className="flex flex-col gap-10">
        <ProjectMembersTable projectId={projectId} />
        <ApiKeyList projectId={projectId} />
      </div>
    </div>
  );
}

