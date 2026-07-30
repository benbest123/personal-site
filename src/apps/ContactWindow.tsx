import { profile } from "../content/profile";

export default function ContactWindow() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-1 text-sm">
      <p>The quickest way to reach me is email.</p>
      <ul className="list-none p-0">
        <li className="mb-1">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
        {profile.links.map(link => (
          <li key={link.url} className="mb-1">
            <a href={link.url} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs">Based in {profile.location}.</p>
    </div>
  );
}
