# Business Rules Catalog

**System:** Permissioned Blockchain-Based Appropriation and Obligation Monitoring System for the Municipal Budget Office

---

## Enforcement tiers

Where a rule is enforced determines whether it is a control or a courtesy.

| Tier | Location | Guarantee |
|---|---|---|
| **1** | Smart contract | Cannot be bypassed by any client, any operator, or a compromised backend. Violations revert. |
| **2** | Database constraint | Protects the projection from corruption. Does not constrain the chain. |
| **3** | API / service layer | Workflow sequencing and convenience. Bypassable by anyone with signing keys. |
| **4** | UI | Guidance only. Not a control. |

**Only Tier 1 rules support the integrity claim.** When your manuscript asserts that the system enforces something, verify the rule is Tier 1. A rule at Tier 3 belongs in your discussion of workflow, not in your findings on tamper resistance.

**Severity:** `BLOCKING` reverts the transaction. `ADVISORY` records a flag that requires written justification before the parent record can be finalized.

---

## 1. Identity, roles, and authorization

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-001 | Every ledger write is signed by an on-chain identity bound to a granted role. Unsigned or unrecognized writes are rejected. | 1 | BLOCKING |
| BR-002 | Role grants and revocations are themselves recorded transactions with a grantor identity and timestamp. | 1 | BLOCKING |
| BR-003 | `RULE_ADMIN` must not be held by any account holding `BUDGET_OFFICER`. | 1 | BLOCKING |
| BR-004 | Only an account holding `BUDGET_OFFICER` may certify the existence of an appropriation. | 1 | BLOCKING |
| BR-005 | A department head may submit obligation requests only against appropriations of their own office. | 1 | BLOCKING |
| BR-006 | Observer accounts hold no write capability; no state-changing function accepts an observer signature. | 1 | BLOCKING |
| BR-007 | Deactivating a user is prospective only. Historical records signed by that identity remain valid and attributed. | 1 | BLOCKING |
| BR-008 | An account may not hold two roles that constitute a separation-of-duties conflict, as defined in the role conflict matrix. | 1 | BLOCKING |

BR-003 is the structural safeguard for the whole compliance mechanism. If the Budget Office could amend the ceilings applied to its own budget, the rule registry would enforce nothing.

---

## 2. Ordinance and appropriation

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-010 | An appropriation line must reference an enacted ordinance. | 1 | BLOCKING |
| BR-011 | Ordinance number and fiscal year together are unique. | 1 | BLOCKING |
| BR-012 | Appropriation amount must be greater than zero. | 1 | BLOCKING |
| BR-013 | A recorded appropriation line is immutable. No update path exists. Corrections are effected only through an amending or supplemental ordinance. | 1 | BLOCKING |
| BR-014 | Every appropriation line specifies fund, implementing office, PAP code, and expense class. | 1 | BLOCKING |
| BR-015 | Appropriations may only be recorded for a fiscal year that has recorded `FiscalYearParameters`. | 1 | BLOCKING |
| BR-016 | A supplemental ordinance must reference the annual ordinance it amends. | 1 | BLOCKING |
| BR-017 | An appropriation line marked inoperative accepts no new allotments or obligations. | 1 | BLOCKING |

BR-013 is the rule people push back on. Budget offices correct encoding errors routinely, and an immutable record feels impractical. Hold the line: an audit trail that permits silent correction is not an audit trail. Provide a documented amendment path instead, and expect to defend this at least once.

---

## 3. Provincial review

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-020 | An ordinance progresses through the defined review state machine. Arbitrary status jumps are rejected. | 1 | BLOCKING |
| BR-021 | Every status transition records the effective date and, where applicable, an anchored review document. | 1 | BLOCKING |
| BR-022 | Allotment release against an ordinance not yet declared operative raises a flag requiring acknowledgment. | 1 | ADVISORY |
| BR-023 | Obligations existing against a line subsequently declared inoperative are retained and flagged, never deleted. | 1 | BLOCKING |
| BR-024 | A partial declaration of inoperativeness applies to identified lines only; unaffected lines remain operative. | 1 | BLOCKING |

BR-022 is deliberately advisory rather than blocking. Municipalities generally operate on an enacted budget while provincial review is pending, so blocking releases would make the system unusable in practice. Flagging preserves the record without obstructing the office. Confirm this matches your partner LGU's actual practice and cite it.

---

