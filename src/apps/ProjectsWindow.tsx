import { projects } from "../content/projects";
import type { ProjectStatus } from "../content/types";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  live: "Live",
  published: "Published",
  local: "Runs locally",
};

export default function ProjectsWindow() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-1 text-sm">
      {projects.map(project => {
        const headingId = `project-${project.name.replace(/\W+/g, "-").toLowerCase()}`;
        return (
          <article key={project.name} aria-labelledby={headingId}>
            <div className="sunken-panel p-3">
              <h3 id={headingId} className="mb-2 text-sm font-bold">
                {project.name}
              </h3>

              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="border border-black px-1 text-xs">
                  {STATUS_LABELS[project.status]}
                </span>
                {project.stack.map(tech => (
                  <span key={tech} className="text-xs">
                    {tech}
                  </span>
                ))}
              </div>

              <p className="mb-2">{project.blurb}</p>
              <p className="mb-2 text-xs italic">
                <strong>Why I built it: </strong>
                {project.why}
              </p>

              <div className="flex gap-2">
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noreferrer">
                    View repo
                  </a>
                )}
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noreferrer">
                    Visit site
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
