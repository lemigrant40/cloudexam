#!/usr/bin/env python3
"""
CloudExam Prep - PDF Text to JSON Parser
Converts Cloudera exam questions from raw PDF text to structured JSON format.
"""

import re
import json
import sys
from typing import List, Dict, Any

class ExamParser:
    def __init__(self):
        self.questions = []

    def parse_text(self, raw_text: str) -> List[Dict[str, Any]]:
        """
        Parse raw exam text into structured question objects.

        Expected format:
        Question: 1
        [Question text]
        A. [Option A]
        B. [Option B]
        C. [Option C]
        D. [Option D]
        Answer: A,B
        Explanation: [Explanation text]
        """

        # Split by "Question:" marker to get individual questions
        question_blocks = re.split(r'Question:\s*\d+', raw_text, flags=re.IGNORECASE)

        for idx, block in enumerate(question_blocks):
            if not block.strip():
                continue

            try:
                question_obj = self._parse_question_block(block, idx + 1)
                if question_obj:
                    self.questions.append(question_obj)
            except Exception as e:
                print(f"Warning: Error parsing question {idx + 1}: {str(e)}", file=sys.stderr)
                continue

        return self.questions

    def _parse_question_block(self, block: str, question_id: int) -> Dict[str, Any]:
        """Parse a single question block into structured format."""

        # Extract question text (everything before first option)
        options_match = re.search(r'\n\s*([A-Z])\.\s+', block)
        if not options_match:
            return None

        question_text = block[:options_match.start()].strip()

        # Extract options (A, B, C, D, etc.)
        options_section = block[options_match.start():]
        options = {}

        # Find all options (A. B. C. D. etc.)
        option_pattern = r'\n\s*([A-Z])\.\s+([^\n]+(?:\n(?!\s*[A-Z]\.\s+|\s*Answer:|\s*Explanation:)[^\n]+)*)'
        option_matches = re.finditer(option_pattern, options_section, re.MULTILINE)

        for match in option_matches:
            option_letter = match.group(1)
            option_text = match.group(2).strip()
            # Clean up extra whitespace
            option_text = re.sub(r'\s+', ' ', option_text)
            options[option_letter] = option_text

        # Extract correct answer(s)
        answer_match = re.search(r'Answer:\s*([A-Z,\s]+?)(?=\s*\n|Explanation:)', block, re.IGNORECASE)
        correct_answers = []
        if answer_match:
            answer_str = answer_match.group(1).strip()
            # Split by comma and clean - only keep single letters
            correct_answers = [a.strip() for a in re.findall(r'[A-Z]', answer_str)]

        # Extract explanation
        explanation = ""
        explanation_match = re.search(r'Explanation:\s*(.+?)(?=\n\s*Question:|Visit us at:|\Z)', block, re.IGNORECASE | re.DOTALL)
        if explanation_match:
            explanation = explanation_match.group(1).strip()
            # Remove URLs and promotional text
            explanation = re.sub(r'Visit us at:.*$', '', explanation, flags=re.IGNORECASE | re.DOTALL)
            # Clean up extra whitespace and newlines
            explanation = re.sub(r'\s+', ' ', explanation).strip()

        # Validate we have minimum required fields
        if not question_text or not options or not correct_answers:
            return None

        return {
            "id": question_id,
            "question": question_text,
            "options": options,
            "correctAnswers": correct_answers,
            "explanation": explanation
        }

    def save_to_json(self, output_file: str = "questions.json", pretty: bool = True):
        """Save parsed questions to JSON file."""
        with open(output_file, 'w', encoding='utf-8') as f:
            if pretty:
                json.dump(self.questions, f, indent=2, ensure_ascii=False)
            else:
                json.dump(self.questions, f, ensure_ascii=False)

        print(f"✅ Successfully saved {len(self.questions)} questions to {output_file}")

    def validate_questions(self) -> Dict[str, Any]:
        """Validate parsed questions and return statistics."""
        stats = {
            "total_questions": len(self.questions),
            "multi_answer_questions": 0,
            "missing_explanations": 0,
            "option_distribution": {}
        }

        for q in self.questions:
            # Count multi-answer questions
            if len(q["correctAnswers"]) > 1:
                stats["multi_answer_questions"] += 1

            # Count missing explanations
            if not q["explanation"]:
                stats["missing_explanations"] += 1

            # Count option distribution
            num_options = len(q["options"])
            stats["option_distribution"][num_options] = stats["option_distribution"].get(num_options, 0) + 1

        return stats


def main():
    """Main execution function."""
    print("=" * 60)
    print("CloudExam Prep - PDF Parser")
    print("=" * 60)
    print()

    # Check if input file is provided
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                raw_text = f.read()
        except FileNotFoundError:
            print(f"❌ Error: File '{input_file}' not found.")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error reading file: {str(e)}")
            sys.exit(1)
    else:
        # Interactive mode - ask user to paste text
        print("📋 Please paste the raw exam text below.")
        print("   Press Ctrl+D (Linux/Mac) or Ctrl+Z (Windows) when finished:")
        print("-" * 60)

        lines = []
        try:
            while True:
                line = input()
                lines.append(line)
        except EOFError:
            raw_text = '\n'.join(lines)
        except KeyboardInterrupt:
            print("\n\n❌ Operation cancelled.")
            sys.exit(0)

    if not raw_text.strip():
        print("❌ Error: No text provided.")
        sys.exit(1)

    # Parse the text
    print("\n🔄 Parsing questions...")
    parser = ExamParser()
    questions = parser.parse_text(raw_text)

    if not questions:
        print("❌ No questions were parsed. Please check the input format.")
        sys.exit(1)

    # Validate and show statistics
    stats = parser.validate_questions()
    print("\n📊 Parsing Statistics:")
    print(f"   Total questions: {stats['total_questions']}")
    print(f"   Multi-answer questions: {stats['multi_answer_questions']}")
    print(f"   Missing explanations: {stats['missing_explanations']}")
    print(f"   Option distribution: {stats['option_distribution']}")

    # Save to JSON
    output_file = sys.argv[2] if len(sys.argv) > 2 else "questions.json"
    print(f"\n💾 Saving to {output_file}...")
    parser.save_to_json(output_file)

    # Show sample question
    if questions:
        print("\n📝 Sample parsed question:")
        print(json.dumps(questions[0], indent=2, ensure_ascii=False))

    print("\n✨ Done! You can now use this file in CloudExam Prep.")


if __name__ == "__main__":
    main()
