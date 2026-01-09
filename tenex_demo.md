# Tenex Build First Demo Script
## Margen: AI-Powered Tax Research Assistant

**Total Runtime:** ~10 minutes
**GitHub Repos:**
- Frontend: `github.com/s-jag/landing_margen_v2`
- RAG Backend: `github.com/s-jag/florida_tax_rag`

---

## PART 1: THE PROBLEM (0:00 - 1:30)

### [SCREEN: Show landing page or simple slide with problem statement]

**SCRIPT:**

> "Hi, I'm Sahith. Today I'm going to show you Margen—an AI-powered tax research assistant I built from the ground up.
>
> Let me start with why this problem matters.
>
> There are over 600,000 CPAs in the United States. Every single one of them spends a significant portion of their workday doing tax research—digging through thousands of pages of statutes, administrative rules, court cases, and technical guidance to answer client questions.
>
> The typical tax research workflow looks like this: A client calls and asks, 'Can I deduct my home office?' The CPA opens multiple browser tabs—IRS publications, state tax codes, maybe Westlaw or CCH. They spend 30 minutes to 2 hours piecing together an answer from fragmented sources. Then they have to cite their work for audit protection.
>
> This is a $2 billion market. Thomson Reuters and Wolters Kluwer dominate it with products that are essentially glorified search engines built on 30-year-old architectures. They charge $5,000 to $15,000 per seat annually.
>
> The transformation opportunity here is massive: What if a CPA could get an accurate, citation-backed answer in 2 minutes instead of 2 hours? What if every claim was automatically traced to its authoritative source?
>
> That's what I built."

---

## PART 2: THE USERS & USE CASE (1:30 - 2:30)

### [SCREEN: Show the chat interface with a client selected]

**SCRIPT:**

> "My target users are tax professionals—CPAs, Enrolled Agents, and tax attorneys at small to mid-size firms. These are practitioners who handle 200 to 500 returns per year and can't afford enterprise research subscriptions.
>
> The core use case is client-specific tax research. When a CPA is preparing a return and hits a question—like 'Does Florida charge sales tax on SaaS products?' or 'What's the home office deduction calculation for this client?'—they need an answer that's accurate, citable, and fast.
>
> What makes this different from ChatGPT? Three things:
>
> First, **grounding in authoritative sources**. Every response is generated from actual statutes, rules, and case law—not training data that might be outdated or hallucinated.
>
> Second, **citation extraction**. Every claim maps to a specific section—Florida Statute 212.05, Rule 12A-1.001. This is non-negotiable for audit defense.
>
> Third, **client context**. The system knows this client's filing status, income level, and documents. It's not generic advice—it's specific to the engagement."

---

## PART 3: LIVE DEMO - THE PRODUCT (2:30 - 5:00)

### [SCREEN: Live demo of the chat interface]

**SCRIPT:**

> "Let me show you the product in action.
>
> This is the Margen interface. Three-panel layout: clients and threads on the left, the chat in the center, and client context on the right.
>
> I've got a client loaded—you can see their filing status, tax year, and documents. The system extracted data from their uploaded W-2s and 1099s automatically using Claude's vision capabilities.

### [ACTION: Type a query - "What is the Florida sales tax rate on software consulting services?"]

> "Let me ask a real question: 'What is the Florida sales tax rate on software consulting services?'
>
> Watch what happens. You'll see the reasoning steps appear in real-time—this is the RAG pipeline executing. First, query decomposition breaks this into sub-queries. Then hybrid retrieval finds relevant chunks. Graph expansion pulls in related rules and cases. Finally, synthesis generates the answer.

### [SCREEN: Show the streaming response with citations appearing]

> "The response streams in with inline citations. Every claim links back to Florida Statute Chapter 212 or Administrative Code 12A. These aren't hallucinated references—they're validated against the actual source documents in my vector store.
>
> See these source chips? Each one shows the relevance score. I can click to drill into the full text. This is the audit trail a CPA needs.

### [ACTION: Click on a citation to show the source modal]

> "When I click a citation, I get the full source context. The chunk that was retrieved, the statute section, the effective date. Complete traceability.

### [ACTION: Show document upload - drag a PDF]

> "Now let me show document upload. I can drag a PDF directly into the chat—maybe a client's prior return or a 1099. The system validates file type and size, then stores it against this client's profile. I can trigger AI extraction to pull structured data from it."

---

## PART 4: TECHNICAL DEEP DIVE - THE RAG ARCHITECTURE (5:00 - 7:30)

### [SCREEN: Show architecture diagram or switch to code/terminal]

**SCRIPT:**

> "Now let me show you what's under the hood, because this is where it gets interesting.
>
> The backend is a **Hybrid Agentic GraphRAG system**. That's a mouthful, so let me break it down.

### [SCREEN: Show the retrieval analysis or Weaviate config]