## 4. Allotment

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-030 | The sum of allotments against a line must not exceed the adjusted appropriation for that line. | 1 | BLOCKING |
| BR-031 | Allotment amount must be greater than zero. | 1 | BLOCKING |
| BR-032 | An allotment references exactly one appropriation line. | 1 | BLOCKING |
| BR-033 | Allotments are append-only. A reduction is recorded as a distinct withdrawal event referencing the original release, never as an edit. | 1 | BLOCKING |
| BR-034 | A withdrawal may not exceed the unobligated portion of the allotment it references. | 1 | BLOCKING |

---

## 5. Obligation

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-040 | The sum of certified obligations against a line must not exceed the sum of allotments released to that line. | 1 | BLOCKING |
| BR-041 | The availability check is evaluated at the moment of certification, not at request. | 1 | BLOCKING |
| BR-042 | Only obligations in `REQUESTED` status may be certified. | 1 | BLOCKING |
| BR-043 | An obligation may not be certified by the same account that requested it. | 1 | BLOCKING |
| BR-044 | ORS numbers are unique across the system. | 1 | BLOCKING |
| BR-045 | Certification records the certifying identity and block timestamp. | 1 | BLOCKING |
| BR-046 | The expense class of an obligation must match the appropriation line it charges. | 1 | BLOCKING |
| BR-047 | Obligation amount must be greater than zero. | 1 | BLOCKING |
| BR-048 | Obligation status follows the defined state machine. Reversal of a certified obligation is a distinct recorded cancellation with a justification, not a status edit. | 1 | BLOCKING |
| BR-049 | Only certified obligations count against available balance. Requested obligations are displayed as pending but do not reserve funds. | 1 | BLOCKING |

BR-040 is the core invariant and the centerpiece of your demonstration. BR-041 and BR-049 together resolve the question a panel will raise: two departments can each *request* more than remains, but only the first certification succeeds — the second reverts. State this explicitly, because it looks like a flaw until it's explained as a deliberate choice matching how certification actually works.

BR-043 is a separation-of-duties rule with no direct statutory basis. Justify it as an internal control consistent with COA's segregation principles, and be ready to relax it if your partner LGU's small staff makes it impractical — a two-person Budget Office may have no one else to certify.

---

## 6. Realignment and supplemental budget

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-050 | Every realignment references an authorizing Sanggunian ordinance. | 1 | BLOCKING |
| BR-051 | Source and target appropriation lines must differ. | 1 | BLOCKING |
| BR-052 | Realignment amount must not exceed the unobligated balance of the source line. | 1 | BLOCKING |
| BR-053 | A realignment must not reduce a statutorily mandated minimum allocation below its floor as resolved from the rule registry. | 1 | BLOCKING |
| BR-054 | Realignment across funds is prohibited. | 1 | BLOCKING |
| BR-055 | Realignments are append-only. A reversal is a new realignment in the opposite direction. | 1 | BLOCKING |
| BR-056 | A non-empty justification is required. | 1 | BLOCKING |
| BR-057 | Compliance is re-evaluated against all applicable rules after each realignment and supplemental appropriation. | 1 | BLOCKING |

BR-053 is worth highlighting in your defense. Funds cannot be quietly drained out of a mandated allocation after the budget passes compliance checks — the check is re-run on every movement, not only at enactment. That closes a gap a purely enactment-time validator would leave open.

---

## 7. Statutory rule registry

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-060 | No statutory rate, threshold, base, or income-class value appears as a literal in contract or application code. | 1 | BLOCKING |
| BR-061 | Rule versions resolve by fiscal year. A record is always validated against the rule version in force for its own fiscal year. | 1 | BLOCKING |
| BR-062 | An income-class-specific rule version takes precedence over a general version with the same effective year. | 1 | BLOCKING |
| BR-063 | Every rule version records a legal citation and an anchored hash of its legal basis document. | 1 | BLOCKING |
| BR-064 | Rule writes are restricted to `RULE_ADMIN`. | 1 | BLOCKING |
| BR-065 | Rule versions are append-only. An amendment creates a new version; existing versions are never modified. | 1 | BLOCKING |
| BR-066 | A rule version with an effective year earlier than an existing version for the same code and class is permitted but flagged as retroactive and requires justification. | 1 | ADVISORY |
| BR-067 | Initial rule seeding occurs through ordinary recorded amendment transactions, never through constructor arguments or migration scripts. | 1 | BLOCKING |
| BR-068 | A rule of kind `PERCENT_OF_BASE` must specify a base measure and a value in basis points; a rule of kind `ABSOLUTE_FLOOR_PER_UNIT` must specify an absolute value. | 1 | BLOCKING |

