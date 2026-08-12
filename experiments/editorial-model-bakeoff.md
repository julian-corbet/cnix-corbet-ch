# Local editorial model bake-off

Date: 2026-08-12

## Question

Can a recent local model perform cnix's private voice-and-compression pass
without becoming an author or publication authority?

The target is not conversational prose. It is writing that could appear in a
technical strategy memo, a restrained product brief, or a strong FOSS README.
The reader should be able to see mechanism, leverage, maturity, and adoption
friction without being asked to believe an unsupported forecast.

## Recent shortlist

- [Vinci Bozza 1.0](https://huggingface.co/simpledirect/Vinci-Bozza-1.0),
  released 9 July 2026, is a 9B Qwen 3.5 disposition tune for restraint,
  uncertainty, and voice. Its model card also reports regressions in strict
  instruction following and multi-turn task holding. Those are test targets, not
  footnotes.
- [Ornith 1.0 9B](https://huggingface.co/deepreinforce-ai/Ornith-1.0-9B),
  released 25 June 2026, targets agentic coding. It is relevant to future
  repository triage, but its stated purpose is less closely matched to an
  editorial pass.
- [North Mini Code](https://huggingface.co/CohereLabs/North-Mini-Code-1.0),
  released 9 June 2026, is a 30B-parameter, 3B-active mixture-of-experts model
  for agentic software engineering. It is not the first writing candidate.
- [Qwen 3.6 27B](https://huggingface.co/Qwen/Qwen3.6-27B) is a useful
  near-boundary reference, but its April release falls just outside this
  experiment's one-to-three-month window.

The first trial therefore adds Vinci Bozza Q5_K_M and compares it with models
already available through the same local broker. A shortlist is not a ranking;
vendor benchmarks are not evidence of cnix editorial quality.

## Fixed evidence fixture

> cnix records revision-addressed public evidence for a family of Nix projects.
> One reviewed project concept generates both the technical reference and a
> distinct landing page. The landing page may change presentation and emphasis
> but may not invent capabilities, maturity, compatibility, evidence, or
> customer claims. Each generated showcase includes canonical metadata,
> structured software data, a sitemap, a robots policy, and llms.txt. The
> complete artifact passes the cnix publication guardian. Screenshots remain
> disabled until the safe screenshot pipeline is complete.

Every candidate receives the same evidence and the same instruction: return one
paragraph of no more than 100 words, lead with the leverage and then the
mechanism, preserve qualifications, and add no facts or unsupported adjectives.
Reasoning is disabled where the model and serving template support it.

## Scorecard

The final editor checks:

1. **Claim preservation** — no supported material claim disappears.
2. **Claim containment** — no new capability, guarantee, maturity, or forecast
   appears.
3. **Register** — the prose suits technical decision-makers, founders,
   investors, and FOSS contributors without imitating sales copy.
4. **Compression** — the useful point arrives early and stays within the cap.
5. **Operational cost** — delivered text, completion tokens, warm response, and
   cold-load behaviour are recorded. A successful HTTP response with no final
   prose is a failure.

## Results

All timings below include the local broker path. The Vinci trials also passed
through the authenticated client endpoint used by applications.

| Model               | Cold result                                        | Editorial result                                                                                                                                   |
| ------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gemma 4 E2B Q8      | 11.6 s; 108 completion tokens                      | Fast, but opened with a broken sentence and introduced an unsupported causal guarantee.                                                            |
| Gemma 4 26B A4B IQ4 | about 40 s cold; 2.7 s warm; 113 completion tokens | Readable, but added "automates" and "ensures" claims and retained an assistant-like conclusion.                                                    |
| GPT-OSS 20B Q8      | 24.2 s cold                                        | Used 300, then 600, completion tokens for reasoning and returned no final prose under the tested caps.                                             |
| Qwen 3.5 35B A3B Q8 | still starting after six minutes                   | No text delivered before the trial was aborted; this quant is not a sensible frequent-pass default on the current host.                            |
| Vinci Bozza 1.0 Q5  | 15.5 s cold; 0.6–1.8 s warm                        | Best tested voice and strongest resistance to an unsupported marketing request, but unreliable at claim preservation and richer structured output. |

The first Vinci response produced three concise, supported sentences, then
echoed the requested register as if it were evidence. Tightening the prompt
removed that sentence but did not stop the model omitting the
revision-addressed-evidence claim. A deliberately adversarial request to call
the preview production-ready and claim suite-wide scale was handled well: the
model rejected both claims, named the evidence gap, and stayed within 57 words.

A simple claim-classification fixture returned exact valid JSON. A richer
claim-bound writing fixture returned malformed tool-like text instead of the
requested object. This is consistent with the model card's warning about strict
instruction-following regressions.

## Decision

Vinci Bozza is useful as a private, paragraph-level source of rewrite variants
and as a cheap challenge to inflated claims. It is not approved for claim
inventory, multi-page synthesis, final editing, publication approval, or privacy
review.

The production design should give the local model a small set of already
approved claims, retain the original beside every rewrite, and let a strong
editor accept, repair, or discard the candidate. Deterministic claim accounting
and the independent publication guardian remain separate stages. A successful
HTTP response with no final prose remains a failed editorial attempt.
