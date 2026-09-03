#!/usr/bin/env node
/**
 * Surebet / arbitrage kalkulátor 2 kimenetelre.
 *
 * Használat:
 *   node scripts/surebet.mjs --a=2.10 --b=2.05
 *   node scripts/surebet.mjs --a=2.10 --b=2.05 --stake=10000
 *   node scripts/surebet.mjs 2.10 2.05 10000
 *
 * Paraméterek:
 *   --a / első pozíciós arg   1. kimenetel odds (decimal, pl. 2.10)
 *   --b / második pozíciós    2. kimenetel odds
 *   --stake / harmadik        összesen megrakandó összeg (alapértelmezett: 10000)
 *
 * A script úgy osztja el a téteket, hogy mindkét kimenetelen UGYANANNYI
 * legyen a kifizetés. Ha 1/a + 1/b < 1, akkor biztos nyereség van.
 */

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((x) => x.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function positional() {
  return process.argv.slice(2).filter((x) => !x.startsWith("--"));
}

function parseNumber(value, label) {
  const n = Number(String(value ?? "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 1) {
    throw new Error(`${label} érvénytelen (decimal odds > 1 kell): ${value}`);
  }
  return n;
}

function fmt(n, digits = 2) {
  return n.toLocaleString("hu-HU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function main() {
  const pos = positional();
  const aRaw = arg("a") ?? pos[0];
  const bRaw = arg("b") ?? pos[1];
  const stakeRaw = arg("stake") ?? pos[2] ?? "10000";

  if (aRaw == null || bRaw == null) {
    console.error(`Használat:
  node scripts/surebet.mjs --a=2.10 --b=2.05 --stake=10000
  node scripts/surebet.mjs 2.10 2.05 10000`);
    process.exit(1);
  }

  const a = parseNumber(aRaw, "Odds A");
  const b = parseNumber(bRaw, "Odds B");
  const totalStake = Number(String(stakeRaw).replace(",", "."));
  if (!Number.isFinite(totalStake) || totalStake <= 0) {
    throw new Error(`Stake érvénytelen: ${stakeRaw}`);
  }

  // Implied probabilities
  const pA = 1 / a;
  const pB = 1 / b;
  const sumP = pA + pB;

  // Stakes that equalize payout
  const stakeA = (totalStake * pA) / sumP;
  const stakeB = (totalStake * pB) / sumP;

  const payoutA = stakeA * a;
  const payoutB = stakeB * b;
  // Equal by construction; use average for display safety
  const payout = (payoutA + payoutB) / 2;
  const profit = payout - totalStake;
  const roi = (profit / totalStake) * 100;
  const margin = (1 - sumP) * 100; // positive = arb edge

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("  Surebet kalkulátor (2 kimenetel)");
  console.log("═══════════════════════════════════════");
  console.log(`  Odds A:           ${fmt(a, 3)}`);
  console.log(`  Odds B:           ${fmt(b, 3)}`);
  console.log(`  Össztét:          ${fmt(totalStake)} Ft`);
  console.log("───────────────────────────────────────");
  console.log(`  Implied A:        ${(pA * 100).toFixed(2)}%`);
  console.log(`  Implied B:        ${(pB * 100).toFixed(2)}%`);
  console.log(`  Össz-implied:     ${(sumP * 100).toFixed(2)}%`);
  console.log(`  Arb él / margin:  ${margin.toFixed(2)}%`);
  console.log("───────────────────────────────────────");
  console.log(`  Tét A-ra:         ${fmt(stakeA)} Ft`);
  console.log(`  Tét B-re:         ${fmt(stakeB)} Ft`);
  console.log(`  Ellenőrzés:       ${fmt(stakeA + stakeB)} Ft`);
  console.log("───────────────────────────────────────");
  console.log(`  Kifizetés A-nál:  ${fmt(payoutA)} Ft`);
  console.log(`  Kifizetés B-nél:  ${fmt(payoutB)} Ft`);
  console.log(`  Biztos profit:    ${fmt(profit)} Ft  (${roi.toFixed(2)}%)`);
  console.log("═══════════════════════════════════════");

  if (sumP >= 1) {
    console.log("");
    console.log("⚠ NINCS surebet: az oddsok együtt túl alacsonyak.");
    console.log("  Bármelyik kimenetel jön is, veszteséged lesz.");
    console.log("  (1/a + 1/b kell hogy < 1 legyen.)");
    process.exit(2);
  }

  console.log("");
  console.log("✓ Surebet van: mindkét kimenetelen nyersz.");
  console.log(
    `  Rakj ${fmt(stakeA)} Ft-ot A-ra és ${fmt(stakeB)} Ft-ot B-re.`,
  );
  console.log("");
}

try {
  main();
} catch (err) {
  console.error("Hiba:", err.message || err);
  process.exit(1);
}
