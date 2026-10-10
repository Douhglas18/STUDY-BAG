Copy everything below as your README:

```markdown
# AI Exam Question Prediction Assistant

An AI assistant that helps students prepare for upcoming exams by analyzing past papers, syllabi, notes, assignments, and model questions. It identifies recurring topics and question patterns, then suggests a short, evidence-based list of possible exam questions.

## Features

- Analyzes previous question papers and study materials
- Identifies repeated, frequently tested, and recently skipped topics
- Considers syllabus coverage, marks distribution, question format, and difficulty
- Predicts possible questions, including reworded versions of recurring concepts
- Ranks predictions by confidence: Very High, High, Medium, or Low
- Gives brief reasons for high-confidence predictions
- Updates predictions when new papers or materials are provided

## How to Use

1. Provide the subject syllabus and module details.
2. Add previous exam papers, notes, assignments, or model papers.
3. Ask for predictions for a specific exam, module, or mark range.
4. Review the predicted questions and their confidence levels.
5. Use the final study-priority list to guide revision.

## How It Works

The assistant reviews the materials you provide and builds a picture of what the exam is likely to emphasize:

1. **Extracts the content** — identifies topics, questions, modules, marks, and question formats in the supplied papers and study materials.
2. **Checks the syllabus** — maps those topics to the syllabus so predictions stay within the course content.
3. **Looks for patterns** — notes repeated questions, recurring concepts, topic frequency, recent appearances or gaps, and marks distribution.
4. **Creates possible questions** — turns the strongest patterns into exam-style questions, including reasonable rewordings of previously tested concepts.
5. **Ranks the predictions** — assigns a confidence level based on how much supporting evidence is available.
6. **Explains the evidence** — gives a short reason for stronger predictions and highlights what to study first.

The predictions depend on the quality and amount of material provided. More complete syllabus information and several past papers usually give the assistant better evidence. It may still miss topics or predict questions that do not appear on the exam.

## Prediction Format

Predictions are grouped by priority:

- **🔥 VERY HIGH PRIORITY** — strongest evidence from repeated patterns or syllabus importance
- **🟠 HIGH PRIORITY** — solid evidence, with some uncertainty
- **🟡 BACKUP** — plausible questions with weaker or more limited evidence

Each prediction should include the likely module, marks, question format, confidence, and a short reason where the evidence supports it.

## Recommended Materials

For more useful predictions, provide:

- The complete syllabus and module structure
- Multiple years of question papers, if available
- Marks and section patterns
- Class notes, assignments, and model papers
- Any known changes to the exam format

## Important Note

Predictions are study guidance, not guarantees. Actual exam questions may differ. The assistant should state when the available materials are insufficient and should not invent evidence or claim that a question is certain.
```
