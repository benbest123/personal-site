import { profile } from "./profile";
import { projects } from "./projects";

describe("profile", () => {
  it("has a name, headline and summary", () => {
    expect(profile.name).toBe("Benjamin Best");
    expect(profile.headline.length).toBeGreaterThan(0);
    expect(profile.summary.length).toBeGreaterThan(0);
  });

  it("exposes contact links but never a phone number", () => {
    expect(profile.email).toContain("@");
    expect(profile.links.map(l => l.label)).toEqual(
      expect.arrayContaining(["LinkedIn", "GitHub"])
    );
    const serialised = JSON.stringify(profile);
    expect(serialised).not.toMatch(/\+44|07\d{9}/);
  });

  it("states full right to work", () => {
    expect(profile.summary).toContain("full right to work");
  });

  it("says he is available and open to both data and software engineering roles", () => {
    // The whole point of the site is job applications, so these three claims are the ones
    // a well-meaning edit must not quietly drop.
    expect(profile.availability.length).toBeGreaterThan(0);
    expect(profile.summary).toContain("data engineering");
    expect(profile.summary).toContain("software engineering");
  });
});

describe("projects", () => {
  it("gives every project a status and a reason it was built", () => {
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(["live", "published", "local"]).toContain(project.status);
      expect(project.why.length).toBeGreaterThan(0);
      expect(project.blurb.length).toBeGreaterThan(0);
      expect(project.stack.length).toBeGreaterThan(0);
    }
  });

  it("only claims a live or published URL when one is present", () => {
    for (const project of projects) {
      if (project.status === "live" || project.status === "published") {
        expect(project.liveUrl).toBeTruthy();
      }
    }
  });
});
