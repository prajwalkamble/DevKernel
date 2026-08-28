import type { ModuleDefinition } from "@/content/types";
import { renderingListsLesson } from "./lesson-1-rendering-lists";
import { indexKeyBugLesson } from "./lesson-2-index-key-bug";
import { controlledInputsLesson } from "./lesson-3-controlled-inputs";
import { inputTypesLesson } from "./lesson-4-input-types";
import { formSubmissionLesson } from "./lesson-5-form-submission";
import { validationLesson } from "./lesson-6-validation";
import { resetWithKeyLesson } from "./lesson-7-reset-with-key";
import { formLibrariesLesson } from "./lesson-8-form-libraries";

export const reactListsKeysFormsModule: ModuleDefinition = {
  id: "react-lists-forms",
  slug: "lists-keys-forms",
  title: "Lists, Keys & Forms",
  description:
    "Rendering collections correctly, and the controlled-input model that makes React forms behave differently from HTML ones.",
  order: 6,
  status: "available",
  lessons: [
    renderingListsLesson,
    indexKeyBugLesson,
    controlledInputsLesson,
    inputTypesLesson,
    formSubmissionLesson,
    validationLesson,
    resetWithKeyLesson,
    formLibrariesLesson,
  ],
};
