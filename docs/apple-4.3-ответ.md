# Ответ App Review: 4.3 Spam и 4.2.6 (2026-10-07)

Черновик ответа в Resolution Center. Сборку повторно **не отправлять**: Apple просит либо существенно изменить приложение, либо ответить на вопросы.

Заполнено 2026-10-07 по данным пользователя: на аккаунте ещё Conquistador A2, Conquistador B1–B2 и Wortkraft A2; в TestFlight внутренняя группа из двух человек (14 сборок; 46 и 16 сеансов). Примеры в п. 4 взяты из истории исправлений по итогам проверки на iPhone. Перед отправкой проверьте, что каждый пример действительно был, и при желании пометьте, какие заметила Варвара.

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

We tested through TestFlight with an internal group of two testers, the developer and a second tester. Each used their own iPhone (iPhone 14 Pro and iPhone 14 Pro Max). Over 14 builds there were 62 sessions in total. On Android, test builds were installed directly on devices. We are a small studio and did not run a public beta. Before resubmitting we will gladly open external TestFlight testing if you consider it necessary.

Problems found in testing and fixed before submission:

- **Poly did not hear the learner on iPhone.** Automatic end-of-turn detection used fixed volume thresholds that worked on one microphone and failed on another. Turn detection now adapts to each voice and room, room noise is no longer mistaken for speech, and a manual mode was added: the learner taps when finished, so the microphone opens only when they are ready.
- **Replies were sometimes lost silently.** When the device reported no input level, or the model returned an empty reply, the turn disappeared without a message. Now the learner is told that Poly did not hear them and the conversation continues.
- **Corrections pointed at old sentences.** Testers saw corrections for mistakes made several turns earlier under their newest sentence. Corrections are now shown only for errors in the learner's latest sentence.
- **The pause before Poly answered was too long,** especially after sentences with many mistakes. Poly now starts speaking as soon as her reply is ready, and the corrections appear while she is talking.
- **The writing field was hidden by the keyboard** on smaller screens. Fixed.
- **The learner wanted to practise their recurring mistakes.** This led to personal drills built from their own errors and to the "Today" plan that suggests them.

**5. Standalone or part of a suite**

Madame Poly is a standalone product. Our account also publishes three grammar textbook apps: **Conquistador A2** and **Conquistador B1–B2** (Spanish grammar) and **Wortkraft A2** (German grammar). Each is a fixed, hand-written grammar course with exam preparation for one language at one level. They are digital workbooks: authored rules and exercises, used offline. They have no conversation, no speech, no AI, and no analysis of the learner's own mistakes.

Madame Poly has no fixed course content. Its core is live spoken conversation with a voice tutor across twelve languages, with feedback, lessons, drills and exam rehearsals generated for each learner from what they actually say. A learner can use a grammar workbook and Madame Poly side by side: one teaches the rules of one language, the other makes them speak.

**6. Could it be an in-app purchase in another app?**

No. Conquistador and Wortkraft are offline workbooks for a single language and level. Madame Poly needs a microphone, speech recognition and synthesis, server-side AI, a user account and a subscription with a monthly usage budget, and covers twelve languages. Adding it to a Spanish or German workbook would turn that workbook into a different product and confine a multilingual tutor to one language. The reverse does not work either: the workbooks are complete, authored courses, which Madame Poly deliberately does not contain.

**7. Code or assets shared with other apps on the account**

No code, frameworks or binary assets are shared. Madame Poly is a separate codebase (React Native / Expo) with its own server (Firebase Cloud Functions). The only overlap is that the list of grammar-topic titles for Spanish and for German A1–A2 follows the same textbook tables of contents as our grammar apps. Madame Poly stores only those titles. Lessons and exercises are generated per learner.

**8. Code shared with third-party apps**

No. Beyond standard frameworks and services (Expo/React Native, Firebase, RevenueCat, the Anthropic and OpenAI APIs for language and speech), the app's code, prompts, syllabi and interface are our own work.

**9. Built for a client or from a template?**

No. Kuka Lab conceived, designed, wrote and owns Madame Poly. No template, app builder or app-generation service was used. The content (syllabi, scenarios, exam formats, persona) is ours. The app is published under the developer account of its owner.

Kind regards,
Mykhaylo Osypov, Kuka Lab
