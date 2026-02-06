import React, { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "@/idl/urv_privacy.json";
import { getProvider } from "@/lib/solana";
import { canonicalize, sha256 } from "@/lib/crypto";

const PROGRAM_ID = new PublicKey("URVPr1vacy11111111111111111111111111111111"); // TODO: replace after deploy
const SCHEMA_VERSION = 1;

function u8ToArr32(u8: Uint8Array): number[] {
  if (u8.length !== 32) throw new Error("Hash must be 32 bytes");
  return Array.from(u8);
}

function u32ToLeBytes(n: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = n & 0xff;
  out[1] = (n >> 8) & 0xff;
  out[2] = (n >> 16) & 0xff;
  out[3] = (n >> 24) & 0xff;
  return out;
}

function u16ToLeBytes(n: number): Uint8Array {
  const out = new Uint8Array(2);
  out[0] = n & 0xff;
  out[1] = (n >> 8) & 0xff;
  return out;
}

export default function UrvDemo() {
  const wallet = useWallet();
  const [status, setStatus] = useState("");
  const [uri, setUri] = useState("ipfs://example-ciphertext-uri");
  const [score, setScore] = useState(72.3);
  const [conf, setConf] = useState(0.91);

  const program = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    // Check if IDL is placeholder
    if (!idl || Object.keys(idl).length <= 1) {
      console.warn("IDL is placeholder - paste real IDL after anchor build");
      return null;
    }
    try {
      const provider = getProvider(wallet as any);
      return new Program(idl as any, provider);
    } catch (e) {
      console.error("Failed to create program:", e);
      return null;
    }
  }, [wallet.publicKey, wallet.signTransaction]);

  function statePda(adminPk: PublicKey) {
    return PublicKey.findProgramAddressSync([Buffer.from("state"), adminPk.toBuffer()], PROGRAM_ID)[0];
  }

  async function initState() {
    try {
      if (!program || !wallet.publicKey) return setStatus("Conecte a wallet.");
      setStatus("Inicializando state...");
      const admin = wallet.publicKey;
      const oraclePk = wallet.publicKey; // MVP: wallet as oracle
      const st = statePda(admin);

      await program.methods
        .initState(oraclePk)
        .accounts({ admin, state: st, systemProgram: SystemProgram.programId })
        .rpc();

      setStatus(`State inicializado ✅ PDA: ${st.toBase58()}`);
    } catch (e: any) {
      setStatus(`Erro init_state: ${e?.message ?? String(e)}`);
    }
  }

  async function createRecord() {
    try {
      if (!program || !wallet.publicKey) return setStatus("Conecte a wallet.");
      setStatus("Criando record...");

      // Payload universal exemplo (troque por dados reais do seu sistema/CRM)
      const visitPayload = {
        provider: { provider_id: "UUID", type: "clinic", location: "BR-SP" },
        service: { service_id: "UUID", service_type: "consult", timestamp: new Date().toISOString() },
        results: { anchors: { any_anchor: "N/A" } },
        process: { protocol_adherence: 0.9, continuity: 0.85, safety_events: 0, documentation_quality: 0.9 },
        infrastructure: { equipment_score: 0.8, digitalization_score: 0.9, ambience_score: 0.85, accessibility_score: 0.8 },
        evolution: { education_score: 0.9, innovation_score: 0.7, teaching_score: 0.6, research_score: 0.5 },
        experience: { crm_score: 0.88, consistency_score: 0.9 }
      };

      const canon = canonicalize(visitPayload);
      const bytes = new TextEncoder().encode(canon);
      const dataHash = await sha256(bytes);

      const [recordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("rec"), wallet.publicKey.toBuffer(), Buffer.from(dataHash)],
        PROGRAM_ID
      );

      await program.methods
        .createRecord(u8ToArr32(dataHash), uri, SCHEMA_VERSION)
        .accounts({
          owner: wallet.publicKey,
          record: recordPda,
          systemProgram: SystemProgram.programId
        })
        .rpc();

      setStatus(`Record criado ✅ PDA: ${recordPda.toBase58()}`);
    } catch (e: any) {
      setStatus(`Erro create_record: ${e?.message ?? String(e)}`);
    }
  }

  async function postScoreUpdate() {
    try {
      if (!program || !wallet.publicKey) return setStatus("Conecte a wallet.");
      setStatus("Postando score update (encadeado)...");

      const admin = wallet.publicKey;
      const oracle = wallet.publicKey; // MVP: wallet as oracle
      const st = statePda(admin);

      // 1) Fetch state -> prev_score_hash
      const stAcc: any = await (program.account as any).urvState.fetch(st);
      const prevHashBytes = Uint8Array.from(stAcc.lastScoreHash);

      // 2) features_hash (amplie depois com dura/leve/leve-dura detalhado)
      const features = {
        // Exemplo "cadeia de valor" (você pode expandir com dezenas de variáveis)
        outcomes: { R: 70 },
        process: { P: 80, protocol: 0.9, safety: 1.0, continuity: 0.85, documentation: 0.9 },
        infrastructure: { I: 75, equipment: 0.8, ambience: 0.85, digital: 0.9, accessibility: 0.8 },
        evolution: { E: 65, study: 0.9, innovation: 0.7, teaching: 0.6, research: 0.5 },
        experience: { X: 78, crm: 0.88, consistency: 0.9 }
      };
      const featCanon = canonicalize(features);
      const featBytes = new TextEncoder().encode(featCanon);
      const featuresHash = await sha256(featBytes);

      // 3) record_data_hash real (MVP: zero). Depois, associe ao record criado.
      const recordDataHash = new Uint8Array(32);

      // 4) Score/Confidence
      const scoreU32 = Math.round(score * 10_000);
      const confBps = Math.round(conf * 10_000);

      // 5) new_score_hash = sha256(prev + features + scoreU32LE + confBpsLE)
      const toHash = new Uint8Array([
        ...prevHashBytes,
        ...featuresHash,
        ...u32ToLeBytes(scoreU32),
        ...u16ToLeBytes(confBps)
      ]);
      const newHash = await sha256(toHash);

      // 6) update PDA seeds ["upd", statePda, newHash]
      const [updPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("upd"), st.toBuffer(), Buffer.from(newHash)],
        PROGRAM_ID
      );

      await program.methods
        .postScoreUpdate(
          u8ToArr32(recordDataHash),
          u8ToArr32(featuresHash),
          scoreU32,
          confBps,
          u8ToArr32(prevHashBytes),
          u8ToArr32(newHash)
        )
        .accounts({
          oracle,
          state: st,
          update: updPda,
          systemProgram: SystemProgram.programId
        })
        .rpc();

      setStatus(`Score update ✅ URV=${score.toFixed(2)} conf=${conf.toFixed(2)}`);
    } catch (e: any) {
      setStatus(`Erro post_score_update: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>URV Health Value Chain (Devnet MVP)</h2>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Wallet: {wallet.publicKey?.toBase58() ?? "não conectada"}
      </p>

      <label style={{ fontWeight: 500 }}>Ciphertext URI (off-chain)</label>
      <input
        value={uri}
        onChange={(e) => setUri(e.target.value)}
        style={{ width: "100%", padding: 8, marginTop: 6, marginBottom: 16, border: "1px solid #ccc", borderRadius: 4 }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={initState} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Init State
        </button>
        <button onClick={createRecord} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Create Record
        </button>
        <button onClick={postScoreUpdate} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Post Score Update
        </button>
      </div>

      <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
        <div>
          <label style={{ fontWeight: 500 }}>URV score (0–100)</label>
          <br />
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            style={{ padding: 6, width: 100 }}
            step="0.1"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label style={{ fontWeight: 500 }}>Confidence (0–1)</label>
          <br />
          <input
            type="number"
            value={conf}
            onChange={(e) => setConf(Number(e.target.value))}
            style={{ padding: 6, width: 100 }}
            step="0.01"
            min="0"
            max="1"
          />
        </div>
      </div>

      <p style={{ background: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 16 }}>
        Status: {status}
      </p>

      <p style={{ fontSize: 12, color: "#888" }}>
        MVP: Phantom wallet atua como oracle signer. Produção: oracle = backend signer + engine probabilístico.
      </p>
    </div>
  );
}
