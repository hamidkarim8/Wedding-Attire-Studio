export type PoseStyle = "sitting" | "standing";

export type BuildPromptParams = {
  peopleCount: 1 | 2;
  poseStyle: PoseStyle;
  /** Hex like #RRGGBB when selected */
  colorHex: string | null;
  /** Whether the user uploaded a background image (skip synthetic background text) */
  hasBackgroundImage: boolean;
};

const BASE =
  "Make sure the model(s) wear the full set of wedding attire exactly as shown in the product image, according to their gender. Faces are the main priority — maintain the original face(s) exactly as they appear in the model photo, including facial expression. Do not alter, enhance, or change the expression in any way. If the model is not showing teeth in the original, do not show teeth. Keep a natural, unedited look true to the original face.";

export function buildTryOnPrompt(params: BuildPromptParams): string {
  const parts: string[] = [BASE];

  if (params.peopleCount === 1) {
    parts.push(
      "There is one person in the model photo. Apply the attire to that single person only."
    );
  } else {
    parts.push(
      "There are two people in the model photo — a groom and a bride. Apply the appropriate wedding attire as in the product image to each person according to their gender."
    );
  }

  if (params.poseStyle === "sitting") {
    parts.push(
      "For the pose, the model(s) should be seated — if two people, seated side by side."
    );
  } else {
    parts.push(
      "For the pose, the model(s) should be standing — if two people, standing side by side."
    );
  }

  if (params.colorHex) {
    parts.push(
      `The attire color should be ${params.colorHex}. But keep the original design of the attire as it is according to the product image.`
    );
  }

  if (!params.hasBackgroundImage) {
    parts.push(
      "Set the scene on a beautiful white-themed 'pelamin kahwin' at a Malaysian-style wedding."
    );
  }

  return parts.join(" ");
}
