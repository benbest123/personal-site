import { cv } from "../content/cv";
import { profile } from "../content/profile";

export default function CvWindow() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-1 text-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">{profile.name}</h2>
          <p className="text-xs">{profile.location}</p>
        </div>
        {/* A plain anchor, not an <a> wrapping a <button> — that nesting is invalid HTML
            and confuses assistive technology about what the control actually is. */}
        <a href="/Benjamin_Best_CV.pdf" download className="whitespace-nowrap">
          Download CV (PDF)
        </a>
      </header>

      <p>{profile.summary}</p>

      <section>
        <h3 className="mb-2 font-bold">Experience</h3>
        {cv.roles.map(role => (
          <article key={`${role.company}-${role.start}`} className="mb-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong>{role.company}</strong>
              <span className="text-xs">
                {role.start} – {role.end}
              </span>
            </div>
            <div className="text-xs italic">{role.title}</div>
            <ul className="mt-1 list-disc pl-5">
              {role.bullets.map(bullet => (
                <li key={bullet} className="mb-1">
                  {bullet}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section>
        <h3 className="mb-2 font-bold">Education</h3>
        {cv.education.map(item => (
          <article key={item.institution} className="mb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong>{item.institution}</strong>
              <span className="text-xs">
                {item.start} – {item.end}
              </span>
            </div>
            <div className="text-xs italic">{item.qualification}</div>
            <p className="mt-1">{item.detail}</p>
          </article>
        ))}
      </section>

      <section>
        <h3 className="mb-2 font-bold">Technical Skills</h3>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
          {cv.skillGroups.map(group => (
            <div key={group.name} className="contents">
              <dt className="font-bold">{group.name}</dt>
              <dd className="m-0">{group.skills.join(" · ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h3 className="mb-2 font-bold">Certifications</h3>
        <ul className="list-disc pl-5">
          {cv.certificates.map(cert => (
            <li key={cert.name}>
              {cert.name} — {cert.issuer}, {cert.year}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
