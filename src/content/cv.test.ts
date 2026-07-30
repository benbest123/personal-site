import { cv } from "./cv";

describe("cv", () => {
  it("lists roles in reverse-chronological order", () => {
    expect(cv.roles.map(r => r.company)).toEqual([
      "Visa",
      "Russell McVeagh",
      "Technology Investment Network",
    ]);
  });

  it("gives every role at least one bullet", () => {
    for (const role of cv.roles) {
      expect(role.bullets.length).toBeGreaterThan(0);
      for (const bullet of role.bullets) {
        expect(bullet.trim()).not.toBe("");
      }
    }
  });

  it("has education, a certificate and skill groups", () => {
    expect(cv.education.length).toBeGreaterThan(0);
    expect(cv.certificates.length).toBeGreaterThan(0);
    expect(cv.skillGroups.length).toBeGreaterThan(0);
    for (const group of cv.skillGroups) {
      expect(group.skills.length).toBeGreaterThan(0);
    }
  });
});
