import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { STUDY_AREAS, type StudyArea } from "../data/indicators";

type WorkspaceValue = {
  area: StudyArea;
  setAreaId: (id: string) => void;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [areaId, setAreaId] = useState(STUDY_AREAS[0]?.id ?? "karaj");
  const area = STUDY_AREAS.find((item) => item.id === areaId) ?? (STUDY_AREAS[0] as StudyArea);

  const value = useMemo<WorkspaceValue>(() => ({ area, setAreaId }), [area]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}