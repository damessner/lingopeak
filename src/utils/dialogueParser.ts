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

    // Match "Speaker: Message" pattern — speaker must be one or more word chars at start of line
    const match = trimmed.match(/^([A-Za-z][\w\s]*[A-Za-z]):\s*(.+)$/);
    if (match) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      dialogue.push({ speaker, text });
    } else {
      // Fallback if no speaker prefix is found on a line
      if (dialogue.length > 0) {
        dialogue[dialogue.length - 1].text += ' ' + trimmed;
      } else {
        dialogue.push({ speaker: 'Speaker', text: trimmed });
      }
    }
  });

  return dialogue;
}
