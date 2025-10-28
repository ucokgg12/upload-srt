
import type { Subtitle } from '../types';

export const parseSrt = (srtContent: string): Subtitle[] => {
  const subtitles: Subtitle[] = [];
  // Normalize line endings
  const normalizedContent = srtContent.replace(/\r\n/g, '\n');
  const blocks = normalizedContent.split('\n\n');

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    const lines = trimmedBlock.split('\n');
    if (lines.length < 3) continue;

    const id = parseInt(lines[0], 10);
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

    if (isNaN(id) || !timeMatch) continue;

    const startTime = timeMatch[1];
    const endTime = timeMatch[2];
    const text = lines.slice(2).join('\n').trim();

    subtitles.push({ id, startTime, endTime, text });
  }

  return subtitles;
};
