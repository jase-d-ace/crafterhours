INSERT INTO hobbies (id, name, emoji, goal, focus_areas, active, created_at)
VALUES
  (
    'hobby_guitar',
    'Guitar',
    '🎸',
    'Become a well-rounded blues/rock songwriter who can write, play, and feel the music — not just execute it technically',
    json_array(
      'Improvisation and soloing — building vocabulary over blues and pentatonic scales',
      'Songwriting and composition — writing original riffs, progressions, and full songs',
      'Music theory and chord construction — understanding why things sound the way they do',
      'Rhythm and strumming patterns — locking in groove and feel across blues and rock styles'
    ),
    1,
    datetime('now')
  ),
  (
    'hobby_writing',
    'Writing',
    '✍️',
    'Build a consistent writing practice that spans multiple forms — journaling, creative writing, poetry, and lyric writing — and get comfortable moving between them',
    json_array(
      'Raw journaling — stream of consciousness, processing thoughts and experiences',
      'Creative writing — fiction, scenes, character voice, narrative',
      'Poetry and lyric writing — compression, imagery, sound',
      'Essays and structured thinking — forming and defending ideas in long form'
    ),
    1,
    datetime('now')
  ),
  (
    'hobby_building',
    'Building',
    '🛠️',
    'Become fluent in agentic development — ship personal tools, deepen full-stack skills, and use every session to produce something real and committable',
    json_array(
      'Agentic workflows and Claude Code — practicing multi-session, tool-use, and orchestration patterns',
      'Full-stack features — building real product surfaces across Next.js, TypeScript, and Node',
      'Personal tools — scoped, completable builds that solve real friction in daily life'
    ),
    1,
    datetime('now')
  );