> "**Hybrid Retrieval** means I'm combining vector search with keyword search. I'm using Weaviate as my vector store with Voyage AI's `voyage-law-2` embeddings—these are 1,024-dimensional embeddings trained specifically on legal text.
>
> Here's a key insight I discovered: For legal queries, **keyword search outperforms pure vector search**. When a CPA asks about 'Section 212.05', they need exact term matching, not semantic similarity.
>
> I ran experiments across different alpha values—alpha controls the blend between vector and keyword. Pure vector gave me an MRR of 0.25. Pure keyword: 0.41. But the sweet spot? **Alpha 0.25**—heavily keyword-weighted hybrid—hit 0.61 MRR. That's a 2.4x improvement over pure vector.
>
> This is a production insight most RAG tutorials miss.

### [SCREEN: Show Neo4j or citation graph visualization]

> "**GraphRAG** means I'm using a knowledge graph—Neo4j—to model the citation network between legal documents. Florida Statutes cite other statutes. Administrative rules implement statutes. Court cases interpret both.
>
> I have 1,152 documents with 1,126 citation edges. When I retrieve a statute, graph expansion traverses to find implementing rules and relevant case law. This is how I get comprehensive answers, not just keyword matches.

### [SCREEN: Show LangGraph workflow or agent code]

> "**Agentic** means this isn't a single prompt-and-retrieve pipeline. I built a 9-node LangGraph workflow with conditional routing and self-correction.
>
> The flow is: decompose the query into sub-queries, retrieve in parallel, expand via graph, score relevance with an LLM, filter low-quality chunks, check temporal validity, synthesize the answer, then **validate for hallucinations**.
>
> That validation step is critical. I'm using Claude Haiku as a fast judge to check if any claims in the response aren't supported by the retrieved sources. If hallucination severity is high, the system **automatically regenerates**. If it's moderate, it **self-corrects** by rewriting the problematic sections.
>
> In my baseline evaluation, I achieved **zero hallucinations** across the test set. High precision on citations. That's the bar for legal AI."

---

## PART 5: KEY TRADE-OFFS & DECISIONS (7:30 - 8:30)

### [SCREEN: Can stay on architecture or show code snippets]

**SCRIPT:**

> "Let me talk about trade-offs, because every system has them.
>
> **Trade-off 1: Latency vs. Accuracy.** My full pipeline takes 30 to 60 seconds for complex queries. That's slower than a simple RAG, but I'm doing query decomposition, parallel retrieval, graph expansion, LLM scoring, and hallucination validation. For tax research, accuracy matters more than speed—a wrong answer can cost a client thousands in penalties. But I've added Redis caching with a 30% hit rate on repeated queries, bringing cached responses under 10ms.
>
> **Trade-off 2: Embedding model choice.** I chose Voyage's legal-specific embeddings over OpenAI's generic ada-002. They're more expensive per token, but the domain specificity matters. Legal language is precise—'shall' vs 'may' has legal significance that generic models miss.
>
> **Trade-off 3: Build vs. Buy on the graph.** I could have used a managed knowledge graph service, but I needed custom traversal logic for citation chains. Neo4j gave me the flexibility to model statute-to-rule-to-case relationships with typed edges: `IMPLEMENTS`, `INTERPRETS`, `CITES`, `SUPERSEDES`.
>
> **Trade-off 4: Streaming UX.** I implemented Server-Sent Events to stream responses in real-time. This adds frontend complexity—managing partial state, handling reconnection—but the UX improvement is significant. Users see progress, not a loading spinner."

---

## PART 6: IMPACT & ROI (8:30 - 9:15)

### [SCREEN: Show metrics or back to landing page]

**SCRIPT:**

> "Let's talk impact.
>
> **Time savings:** A CPA doing 300 returns per year might spend 15 minutes of research per return. That's 75 hours annually. If Margen cuts that to 3 minutes average, we save 60 hours per CPA per year. At $150/hour billing rate, that's **$9,000 in recovered billable time per seat**.
>
> **Accuracy improvement:** The hallucination detection and citation validation mean fewer errors. One incorrect tax position can cost a client $10,000+ in penalties and interest. Audit protection has real dollar value.
>
> **Accessibility:** Small firms currently can't afford $10K/year for Westlaw or CCH. A $100-200/month AI tool democratizes access to research capabilities that were previously enterprise-only.
>
> **The market:** 600,000 CPAs, 50,000 tax attorneys, countless EAs and bookkeepers. Even capturing 1% of that market at $150/month is a $10M+ ARR opportunity."

---

## PART 7: CLOSING & WHAT'S NEXT (9:15 - 10:00)

### [SCREEN: Show the product one more time or GitHub repos]

**SCRIPT:**

