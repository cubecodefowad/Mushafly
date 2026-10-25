import { gradeTone } from "@/data/hadith-format";
import type { HadithGrade } from "@/types/hadith";

/**
 * The gradings a dataset publishes, exactly as published. Hadithly does not
 * grade narrations itself: each chip names the scholar whose verdict it is, so
 * two chips may disagree without the page taking a side.
 */
export function GradeChips({ grades }: { grades: HadithGrade[] }) {
  if (!grades.length) return null;

  return (
    <ul aria-label="Grading" className="mt-3 flex flex-wrap items-center gap-1.5">
      {grades.map((grade) => (
        <li
          key={`${grade.scholar}-${grade.grade}`}
          className="grade-chip"
          data-tone={gradeTone(grade.grade)}
        >
          <span className="sr-only">Graded </span>
          <span className="grade-chip-value">{grade.grade}</span>
          <span aria-hidden>·</span>
          <span className="sr-only"> by </span>
          <span className="grade-chip-scholar">{grade.scholar}</span>
        </li>
      ))}
    </ul>
  );
}
