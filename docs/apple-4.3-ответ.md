# Ответ App Review: 4.3 Spam и 4.2.6 (2026-10-07)

Черновик ответа в Resolution Center. Сборку повторно **не отправлять**: Apple просит либо существенно изменить приложение, либо ответить на вопросы.

Места `[ЗАПОЛНИТЬ: …]` знает только пользователь. Выдумывать их нельзя: Apple сверяет ответы с аккаунтом и с TestFlight.

---

Hello,

Thank you for the review. We believe Madame Poly meets guidelines 4.3(a), 4.3(b) and 4.2.6, so we are replying instead of resubmitting. Our answers follow.

**1. What the app does and the problem it solves**

Madame Poly is a spoken-conversation tutor. The learner talks out loud with "Poly" in the language they are learning. Poly answers by voice, keeps the conversation going at the learner's CEFR level (A1–C2), and corrects every mistake in the learner's own sentence. Each correction names the grammar rule and can be expanded into a full explanation.

The problem it solves: most learners can read and do exercises but freeze when they have to speak. They have nobody to talk to who is patient, available at any hour, and who will point out their mistakes without breaking the conversation. Madame Poly gives them that speaking practice and then turns their own mistakes into study material:

- **Mistakes become practice.** Errors from conversations, writing tasks and exams are grouped by type (prepositions, verb government, tenses, accents…) and become personal drills ("From your mistakes").
- **Grammar course per language.** A unit-by-unit syllabus for each language, aligned with standard textbooks and exam syllabi. Every unit opens a generated lesson with a rule, a table, typical pitfalls and ten exercises.
- **Exam rehearsal.** Spoken B1/B2 exam simulations modelled on each language's real certificate (for example Goethe, DELE, DELF, Celpe-Bras, CCE), with examiner-style turns and a written report.
- **Placement by conversation.** A five-minute talk with Poly determines the learner's level instead of a multiple-choice test.
- **Daily plan ("Today").** One screen with what to do today (talk, review words, drill, grammar unit) and the week's progress.
- **Also included:** listening, writing tasks with corrections, vocabulary lists with flashcards and spaced review, homework generated from the session's mistakes, and a notebook exported as PDF.

**2. Intended users**

Adults and older teenagers who already know some of a language (A2–C1) and need to *speak* it: people relocating for work or family, migrants preparing for residency and citizenship language exams (for example the Czech A2 exam for permanent residence), university applicants preparing for B1/B2 certificates, and professionals who need conversational confidence. The interface is available in 13 languages, so a learner can study, for example, Dutch with explanations in Ukrainian.

**3. The gap it fills**

- **Languages that speaking apps rarely cover.** Twelve target languages, each with its own syllabus and exam: English, German, French, Spanish, Italian, European Portuguese, Brazilian Portuguese (as a separate norm), Ukrainian, Dutch, Polish, Romanian and Czech. AI speaking tutors usually concentrate on English. Course apps for Czech, Romanian, Polish or Ukrainian rarely offer spoken conversation with corrections.
- **Speaking and grammar are connected.** Conversation apps rarely tie corrections to a structured grammar syllabus, and grammar apps rarely let you speak. In Madame Poly a mistake made in conversation leads to the matching rule, a lesson and a drill.
- **Exam-specific speaking practice** for the certificates people actually need for residency, study and work, rather than generic chat.
- **No streak games.** Practice is open-ended conversation, not tapping prepared answers.

**4. Beta testing**

[ЗАПОЛНИТЬ: кто тестировал (сколько человек, какие языки и платформы), как долго (TestFlight / Google Play internal testing / APK) и 2–3 реальных отзыва с тем, что после них изменилось.]

Candidate changes we believe came from testing. Keep only the ones that really followed feedback:
- the conversation was stopping on short pauses → a manual "I'm done speaking" mode was added next to automatic end-of-turn detection;
- corrections were attached to older sentences → corrections are now shown only for errors in the learner's latest sentence;
- the pause before Poly answered → Poly now starts speaking as soon as her reply is ready, and corrections appear while she talks;
- testers asked to practise their recurring mistakes → personal drills built from their own errors.

**5. Standalone or part of a suite**

Madame Poly is a standalone product. [ЗАПОЛНИТЬ: перечислить другие приложения аккаунта.] Our account also publishes [ЗАПОЛНИТЬ: например «Conquistador» (испанская грамматика, офлайн-курс) и «Wortkraft» (немецкая грамматика A2)]. Those apps are fixed, hand-written grammar courses for one language and level. They work offline, without speech or AI conversation. Madame Poly has no fixed course content: its core is live spoken conversation and feedback generated per learner, across twelve languages. The audiences overlap only in that both learn languages; what each app does is different. [Убрать абзац, если в аккаунте нет других языковых приложений.]

**6. Could it be an in-app purchase in another app?**

No. [ЗАПОЛНИТЬ при наличии других приложений:] Those apps are small offline grammar workbooks with a one-time purchase. Madame Poly needs a microphone, speech recognition, server-side AI, an account and a subscription. Adding these to an offline workbook would change that product completely, and Madame Poly's grammar is only one of eight sections.

**7. Code or assets shared with other apps on the account**

No code, frameworks or binary assets are shared. Madame Poly is a separate codebase (React Native / Expo) with its own server (Firebase Cloud Functions). The only overlap is that the list of grammar-topic titles for Spanish and for German A1–A2 follows the same textbook tables of contents as our grammar apps. Madame Poly stores only those titles. Lessons and exercises are generated per learner.

**8. Code shared with third-party apps**

No. Beyond standard frameworks and services (Expo/React Native, Firebase, RevenueCat, the Anthropic and OpenAI APIs for language and speech), the app's code, prompts, syllabi and interface are our own work.

**9. Built for a client or from a template?**

No. Kuka Lab conceived, designed, wrote and owns Madame Poly. No template, app builder or app-generation service was used. The content (syllabi, scenarios, exam formats, persona) is ours. The app is published under the developer account of its owner.

Kind regards,
[ЗАПОЛНИТЬ: имя], Kuka Lab
