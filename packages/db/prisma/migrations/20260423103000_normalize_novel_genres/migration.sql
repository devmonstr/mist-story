UPDATE "Novel"
SET "genre" = CASE
  WHEN lower(trim("genre")) = 'action' THEN 'action'
  WHEN lower(trim("genre")) = 'adventure' THEN 'adventure'
  WHEN lower(trim("genre")) = 'comedy' THEN 'comedy'
  WHEN lower(trim("genre")) = 'drama' THEN 'drama'
  WHEN lower(trim("genre")) = 'fantasy' THEN 'fantasy'
  WHEN lower(trim("genre")) = 'romance' THEN 'romance'
  WHEN lower(trim("genre")) IN ('sci-fi', 'sci fi', 'science-fiction', 'science fiction') THEN 'sci-fi'
  WHEN lower(trim("genre")) = 'horror' THEN 'horror'
  WHEN lower(trim("genre")) IN ('mystery', 'mystery & thriller', 'mystery-thriller') THEN 'mystery'
  WHEN lower(trim("genre")) = 'thriller' THEN 'thriller'
  WHEN lower(trim("genre")) = 'supernatural' THEN 'supernatural'
  WHEN lower(trim("genre")) IN ('historical', 'historical-fiction', 'historical fiction') THEN 'historical'
  WHEN lower(trim("genre")) IN ('slice-of-life', 'slice of life') THEN 'slice-of-life'
  WHEN lower(trim("genre")) = 'sports' THEN 'sports'
  WHEN lower(trim("genre")) = 'psychological' THEN 'psychological'
  WHEN lower(trim("genre")) IN ('martial-arts', 'martial arts') THEN 'martial-arts'
  WHEN lower(trim("genre")) IN ('school-life', 'school life') THEN 'school-life'
  WHEN lower(trim("genre")) = 'wuxia' THEN 'wuxia'
  WHEN lower(trim("genre")) = 'xianxia' THEN 'xianxia'
  WHEN lower(trim("genre")) = 'xuanhuan' THEN 'xuanhuan'
  WHEN lower(trim("genre")) = 'cultivation' THEN 'cultivation'
  WHEN lower(trim("genre")) = 'isekai' THEN 'isekai'
  WHEN lower(trim("genre")) = 'shounen' THEN 'shounen'
  WHEN lower(trim("genre")) = 'shoujo' THEN 'shoujo'
  WHEN lower(trim("genre")) = 'seinen' THEN 'seinen'
  WHEN lower(trim("genre")) = 'josei' THEN 'josei'
  WHEN lower(trim("genre")) IN ('bl', 'boys love', 'boys'' love') THEN 'bl'
  WHEN lower(trim("genre")) IN ('gl', 'girls love', 'girls'' love') THEN 'gl'
  WHEN lower(trim("genre")) = 'mature' THEN 'mature'
  ELSE "genre"
END
WHERE lower(trim("genre")) IN (
  'action',
  'adventure',
  'comedy',
  'drama',
  'fantasy',
  'romance',
  'sci-fi',
  'sci fi',
  'science-fiction',
  'science fiction',
  'horror',
  'mystery',
  'mystery & thriller',
  'mystery-thriller',
  'thriller',
  'supernatural',
  'historical',
  'historical-fiction',
  'historical fiction',
  'slice-of-life',
  'slice of life',
  'sports',
  'psychological',
  'martial-arts',
  'martial arts',
  'school-life',
  'school life',
  'wuxia',
  'xianxia',
  'xuanhuan',
  'cultivation',
  'isekai',
  'shounen',
  'shoujo',
  'seinen',
  'josei',
  'bl',
  'boys love',
  'boys'' love',
  'gl',
  'girls love',
  'girls'' love',
  'mature'
);
