import { Header, Footer } from '@/components/layout';
import { CodeBlock, Diagram, Callout } from './components';

export const metadata = {
  title: 'How Margen Solves Hallucination in Regulatory AI | Margen',
  description:
    'A technical deep-dive into Margen\'s hybrid agentic GraphRAG approach to eliminating hallucinations in regulatory AI systems.',
};

export default function IndexingPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="bg-bg">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6">
          <div className="mx-auto max-w-2xl">
            <p className="text-accent text-sm font-medium uppercase tracking-wider mb-4">
              Technical Deep Dive
            </p>
            <h1 className="text-3xl md:text-4xl text-text mb-6 leading-tight">
              How Margen Solves the Hallucination Problem in Regulatory AI
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed">
              A hybrid system combining semantic search, exact term matching, knowledge graph
              relationships, and self-correction to deliver answers legal professionals can trust.
            </p>
            <div className="flex items-center gap-4 mt-8 text-sm text-text-tertiary">
              <span>15 min read</span>
              <span className="w-1 h-1 rounded-full bg-text-tertiary" />
              <span>Last updated January 2025</span>
            </div>
          </div>
        </section>

        {/* Abstract */}
        <section className="py-12 px-6 bg-card border-y border-border-01">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl text-text mb-6 pb-2 border-b border-border-02">
              Abstract
            </h2>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                One major pain point of building AI systems for regulatory documents is that they
                hallucinate. <span className="text-text">Confidently.</span> With citations that don&apos;t exist.
              </p>
              <p>
                Ask a standard RAG system about tax exemptions, and it might cite &quot;§ 212.08(7)(a)&quot;
                with perfect confidence—except that citation doesn&apos;t say what the AI claims, or worse,
                doesn&apos;t exist at all. In regulated industries where accuracy isn&apos;t optional, this is a dealbreaker.
              </p>
              <p>
                Here, we present Margen&apos;s approach to regulatory AI: a hybrid system that combines semantic
                search, exact term matching, knowledge graph relationships, and—critically—self-correction.
                The system doesn&apos;t just find relevant documents; it reasons about what it found, traces
                authority chains, and verifies every citation before responding.
              </p>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-4">
              <div className="bg-card-02 border border-border-02 rounded-md p-4">
                <h3 className="text-sm font-medium text-text mb-2">Hybrid Retrieval</h3>
                <p className="text-sm text-text-secondary">
                  Captures both conceptual meaning and exact terminology
                </p>
              </div>
              <div className="bg-card-02 border border-border-02 rounded-md p-4">
                <h3 className="text-sm font-medium text-text mb-2">Query Decomposition</h3>
                <p className="text-sm text-text-secondary">
                  Breaks complex questions into focused sub-queries
                </p>
              </div>
              <div className="bg-card-02 border border-border-02 rounded-md p-4">
                <h3 className="text-sm font-medium text-text mb-2">Knowledge Graph</h3>
                <p className="text-sm text-text-secondary">
                  Understands document relationships (statutes → rules → cases)
                </p>
              </div>
              <div className="bg-card-02 border border-border-02 rounded-md p-4">
                <h3 className="text-sm font-medium text-text mb-2">Self-Correction</h3>
                <p className="text-sm text-text-secondary">
                  Catches hallucinations before they reach the user
                </p>
              </div>
            </div>

            <Callout type="success">
              <strong>The result:</strong> High citation precision, zero fabricated references in our
              baseline testing, and answers that legal professionals can actually trust.
            </Callout>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="py-16 px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl text-text mb-6 pb-2 border-b border-border-02">
              The Problem with Traditional RAG
            </h2>
            <p className="text-text-secondary leading-relaxed mb-8">
              Before we explain our approach, let&apos;s look at why standard Retrieval-Augmented
              Generation fails on regulatory documents.
            </p>

            {/* Failure Mode 1 */}
            <h3 className="text-lg text-text mb-4 mt-12">
              Failure Mode 1: Chunking Destroys Legal Meaning
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Every RAG system starts by splitting documents into chunks. The problem?
              Fixed-size chunking tears legal text apart mid-sentence.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              Consider this statute:
            </p>

            <CodeBlock title="§ 212.05 Sales Tax Rates">{`§ 212.05 Sales Tax Rates

(1) For the exercise of such privilege, a tax is levied on each taxable
transaction at the rate of 6 percent of the sales price of each item
or article of tangible personal property.

(2) Exemptions to subsection (1) are provided in § 212.08.`}</CodeBlock>

            <p className="text-text-secondary leading-relaxed mb-4">
              A naive 200-character chunker produces:
            </p>

            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Chunk 1</p>
                <CodeBlock>{`§ 212.05 Sales Tax Rates

(1) For the exercise of such privilege,
a tax is levied on each taxable
transaction at the rate of 6 percent
of the sales price of each item
or article of tan`}</CodeBlock>
              </div>
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-2">Chunk 2</p>
                <CodeBlock>{`gible personal property.

(2) Exemptions to subsection (1) are
provided in § 212.08.`}</CodeBlock>
              </div>
            </div>

            <Callout type="warning">
              Chunk 1 now says &quot;tan&quot; instead of &quot;tangible personal property.&quot; Chunk 2 lost the
              context that it&apos;s part of § 212.05. The cross-reference to exemptions is severed from
              the tax rate it modifies. <strong>Legal documents have structure. Chunking ignores it.</strong>
            </Callout>

            {/* Failure Mode 2 */}
            <h3 className="text-lg text-text mb-4 mt-12">
              Failure Mode 2: Vector Search Misses Exact Terms
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Semantic embeddings are powerful—they understand that &quot;levy&quot; and &quot;impose&quot; mean similar
              things. But in regulatory contexts, <span className="text-text">exact terminology matters</span>.
            </p>

            <CodeBlock title="The Mismatch">{`Query: "What does § 212.05(1)(a) say about sales tax?"

Vector search returns:
1. "Sales taxes are generally imposed on retail transactions..."
2. "The taxation of goods follows standard commercial principles..."
3. "Revenue collection mechanisms include various levies..."

What the user needed: The actual text of § 212.05(1)(a)`}</CodeBlock>

            <p className="text-text-secondary leading-relaxed mt-4">
              The embeddings found conceptually similar content, but missed the specific section
              the user asked for. A keyword search would have found it instantly—but keyword search
              alone misses conceptual connections. <span className="text-text">Neither approach works in isolation.</span>
            </p>

            {/* Failure Mode 3 */}
            <h3 className="text-lg text-text mb-4 mt-12">
              Failure Mode 3: No Understanding of Authority
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Legal documents aren&apos;t created equal. A statute is binding law. An administrative rule
              interprets the statute. A court case applies the rule to specific facts. An advisory
              opinion is just guidance.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              Traditional RAG treats them all the same:
            </p>

            <CodeBlock title="Improper Ranking">{`Query: "Is software consulting taxable?"

Standard RAG returns (ranked by vector similarity):
1. Technical Advisory (2019): "Software services may be..." [0.89 similarity]
2. Blog post: "Many businesses wonder about..." [0.87 similarity]
3. § 212.05 Statute: "Taxable transactions include..." [0.82 similarity]`}</CodeBlock>

            <p className="text-text-secondary leading-relaxed mt-4">
              The advisory opinion—which isn&apos;t binding—ranks higher than the actual statute. A human
              researcher would never make this mistake. They know to start with the statute, then
              check implementing rules, then look at how courts have interpreted it.
            </p>
            <p className="text-text leading-relaxed mt-4 font-medium">
              Standard RAG has no concept of authority hierarchy.
            </p>
          </div>
        </section>

        {/* Our Approach Section */}
        <section className="py-16 px-6 bg-card border-y border-border-01">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl text-text mb-6 pb-2 border-b border-border-02">
              Our Approach: Hybrid Agentic GraphRAG
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              What if we combined semantic understanding, exact matching, and relationship
              awareness into a single system that could reason about what it found?
            </p>
            <p className="text-lg text-accent font-medium mb-8">
              That&apos;s Margen.
            </p>

            <h3 className="text-lg text-text mb-4">The Big Picture</h3>

            <Diagram caption="Margen Pipeline Overview">{`┌─────────────────┐
│   User Query    │
│ "Is software    │
│  consulting     │
│  taxable?"      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                     MARGEN PIPELINE                         │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │
│  │ Decompose│──▶│ Retrieve │──▶│  Expand  │──▶│ Validate │ │
│  │  Query   │   │ (Hybrid) │   │  (Graph) │   │ + Correct│ │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ Verified Answer │
│ with Citations  │
│ [Source: §212.05]│
└─────────────────┘`}</Diagram>

            {/* Hybrid Search */}
            <h3 className="text-lg text-text mb-4 mt-12">
              Hybrid Search: Best of Both Worlds
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              The first insight is simple: <span className="text-text">don&apos;t choose between semantic
              and keyword search. Use both.</span>
            </p>

            <Diagram>{`Query: "What is the 6% rate applied to?"

┌─────────────────────────────────────────────────────┐
│              HYBRID SEARCH                          │
│                                                     │
│   Semantic Search          Keyword Search           │
│   ──────────────          ──────────────           │
│   "rate" → taxation       "6%" → exact match       │
│   "applied" → levied      "rate" → exact match     │
│   concepts related        in § 212.05(1)           │
│   to tax rates                                      │
│                                                     │
│              ↓ FUSION ↓                             │
│                                                     │
│   Results ranked by BOTH conceptual relevance      │
│   AND exact term matches                           │
└─────────────────────────────────────────────────────┘`}</Diagram>

            <p className="text-text-secondary leading-relaxed">
              When a user asks about &quot;§ 212.05,&quot; the keyword component finds exact matches. When
              they ask about &quot;sales tax exemptions for nonprofits,&quot; the semantic component
              understands the concept even if those exact words don&apos;t appear in the statute.
            </p>
            <p className="text-text-secondary leading-relaxed mt-4">
              The fusion is tunable. For citation lookups, we weight keywords heavily. For
              conceptual questions, we weight semantics. <span className="text-text">The system adapts
              to what the query needs.</span>
            </p>

            {/* Query Decomposition */}
            <h3 className="text-lg text-text mb-4 mt-12">
              Query Decomposition: Breaking Down Complexity
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Real questions aren&apos;t simple. &quot;Is software consulting taxable, and if so, what
              exemptions might apply for a nonprofit providing educational services?&quot; contains
              at least four distinct sub-questions.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              Traditional RAG throws the whole thing at a search engine and hopes for the best.
              Margen breaks it apart:
            </p>

            <Diagram caption="Query decomposition into focused sub-queries">{`Original Query:
"Is software consulting taxable, and if so, what exemptions
might apply for a nonprofit providing educational services?"

                    ↓ DECOMPOSITION ↓

┌─────────────────────────────────────────────────────────────┐
│ Sub-query 1: "software consulting sales tax taxability"     │
│ Type: DEFINITION | Priority: 1                              │
├─────────────────────────────────────────────────────────────┤
│ Sub-query 2: "professional services tax exemptions"         │
│ Type: EXEMPTION | Priority: 1                               │
├─────────────────────────────────────────────────────────────┤
│ Sub-query 3: "nonprofit organization tax exemptions"        │
│ Type: EXEMPTION | Priority: 2                               │
├─────────────────────────────────────────────────────────────┤
│ Sub-query 4: "educational services tax treatment"           │
│ Type: EXEMPTION | Priority: 2                               │
└─────────────────────────────────────────────────────────────┘`}</Diagram>

            <p className="text-text-secondary leading-relaxed">
              Each sub-query is focused. Each retrieves highly relevant chunks for that specific
              aspect. The results are then merged, deduplicated, and ranked.
            </p>
            <p className="text-text leading-relaxed mt-4 font-medium">
              And just like that, we retrieve exactly what a human researcher would find—but
              in parallel, in seconds.
            </p>

            {/* Knowledge Graph */}
            <h3 className="text-lg text-text mb-4 mt-12">
              Knowledge Graph Enhancement: Following the Authority Chain
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Here&apos;s something standard RAG completely misses: <span className="text-text">legal
              documents cite each other. A lot.</span>
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              A statute might be implemented by five administrative rules. Those rules might be
              interpreted by a dozen court cases. The cases might reference technical advisories
              for guidance.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              Margen builds this into a knowledge graph:
            </p>

            <Diagram caption="Authority hierarchy in the knowledge graph">{`                    ┌─────────────────┐
                    │   § 212.05      │
                    │   (Statute)     │
                    │   PRIMARY LAW   │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │ IMPLEMENTS   │ IMPLEMENTS   │
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │Rule 12A-1│   │Rule 12A-2│   │Rule 12A-3│
        │(Admin)   │   │(Admin)   │   │(Admin)   │
        └────┬─────┘   └────┬─────┘   └──────────┘
             │              │
             │ INTERPRETS   │ INTERPRETS
             ▼              ▼
        ┌──────────┐   ┌──────────┐
        │ Case A   │   │ Case B   │
        │(Court)   │   │(Court)   │
        └──────────┘   └──────────┘`}</Diagram>

            <p className="text-text-secondary leading-relaxed">
              When you retrieve § 212.05, Margen automatically expands to find rules that implement
              this statute, cases that interpret it, and advisory opinions that discuss it.
            </p>
            <p className="text-text-secondary leading-relaxed mt-4">
              This is how human researchers work. They don&apos;t stop at the first document they
              find—they trace the authority chain to build a complete picture.
            </p>
            <p className="text-text-secondary leading-relaxed mt-4">
              The graph also enables <span className="text-text">smart ranking</span>. Statutes outrank
              rules. Rules outrank advisories. Recent interpretations are weighted higher than old
              ones. The authority hierarchy is built into the retrieval.
            </p>

            {/* Reasoning Loop */}
            <h3 className="text-lg text-text mb-4 mt-12">
              The Reasoning Loop: Thinking, Not Just Searching
            </h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Here&apos;s where Margen diverges most dramatically from traditional RAG.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              Standard RAG is essentially: <code className="text-accent">search → generate → done</code>.
              One shot. No verification.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              Margen implements a reasoning loop:
            </p>

            <Diagram caption="The complete reasoning loop with self-correction">{`┌──────────────────────────────────────────────────────────────────┐
│                      REASONING LOOP                              │
│                                                                  │
│   ┌─────────┐                                                   │
│   │Decompose│ ─── Break query into focused sub-queries          │
│   └────┬────┘                                                   │
│        ▼                                                        │
│   ┌─────────┐                                                   │
│   │Retrieve │ ─── Hybrid search for each sub-query (parallel)   │
│   └────┬────┘                                                   │
│        ▼                                                        │
│   ┌─────────┐                                                   │
│   │ Expand  │ ─── Follow knowledge graph relationships          │
│   └────┬────┘                                                   │
│        ▼                                                        │
│   ┌─────────┐                                                   │
│   │  Score  │ ─── LLM evaluates relevance of each chunk         │
│   └────┬────┘                                                   │
│        ▼                                                        │
│   ┌─────────┐                                                   │
│   │ Filter  │ ─── Remove low-quality results                    │
│   └────┬────┘                                                   │
│        ▼                                                        │
│   ┌─────────┐                                                   │
│   │Synthesize│ ─── Generate answer with inline citations        │
│   └────┬────┘                                                   │
│        ▼                                                        │
│   ┌─────────┐      ┌─────────┐                                  │
│   │Validate │ ───▶ │ Correct │ ─── If issues found              │
│   └────┬────┘      └────┬────┘                                  │
│        │                │                                        │
│        ▼                ▼                                        │
│   ┌──────────────────────┐                                      │
│   │    Final Answer      │                                      │
│   │  (Verified, Cited)   │                                      │
│   └──────────────────────┘                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘`}</Diagram>

            <p className="text-text leading-relaxed mt-4 font-medium">
              The system doesn&apos;t just search and respond. It evaluates what it found. It checks
              if it needs more information. It validates its own output before delivering it.
            </p>
            <p className="text-text-secondary leading-relaxed mt-4">
              This is reasoning, not just retrieval.
            </p>
          </div>
        </section>

        {/* Hallucination Detection Section */}
        <section className="py-16 px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl text-text mb-6 pb-2 border-b border-border-02">
              Hallucination Detection &amp; Self-Correction
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              This is the heart of what makes Margen different.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              After generating an answer, the system doesn&apos;t just ship it. It validates every
              claim against the source documents:
            </p>

            <Diagram caption="Validation process for generated claims">{`Generated claim: "The standard sales tax rate is 6% per § 212.05(1)"

                    ↓ VALIDATION ↓

┌─────────────────────────────────────────────────────────────┐
│ 1. Extract citation: § 212.05(1)                            │
│                                                             │
│ 2. Find source chunk containing § 212.05(1)                 │
│                                                             │
│ 3. Verify claim against source text:                        │
│    Source says: "...tax is levied...at the rate of 6        │
│    percent of the sales price..."                           │
│    Claim says: "standard sales tax rate is 6%"              │
│                                                             │
│ 4. Result: ✓ VERIFIED - claim matches source                │
└─────────────────────────────────────────────────────────────┘`}</Diagram>

            <p className="text-text-secondary leading-relaxed mt-8 mb-4">
              But what happens when validation finds a problem? The system classifies hallucinations
              by type and severity:
            </p>

            {/* Hallucination Types Table */}
            <div className="overflow-x-auto my-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-02">
                    <th className="text-left py-3 pr-4 text-text font-medium">Type</th>
                    <th className="text-left py-3 pr-4 text-text font-medium">Description</th>
                    <th className="text-left py-3 text-text font-medium">What Margen Does</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border-01">
                    <td className="py-3 pr-4 text-text">Unsupported Claim</td>
                    <td className="py-3 pr-4">Statement not backed by sources</td>
                    <td className="py-3">Removes or qualifies</td>
                  </tr>
                  <tr className="border-b border-border-01">
                    <td className="py-3 pr-4 text-text">Fabricated Citation</td>
                    <td className="py-3 pr-4">Citation doesn&apos;t exist</td>
                    <td className="py-3">Removes entirely</td>
                  </tr>
                  <tr className="border-b border-border-01">
                    <td className="py-3 pr-4 text-text">Misquoted Text</td>
                    <td className="py-3 pr-4">Quote doesn&apos;t match source</td>
                    <td className="py-3">Corrects the quote</td>
                  </tr>
                  <tr className="border-b border-border-01">
                    <td className="py-3 pr-4 text-text">Misattributed</td>
                    <td className="py-3 pr-4">Right info, wrong source</td>
                    <td className="py-3">Fixes the attribution</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-text">Overgeneralization</td>
                    <td className="py-3 pr-4">Claim too broad for source</td>
                    <td className="py-3">Adds qualifiers</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-text-secondary leading-relaxed mb-4">
              Based on severity, the system routes to one of three paths:
            </p>

            <div className="grid md:grid-cols-3 gap-4 my-6">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-md p-4">
                <h4 className="text-emerald-400 font-medium mb-2">Accept</h4>
                <p className="text-sm text-text-secondary">
                  Minor issues or none—response is good
                </p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-4">
                <h4 className="text-amber-400 font-medium mb-2">Correct</h4>
                <p className="text-sm text-text-secondary">
                  Moderate issues—patch the specific problems
                </p>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-md p-4">
                <h4 className="text-rose-400 font-medium mb-2">Regenerate</h4>
                <p className="text-sm text-text-secondary">
                  Severe issues—start over with better guidance
                </p>
              </div>
            </div>

            <Callout type="info">
              <strong>The key insight:</strong> Hallucination detection isn&apos;t a post-hoc filter.
              It&apos;s integrated into the generation loop. The system catches its own mistakes
              before they reach the user.
            </Callout>
          </div>
        </section>

        {/* Caveats Section */}
        <section className="py-16 px-6 bg-card border-y border-border-01">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl text-text mb-6 pb-2 border-b border-border-02">
              Caveats &amp; Limitations
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              Of course, there are caveats.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-text font-medium mb-2">Latency</h3>
                <p className="text-text-secondary leading-relaxed">
                  Complex queries that trigger decomposition, graph expansion, and validation take
                  longer than a simple vector search. For intricate multi-part questions, response
                  times can reach tens of seconds. We&apos;re optimizing this, but accuracy comes first.
                </p>
              </div>

              <div>
                <h3 className="text-text font-medium mb-2">Coverage</h3>
                <p className="text-text-secondary leading-relaxed">
                  The system is only as good as its source documents. If a statute was recently
                  amended and we haven&apos;t ingested the update, the answer will be based on outdated
                  law. We maintain regular update cycles, but there&apos;s inherent lag.
                </p>
              </div>

              <div>
                <h3 className="text-text font-medium mb-2">Not Legal Advice</h3>
                <p className="text-text-secondary leading-relaxed">
                  Margen is a research tool, not a lawyer. It can find and synthesize regulatory
                  information with high accuracy, but it cannot replace professional legal counsel
                  for consequential decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-16 px-6">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl text-text mb-6 pb-2 border-b border-border-02">
              Results
            </h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              We&apos;ve evaluated Margen against a curated test set of regulatory questions spanning
              different difficulty levels and document types.
            </p>

            <div className="space-y-6">
              <div className="bg-card-02 border border-border-02 rounded-md p-5">
                <h3 className="text-text font-medium mb-3">Citation Accuracy</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    High precision: when Margen cites a source, that source overwhelmingly supports the claim
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    Improving recall: we&apos;re continuously expanding coverage to find more relevant sources
                  </li>
                </ul>
              </div>

              <div className="bg-card-02 border border-border-02 rounded-md p-5">
                <h3 className="text-text font-medium mb-3">Hallucination Rate</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    Zero fabricated citations in baseline testing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    Self-correction catches and fixes the vast majority of unsupported claims before they reach users
                  </li>
                </ul>
              </div>

              <div className="bg-card-02 border border-border-02 rounded-md p-5">
                <h3 className="text-text font-medium mb-3">Authority Awareness</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    Statutes consistently ranked above advisory opinions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    Implementation chains (statute → rule → case) correctly traced
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    Recent interpretations appropriately weighted
                  </li>
                </ul>
              </div>
            </div>


          </div>
        </section>

        {/* Conclusion Section */}
        <section className="py-16 px-6 bg-card border-y border-border-01">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl text-text mb-6 pb-2 border-b border-border-02">
              Conclusion
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              The future of regulatory AI isn&apos;t &quot;find similar text.&quot; It&apos;s about understanding
              relationships, verifying claims, and reasoning about what was found.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              Traditional RAG fails on regulatory documents because it treats legal research like
              web search. It doesn&apos;t understand that statutes outrank advisories. It doesn&apos;t trace
              citation networks. It doesn&apos;t verify its own outputs.
            </p>
            <p className="text-lg text-accent font-medium my-6">
              Margen does.
            </p>
            <p className="text-text-secondary leading-relaxed mb-4">
              By combining hybrid search, query decomposition, knowledge graphs, and self-correcting
              validation, we&apos;ve built a system that legal professionals can actually trust. Not
              because it&apos;s perfect—no AI system is—but because it knows when it doesn&apos;t know, it
              shows its sources, and it catches its own mistakes.
            </p>
            <p className="text-text leading-relaxed font-medium">
              And we&apos;re just getting started.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-text-secondary mb-6">
              Interested in learning more about Margen?
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg font-medium rounded-full hover:bg-accent/90 transition-colors"
            >
              Back to Home
              <span>→</span>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
