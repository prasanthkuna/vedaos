import { Bucket } from "encore.dev/storage/objects";

export const artifactsBucket = new Bucket("veda-artifacts", {
  public: false,
  versioned: true,
});
