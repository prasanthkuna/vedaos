import type {
  Claim,
  ConsentRecord,
  DeletionRequest,
  Entitlement,
  Profile,
  ScoreSnapshot,
  StoryRun,
  User,
  ValidationRecord,
} from "@/domain/types";
import { makeId } from "@/lib/id";

const nowIso = () => new Date().toISOString();

export class MemoryStore {
  users = new Map<string, User>();
  profiles = new Map<string, Profile>();
  claims = new Map<string, Claim>();
  runs = new Map<string, StoryRun>();
  validations = new Map<string, ValidationRecord>();
  scores = new Map<string, ScoreSnapshot>();
  entitlements = new Map<string, Entitlement>();
  consents = new Map<string, ConsentRecord[]>();
  deletions = new Map<string, DeletionRequest[]>();

  ensureUser(userId?: string): User {
    const id = userId ?? makeId("usr");
    let user = this.users.get(id);
    if (!user) {
      user = { userId: id, createdAt: nowIso() };
      this.users.set(id, user);
      this.entitlements.set(id, {
        userId: id,
        planCode: "basic",
        trialActive: false,
        proEnabled: false,
        familyEnabled: false,
        updatedAt: nowIso(),
      });
    }
    return user;
  }

  ensureScore(profileId: string): ScoreSnapshot {
    let score = this.scores.get(profileId);
    if (!score) {
      score = {
        profileId,
        psa: 0,
        pcs: 0,
        validatedCount: 0,
        yearCoverage: 0,
        diversityScore: 0,
        futureUnlocked: false,
        updatedAt: nowIso(),
      };
      this.scores.set(profileId, score);
    }
    return score;
  }
}

export const store = new MemoryStore();
