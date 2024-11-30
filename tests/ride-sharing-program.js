"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
const ride_sharing_program_json_1 = __importDefault(require("../target/idl/ride_sharing_program.json"));
const web3_js_1 = require("@solana/web3.js");
// Define your program ID here. This should match the one in lib.rs and Anchor.toml
const programId = new web3_js_1.PublicKey("8S32UanLjYVkx9sXzcJtUrk1vaVtNdhMx9rMxkguxKqU");
describe("ride-sharing-program", () => {
    // Configure the client to use the local cluster.
    const provider = anchor_1.AnchorProvider.env();
    anchor.setProvider(provider);
    // Instantiate the program
    const program = new anchor.Program(ride_sharing_program_json_1.default, programId, provider);
    it("Registers a user!", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Generate a keypair for the user
            const userKeypair = web3_js_1.Keypair.generate();
            // Call the registerUser method from the program
            const tx = yield program.methods
                .registerUser({ rider: {} }) // Use `{ rider: {} }` or `{ driver: {} }` depending on your requirement
                .accounts({
                user: userKeypair.publicKey,
                authority: provider.wallet.publicKey,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .signers([userKeypair])
                .rpc();
            console.log("Your transaction signature", tx);
        }
        catch (err) {
            console.error("Transaction failed", err);
        }
    }));
});
