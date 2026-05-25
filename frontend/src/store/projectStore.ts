import { create } from "zustand";
import { Project, ProjectVersion, GeneratedFile } from "@/types";

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  versions: ProjectVersion[];
  activeVersion: ProjectVersion | null;
  files: Record<string, string>;

  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setVersions: (versions: ProjectVersion[]) => void;
  setActiveVersion: (version: ProjectVersion | null) => void;
  setFiles: (files: Record<string, string>) => void;
  addVersion: (version: ProjectVersion) => void;
  updateVersionFiles: (versionId: string, files: GeneratedFile[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  versions: [],
  activeVersion: null,
  files: {},

  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  setVersions: (versions) => set({ versions }),
  setActiveVersion: (version) => set({ activeVersion: version }),
  setFiles: (files) => set({ files }),
  addVersion: (version) =>
    set((state) => ({
      versions: [version, ...state.versions.filter((v) => !v.is_latest || v.id === version.id)],
      activeVersion: version,
    })),
  updateVersionFiles: (versionId, files) =>
    set((state) => ({
      versions: state.versions.map((v) =>
        v.id === versionId ? { ...v, files } : v
      ),
    })),
}));
