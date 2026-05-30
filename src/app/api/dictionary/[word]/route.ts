import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ word: string }> }
) {
  try {
    const { word } = await params;
    
    // Clean and validate the word parameter
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").toLowerCase().trim();
    if (!cleanWord) {
      return NextResponse.json({ error: 'Invalid word' }, { status: 400 });
    }

    // 1. Check local SQLite dictionary cache database
    const cached = db.prepare('SELECT definition_json FROM dictionary_cache WHERE word = ?').get(cleanWord) as any;
    if (cached) {
      try {
        const parsed = JSON.parse(cached.definition_json);
        return NextResponse.json(parsed);
      } catch (e) {
        // If cached data is corrupted, fall back to fetching
      }
    }

    // 2. Fetch from external API (https://api.dictionaryapi.dev/api/v2/entries/en/[word])
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data[0]) {
          const definitionObject = data[0];
          // Cache in local SQLite database
          db.prepare('INSERT OR REPLACE INTO dictionary_cache (word, definition_json) VALUES (?, ?)')
            .run(cleanWord, JSON.stringify(definitionObject));
          return NextResponse.json(definitionObject);
        }
      }
    } catch (fetchError) {
      console.error(`External fetch failed for word "${cleanWord}":`, fetchError);
    }

    // 3. Fallback: local definition fallback if both cache and remote lookups fail
    const fallbackDefinition = {
      word: cleanWord,
      meanings: [
        {
          partOfSpeech: 'definition',
          definitions: [
            {
              definition: `[Offline] Could not find or load definition for "${cleanWord}". Please check your connection.`
            }
          ]
        }
      ]
    };

    return NextResponse.json(fallbackDefinition);
  } catch (error: any) {
    console.error('Dictionary API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
