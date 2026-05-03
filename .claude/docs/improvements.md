# Improvements Log

Notable technical decisions and optimizations made during development.

---

## Pinyin: LLM → client-side libraries

**Problem:** Groq generated pinyin per line (inconsistent word grouping, polyphonic errors) plus a separate title pinyin API call per song.

**Solution:** `pinyin-pro` (full-line context for accurate polyphonics) + `segmentit` (word boundaries). Entry point: `src/lib/pinyin.ts → linePinyin()`.

**Accuracy gain:** LLM misread polyphonics without sentence context — e.g. `忘了` → `wàng liǎo` ❌ vs correct `wàng le`. Library is deterministic.

**Token savings per workflow:** ~340 tokens (~23% output reduction per generate call) + 1 entire API call eliminated.  
Cost: ~$0.0002/workflow → ~$0.24/1,000 songs at Groq `llama-3.3-70b-versatile` rates.