> "To summarize what I built:
>
> A **production-grade AI tax research assistant** with:
> - Hybrid agentic GraphRAG retrieval
> - 1,152 Florida tax documents with citation graph
> - Real-time streaming with reasoning transparency
> - Hallucination detection and self-correction
> - Client context management with document extraction
> - Full API with rate limiting, caching, and observability
>
> The frontend is Next.js 14 with TypeScript, deployed on Vercel. The backend is Python with FastAPI, Weaviate, Neo4j, and Redis. The LLM layer uses Claude for generation and validation.
>
> What's next? Expanding to all 50 states. The architecture is designed for multi-state—each state gets its own document corpus and retrieval pipeline, but shares the same agentic workflow. I've already built the provider registry pattern to route queries by jurisdiction.
>
> This is the kind of AI system that creates real transformation—not a chatbot wrapper, but a domain-specific tool that understands legal hierarchy, validates its outputs, and gives professionals the confidence to trust it.
>
> The code is in my GitHub repos linked in the description. Every commit is mine—you can trace the evolution from data ingestion to production deployment.
>
> Thanks for watching. I'm excited to discuss this further with the Tenex team."

---

## APPENDIX: VISUAL CUES & TIMING

| Timestamp | Screen Content | Key Talking Point |
|-----------|---------------|-------------------|
| 0:00-1:30 | Landing page / Problem slide | 600K CPAs, $2B market, 2hrs→2min |
| 1:30-2:30 | Chat interface overview | Users: CPAs, EAs, attorneys; Use case: client research |
| 2:30-3:30 | Type query, show streaming | Real-time reasoning steps |
| 3:30-4:30 | Show citations, drill into source | Audit trail, traceability |
| 4:30-5:00 | Document upload demo | Drag-drop, extraction |
| 5:00-6:00 | Retrieval analysis / alpha tuning | Keyword-weighted hybrid insight |
| 6:00-6:45 | Neo4j / citation graph | Graph expansion, 1,126 edges |
| 6:45-7:30 | LangGraph workflow | 9 nodes, hallucination detection |
| 7:30-8:30 | Architecture discussion | 4 key trade-offs |
| 8:30-9:15 | Metrics / ROI | $9K/seat savings, market size |
| 9:15-10:00 | Closing, GitHub | Multi-state expansion, call to action |

---

## APPENDIX: TECHNICAL STATS TO MENTION

**Data Pipeline:**
- 1,152 documents (742 statutes, 101 rules, 308 cases, 1 TAA)
- 3,022 chunks (hierarchical parent/child)
- 1,126 citation graph edges
- voyage-law-2 embeddings (1,024 dimensions)

**Retrieval Performance:**
- Optimal alpha: 0.25 (keyword-weighted)
- MRR improvement: 0.253 → 0.613 (2.4x)
- Hybrid fusion beats both pure approaches

**System Architecture:**
- 9-node LangGraph workflow
- 6 hallucination types detected
- Self-correction with confidence penalties
- Redis cache: 30%+ hit rate, <10ms cached responses

**Evaluation Results:**
- Citation precision: 85-90%
- Hallucinations: 0 in baseline
- Avg latency: 35-70s (complex queries)

---

## APPENDIX: POTENTIAL Q&A PREP

**Q: Why Florida specifically?**
> "Florida has no state income tax but complex sales tax rules—it's a good test case for demonstrating nuanced legal research. The architecture generalizes to any state; I've already built the provider registry pattern for multi-state routing."

**Q: How do you handle outdated laws?**
> "Every document has effective dates. The temporal validity check in my pipeline filters out superseded provisions. The citation graph tracks `SUPERSEDES` relationships so I can warn users about outdated guidance."

**Q: What's your cost per query?**
> "Roughly $0.02-0.05 per query depending on complexity—mostly Claude API costs. With caching, repeated queries are essentially free. At $150/month pricing, I need 3,000-7,500 queries to break even, which is about 10-25 queries per user per day."

**Q: Why not use GPT-4 with web search?**
> "Three reasons: First, web search doesn't guarantee authoritative sources—you might get a blog post instead of the actual statute. Second, I need structured citations that map to specific sections, not URLs. Third, I need to control the retrieval pipeline for consistency and auditability."

**Q: How do you ensure the citations are real?**
> "Every citation is validated against chunks in my vector store. The hallucination detector specifically looks for 'fabricated_citation' as one of six hallucination types. If I can't trace a claim to a source document, it gets flagged."

---

## VIDEO DESCRIPTION TEMPLATE

```
Margen: AI-Powered Tax Research Assistant

A production-grade Hybrid Agentic GraphRAG system for tax professionals.

GitHub Repos:
- Frontend: https://github.com/s-jag/landing_margen_v2
- RAG Backend: https://github.com/s-jag/florida_tax_rag

Live Demo: [YOUR VERCEL URL]

Tech Stack:
- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: Python, FastAPI, LangGraph
- Vector Store: Weaviate + Voyage AI voyage-law-2
- Knowledge Graph: Neo4j
- Cache: Redis
- LLM: Claude (Anthropic)

Built for the Tenex Build First challenge.
```

---

## RECORDING TIPS

1. **Practice the demo flow** - Know exactly which query you'll type and what response to expect
2. **Pre-load the chat** - Have a client with documents already uploaded
3. **Test streaming** - Make sure the connection is stable for live demo
4. **Have backup screenshots** - In case something fails live
5. **Speak slower than natural** - Technical content needs processing time
6. **Show, don't just tell** - Every claim should have visual evidence
7. **End strong** - The last 30 seconds should be memorable
