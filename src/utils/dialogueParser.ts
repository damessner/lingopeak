export interface DialogueLine {
  speaker: string;
  text: string;
}

/**
 * Parses structured transcript dialogue texts into speaker lines.
 * Supporting formats:
 *   Speaker Name: Text line content here.
 */
export function parseDialogue(transcript: string | null | undefined): DialogueLine[] {
  if (!transcript) return [];

  const lines = transcript.split('\n');
  const dialogue: DialogueLine[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check for "Speaker: Message" pattern
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0) {
      const speaker = trimmed.substring(0, colonIdx).trim();
      const text = trimmed.substring(colonIdx + 1).trim();
      dialogue.push({ speaker, text });
    } else {
      // Fallback if no speaker prefix is found on a line (treat as monologue or append to last speaker)
      if (dialogue.length > 0) {
        dialogue[dialogue.length - 1].text += ' ' + trimmed;
      } else {
        dialogue.push({ speaker: 'Speaker', text: trimmed });
      }
    }
  });

  return dialogue;
}
