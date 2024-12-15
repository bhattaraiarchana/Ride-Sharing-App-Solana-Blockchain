import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { RideSharingBackend } from "../target/types/ride_sharing_backend";

describe("ride_sharing_backend", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RideSharingBackend as Program<RideSharingBackend>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