BR-066 exists because retroactive legislation is real. A circular issued in March may take effect from January. Blocking it would force you to falsify effective dates, which is worse than flagging.

BR-067 is easy to violate accidentally. Seeding rules via a deploy script constructor hides their origin from the audit trail and reintroduces hardcoding one layer down.

---

## 8. Compliance evaluation

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-070 | Each rule is evaluated against the base measure named in its own definition, not against a base assumed by the validator. | 1 | BLOCKING |
| BR-071 | `MAX` comparator rules fail when the aggregate exceeds the resolved limit; `MIN` rules fail when the aggregate falls below it. | 1 | BLOCKING |
| BR-072 | Blocking violations revert the transaction. Advisory violations record a flag. | 1 | — |
| BR-073 | An ordinance carrying an unjustified advisory flag cannot be marked complete. | 1 | BLOCKING |
| BR-074 | A justification records its author and timestamp and is itself immutable. | 1 | BLOCKING |
| BR-075 | Compliance results are recomputed, never cached as authoritative state. | 1 | BLOCKING |

---

## 9. Documents and verification

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-080 | Documents are stored off-chain; only the SHA-256 digest is anchored. | 1 | BLOCKING |
| BR-081 | An anchor is immutable. A corrected document produces a new anchor with a recorded supersession relationship to the original. | 1 | BLOCKING |
| BR-082 | Verification recomputes the digest and compares it to the anchor. A mismatch is surfaced and logged; the system never silently corrects or re-anchors. | 3 | — |
| BR-083 | A deleted off-chain document yields a verification result of *unavailable*, distinct from *mismatch*. | 3 | — |
| BR-084 | Every verification run is recorded with records checked, mismatches found, and duration. | 3 | — |

BR-083 matters more than it looks. Erasure under the Data Privacy Act means files get deleted legitimately. Without this distinction, every lawful deletion would register as evidence of tampering, and your verification metrics would be meaningless.

---

## 10. Data privacy

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-090 | No personally identifiable information is written on chain. | 1 | BLOCKING |
| BR-091 | Payees are identified on chain by opaque reference only. Names, addresses, and financial account details are never stored on chain or in the ledger schema. | 1 | BLOCKING |
| BR-092 | Erasure requests are satisfied by deleting off-chain objects. Anchors remain, since a digest is not personal data. | 3 | — |
| BR-093 | The public explorer exposes appropriation, allotment, and obligation aggregates without payee references. | 3 | — |

---

## 11. Ledger integrity

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-100 | The database is a projection. The chain is the sole source of truth. | 2 | — |
| BR-101 | The API database role holds no write privilege on the `ledger` schema. | 2 | BLOCKING |
| BR-102 | No mutable balance column exists. All balances are derived from immutable rows. | 2 | BLOCKING |
| BR-103 | Every projected row records block number, transaction hash, and log index. | 2 | BLOCKING |
| BR-104 | A full rebuild from block zero must produce state identical to the incrementally indexed state. | 2 | — |
| BR-105 | Divergence between the projection and contract state is reported as an integrity failure, never reconciled by writing to the projection. | 3 | — |

---

## 12. Monetary representation

| ID | Rule | Tier | Severity |
|---|---|---|---|
| BR-110 | All monetary values are integers in centavos. Floating-point types are prohibited throughout the system. | 1 | BLOCKING |
| BR-111 | All rates are expressed in basis points. | 1 | BLOCKING |
| BR-112 | Where a rule computation yields a fractional centavo, ceilings round down and floors round up. Both directions round toward stricter compliance. | 1 | BLOCKING |
| BR-113 | No currency conversion is performed. All amounts are Philippine pesos. | 1 | — |

BR-112 removes an entire class of argument. When a computed limit lands on a fraction, the direction of rounding is a policy decision, and leaving it to language defaults produces off-by-one-centavo disputes that are tedious to defend.

---

## 13. Traceability

Maintain a matrix mapping each rule to its enforcing contract function or constraint, and to the test that proves it. Rules without a corresponding test are claims, not controls.

| Column | Content |
|---|---|
| Rule ID | BR-nnn |
| Enforcement point | Contract function, constraint name, or service method |
| Test reference | Hardhat or integration test identifier |
| FR reference | Functional requirement from the approved proposal |

For the pre-orals milestone, the rules that must be demonstrably enforced are BR-001 through BR-008, BR-010 through BR-017, BR-030 through BR-034, and BR-040 through BR-049. Everything else follows in later phases.
