let _program = null;
let _talkIndex = null; // talkId -> { talk, session, day, timeSlot }
let _sessionIndex = null; // sessionCode -> { session, day, timeSlot }

export async function loadProgram() {
  if (_program) return _program;
  const resp = await fetch(import.meta.env.BASE_URL + "data/program.json");
  _program = await resp.json();
  buildIndices();
  return _program;
}

function buildIndices() {
  _talkIndex = {};
  _sessionIndex = {};

  for (const day of _program.days) {
    for (const ts of day.timeSlots) {
      for (const session of ts.sessions) {
        _sessionIndex[session.code] = { session, day, timeSlot: ts };
        for (const talk of session.talks) {
          _talkIndex[talk.id] = { talk, session, day, timeSlot: ts };
        }
      }
    }
  }
}

export function getTalkInfo(talkId) {
  return _talkIndex?.[talkId] || null;
}

export function getSessionInfo(sessionCode) {
  return _sessionIndex?.[sessionCode] || null;
}

export function getAllTalks() {
  if (!_talkIndex) return [];
  return Object.values(_talkIndex);
}

export function searchProgram(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const results = [];

  for (const entry of Object.values(_talkIndex)) {
    const { talk, session } = entry;
    const searchText = [
      talk.title,
      ...(talk.speakers || []).map((s) => `${s.name} ${s.affiliation}`),
      talk.abstract || "",
      session.title,
    ]
      .join(" ")
      .toLowerCase();

    if (searchText.includes(q)) {
      results.push(entry);
    }
  }

  return results;
}
