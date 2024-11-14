import * as anchor from "@coral-xyz/anchor";
import { Program, Idl, AnchorProvider } from "@coral-xyz/anchor";
import { RideSharingProgram } from "../target/types/ride_sharing_program";
import idl from "../target/idl/ride_sharing_program.json";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";


// Define your program ID here. This should match the one in lib.rs and Anchor.toml
const programId = new PublicKey("8S32UanLjYVkx9sXzcJtUrk1vaVtNdhMx9rMxkguxKqU");

describe("ride-sharing-program", () => {
  // Configure the client to use the local cluster.
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);

  const program = new anchor.Program(idl as Idl, programId, provider) as Program<RideSharingProgram>;

  it("Registers a user!", async () => {
    try {
      // Generate a keypair for the user
      const userKeypair = Keypair.generate();

      // Call the registerUser method from the program
      const tx = await program.methods
        .registerUser({ rider: {} }) // Use `{ rider: {} }` or `{ driver: {} }` depending on your requirement
        .accounts({
          user: userKeypair.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Your transaction signature", tx);
    } catch (err) {
      console.error("Transaction failed", err);
    }
  });
});
