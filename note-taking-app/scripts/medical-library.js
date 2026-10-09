(function () {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const categoryIcons = {
    bau: '<svg class="ml-category-icon" width="20" height="22" viewBox="0 0 100 114" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" aria-hidden="true"><path d="M8 5h84v31c0 36-14 59-42 73C22 95 8 72 8 36Z"/><path d="M21 29h58v39H21Z" stroke-width="1.5"/><path d="m52 34 26-8v17l-24 4 23 15-23 3" stroke-width="2"/><g transform="translate(49 49)" stroke-width="1.8"><ellipse cx="0" cy="-10" rx="4" ry="11" transform="rotate(0)"/><ellipse cx="0" cy="-10" rx="4" ry="11" transform="rotate(45)"/><ellipse cx="0" cy="-10" rx="4" ry="11" transform="rotate(90)"/><ellipse cx="0" cy="-10" rx="4" ry="11" transform="rotate(135)"/><ellipse cx="0" cy="-10" rx="4" ry="11" transform="rotate(180)"/><ellipse cx="0" cy="-10" rx="4" ry="11" transform="rotate(225)"/><ellipse cx="0" cy="-10" rx="4" ry="11" transform="rotate(270)"/><ellipse cx="0" cy="-10" rx="4" ry="11" transform="rotate(315)"/><path d="m0-8 3 5 6-1-3 5 3 5-6-1-3 5-3-5-6 1 3-5-3-5 6 1Z" fill="currentColor" stroke="none"/></g><path d="M26 72h48v16H26ZM24 88h52M32 88V77a3 3 0 0 1 6 0v11m7 0V77a3 3 0 0 1 6 0v11m7 0V77a3 3 0 0 1 6 0v11m5 0V77" stroke-width="2"/><text x="50" y="15" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-size="8" font-weight="700">جامعة البلقاء التطبيقية</text><text x="50" y="23" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-size="5.6" font-weight="700">AL-BALQA APPLIED UNIVERSITY</text><path d="M19 57c3 16 12 30 22 37M81 57c-3 16-12 30-22 37" stroke-width="1.5"/><path d="m20 65 5 1m-2 5 5 1m-2 5 5 1m38-13 5-1m-8 7 5-1m-8 7 5-1" stroke-width="2"/><text x="50" y="100" text-anchor="middle" fill="currentColor" stroke="none" font-family="Arial,sans-serif" font-size="7">الأردن</text></svg>',
    cqb: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="4" rx="1"/><path d="M5 7v13h14V7M10 11h4"/></svg>',
    uworld: '<svg class="ml-category-icon ml-uw-icon" width="20" height="20" viewBox="13 19 63 63" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M49,55L49,53L50,53L50,50L49,50L49,52L48,52L48,53L47,53L47,54L46,54L46,55L45,55L45,56L43,56L43,57L40,57L40,58L36,58L36,59L34,59L34,58L30,58L30,57L27,57L27,56L26,56L26,55L25,55L25,54L24,54L24,53L23,53L23,52L22,52L22,50L21,50L21,48L20,48L20,43L19,43L19,53L20,53L20,55L21,55L21,57L22,57L22,58L23,58L23,60L24,60L24,61L26,61L26,62L28,62L28,63L30,63L30,64L39,64L39,63L42,63L42,62L43,62L43,61L45,61L45,60L46,60L46,59L47,59L47,57L48,57L48,56L49,56ZM67,63L68,63L68,61L69,61L69,59L70,59L70,55L71,55L71,46L70,46L70,42L69,42L69,39L68,39L68,45L67,45L67,50L66,50L66,52L65,52L65,54L64,54L64,56L63,56L63,57L62,57L62,58L61,58L61,60L60,60L60,61L59,61L59,62L58,62L58,63L56,63L56,64L55,64L55,65L53,65L53,66L51,66L51,67L49,67L49,68L44,68L44,69L38,69L38,68L33,68L33,67L30,67L30,66L28,66L28,65L27,65L27,64L25,64L25,63L24,63L24,62L23,62L23,61L22,61L22,60L21,60L21,59L20,59L20,58L19,58L19,60L20,60L20,62L21,62L21,64L22,64L22,65L23,65L23,66L24,66L24,68L25,68L25,69L26,69L26,70L27,70L27,71L28,71L28,72L30,72L30,73L31,73L31,74L33,74L33,75L36,75L36,76L39,76L39,77L48,77L48,76L53,76L53,75L55,75L55,74L57,74L57,73L59,73L59,72L60,72L60,71L61,71L61,70L63,70L63,69L64,69L64,68L65,68L65,66L66,66L66,65L67,65ZM53,21L56,21L56,22L58,22L58,23L60,23L60,24L62,24L62,25L63,25L63,26L65,26L65,27L66,27L66,28L67,28L67,29L68,29L68,31L69,31L69,32L70,32L70,33L71,33L71,35L72,35L72,37L73,37L73,38L74,38L74,42L75,42L75,47L76,47L76,54L75,54L75,59L74,59L74,63L73,63L73,64L72,64L72,66L71,66L71,68L70,68L70,69L69,69L69,70L68,70L68,72L67,72L67,73L66,73L66,74L65,74L65,75L63,75L63,76L62,76L62,77L60,77L60,78L58,78L58,79L56,79L56,80L53,80L53,81L48,81L48,82L41,82L41,81L36,81L36,80L33,80L33,79L31,79L31,78L29,78L29,77L27,77L27,76L26,76L26,75L24,75L24,74L23,74L23,73L22,73L22,72L21,72L21,70L20,70L20,69L19,69L19,68L18,68L18,66L17,66L17,64L16,64L16,62L15,62L15,59L14,59L14,53L13,53L13,48L14,48L14,42L15,42L15,39L16,39L16,37L17,37L17,35L18,35L18,33L19,33L19,32L20,32L20,31L21,31L21,29L22,29L22,28L23,28L23,27L24,27L24,26L26,26L26,25L27,25L27,24L29,24L29,23L31,23L31,22L33,22L33,21L36,21L36,20L41,20L41,19L48,19L48,20L53,20ZM39,27L38,27L38,28L37,28L37,29L36,29L36,37L37,37L37,39L38,39L38,40L39,40L39,41L40,41L40,42L42,42L42,43L44,43L44,42L43,42L43,41L42,41L42,40L41,40L41,38L40,38L40,36L39,36L39,30L40,30L40,29L41,29L41,27L42,27L42,26L44,26L44,25L47,25L47,24L42,24L42,25L40,25L40,26L39,26ZM44,39L45,39L45,40L46,40L46,41L47,41L47,40L46,40L46,32L47,32L47,31L48,31L48,30L49,30L49,29L50,29L50,28L52,28L52,27L57,27L57,26L55,26L55,25L49,25L49,26L47,26L47,27L46,27L46,28L45,28L45,29L44,29L44,31L43,31L43,37L44,37ZM29,33L29,40L30,40L30,42L31,42L31,43L32,43L32,44L33,44L33,45L34,45L34,46L36,46L36,47L45,47L45,46L47,46L47,45L40,45L40,44L38,44L38,43L36,43L36,42L35,42L35,40L34,40L34,39L33,39L33,36L32,36L32,31L33,31L33,28L34,28L34,27L35,27L35,26L36,26L36,25L35,25L35,26L33,26L33,27L32,27L32,28L31,28L31,29L30,29L30,31L29,31ZM58,27L57,27L57,28L54,28L54,29L52,29L52,30L51,30L51,31L50,31L50,33L49,33L49,38L50,38L50,40L51,40L51,35L52,35L52,33L53,33L53,32L54,32L54,31L56,31L56,30L59,30L59,31L62,31L62,30L61,30L61,29L59,29L59,28L58,28ZM27,31L26,31L26,32L25,32L25,33L24,33L24,35L23,35L23,38L22,38L22,43L23,43L23,46L24,46L24,48L25,48L25,49L26,49L26,50L27,50L27,51L28,51L28,52L29,52L29,53L32,53L32,54L40,54L40,53L43,53L43,52L44,52L44,51L45,51L45,50L43,50L43,51L38,51L38,50L34,50L34,49L32,49L32,48L31,48L31,47L30,47L30,46L29,46L29,45L28,45L28,44L27,44L27,42L26,42L26,33L27,33ZM46,49L45,49L45,50L46,50ZM59,32L58,32L58,33L56,33L56,34L55,34L55,35L54,35L54,37L53,37L53,39L54,39L54,37L55,37L55,36L57,36L57,35L62,35L62,36L64,36L64,37L65,37L65,40L66,40L66,36L65,36L65,34L63,34L63,33L61,33L61,32ZM50,49L51,49L51,48L50,48ZM27,30L27,31L28,31L28,30ZM63,31L62,31L62,32L63,32Z"/></svg>',
    amboss: '<svg class="ml-category-icon" width="18" height="18" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M16 3 2 27h28L19 8M16 10 6 30h20L16 13 10 24h12"/></svg>',
    mehlman: '<svg class="ml-category-icon ml-mehlman-icon" width="22" height="24" viewBox="25 21 82 89" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M73,85L73,107L74,107L74,106L76,106L76,105L78,105L78,104L80,104L80,103L82,103L82,79L83,79L83,78L84,78L84,80L85,80L85,81L86,81L86,82L87,82L87,84L88,84L88,85L90,85L90,82L91,82L91,79L92,79L92,77L93,77L93,74L94,74L94,73L95,73L95,74L96,74L96,95L97,95L97,94L99,94L99,93L101,93L101,92L103,92L103,91L105,91L105,48L102,48L102,49L100,49L100,50L98,50L98,51L96,51L96,53L95,53L95,55L94,55L94,57L93,57L93,60L92,60L92,63L91,63L91,65L90,65L90,66L88,66L88,65L87,65L87,64L86,64L86,62L85,62L85,61L84,61L84,59L80,59L80,60L78,60L78,61L76,61L76,62L74,62L74,63L73,63ZM25,75L25,39L26,39L26,38L27,38L27,37L28,37L28,36L31,36L31,35L33,35L33,34L35,34L35,33L37,33L37,32L39,32L39,33L41,33L41,34L43,34L43,35L45,35L45,34L46,34L46,31L47,31L47,29L48,29L48,27L49,27L49,26L51,26L51,25L53,25L53,24L55,24L55,23L56,23L56,22L58,22L58,21L63,21L63,22L65,22L65,23L68,23L68,22L70,22L70,21L74,21L74,22L76,22L76,23L78,23L78,24L80,24L80,25L82,25L82,26L84,26L84,28L85,28L85,30L86,30L86,33L87,33L87,35L90,35L90,34L92,34L92,33L97,33L97,34L99,34L99,35L101,35L101,36L103,36L103,37L105,37L105,38L107,38L107,92L106,92L106,93L105,93L105,94L103,94L103,95L101,95L101,96L99,96L99,97L97,97L97,98L93,98L93,97L91,97L91,96L88,96L88,95L86,95L86,94L84,94L84,104L83,104L83,105L81,105L81,106L79,106L79,107L77,107L77,108L75,108L75,109L73,109L73,110L71,110L71,109L69,109L69,108L64,108L64,109L62,109L62,110L59,110L59,109L57,109L57,108L55,108L55,107L53,107L53,106L51,106L51,105L49,105L49,95L48,95L48,94L47,94L47,95L44,95L44,96L42,96L42,97L40,97L40,98L36,98L36,97L34,97L34,96L32,96L32,95L30,95L30,94L28,94L28,93L26,93L26,92L25,92ZM51,84L51,103L52,103L52,104L54,104L54,105L56,105L56,106L58,106L58,107L59,107L59,106L60,106L60,63L58,63L58,62L56,62L56,61L55,61L55,60L53,60L53,59L49,59L49,60L48,60L48,62L47,62L47,63L46,63L46,64L45,64L45,66L42,66L42,64L41,64L41,62L40,62L40,59L39,59L39,56L38,56L38,53L37,53L37,52L36,52L36,51L35,51L35,50L33,50L33,49L31,49L31,48L28,48L28,91L29,91L29,92L31,92L31,93L33,93L33,94L35,94L35,95L36,95L36,94L37,94L37,73L38,73L38,74L39,74L39,76L40,76L40,78L41,78L41,81L42,81L42,84L43,84L43,85L45,85L45,84L46,84L46,82L47,82L47,81L48,81L48,79L50,79L50,80L51,80L51,81L50,81L50,83L51,83ZM64,60L64,59L65,59L65,57L66,57L66,56L65,56L65,54L64,54L64,53L61,53L61,52L60,52L60,53L58,53L58,54L56,54L56,55L54,55L54,56L53,56L53,57L54,57L54,58L56,58L56,59L58,59L58,60L59,60L59,61L62,61L62,60ZM65,74L65,62L63,62L63,63L62,63L62,106L64,106L64,105L65,105L65,104L66,104L66,103L65,103ZM47,37L49,37L49,38L50,38L50,39L51,39L51,41L52,41L52,42L53,42L53,44L54,44L54,45L55,45L55,44L56,44L56,41L57,41L57,39L58,39L58,37L59,37L59,34L58,34L58,33L56,33L56,32L55,32L55,31L53,31L53,30L49,30L49,32L48,32L48,35L47,35ZM79,28L79,26L77,26L77,25L75,25L75,24L73,24L73,23L71,23L71,24L69,24L69,25L68,25L68,30L69,30L69,31L71,31L71,32L73,32L73,31L75,31L75,30L76,30L76,29L78,29L78,28ZM68,88L68,106L71,106L71,63L70,63L70,62L68,62ZM51,52L50,52L50,49L49,49L49,47L48,47L48,48L45,48L45,49L44,49L44,50L42,50L42,51L40,51L40,55L41,55L41,57L42,57L42,60L43,60L43,62L45,62L45,60L46,60L46,59L47,59L47,58L48,58L48,56L49,56L49,55L51,55ZM44,47L44,46L46,46L46,44L44,44L44,43L32,43L32,44L31,44L31,46L33,46L33,47L34,47L34,48L36,48L36,49L40,49L40,48L42,48L42,47ZM89,37L89,38L87,38L87,40L88,40L88,41L102,41L102,40L103,40L103,39L102,39L102,38L100,38L100,37L98,37L98,36L96,36L96,35L94,35L94,36L91,36L91,37ZM60,23L59,23L59,24L57,24L57,25L56,25L56,26L54,26L54,27L53,27L53,29L56,29L56,30L58,30L58,31L59,31L59,32L62,32L62,31L64,31L64,30L65,30L65,29L66,29L66,27L65,27L65,25L64,25L64,24L62,24L62,23ZM72,61L73,61L73,60L75,60L75,59L76,59L76,58L79,58L79,56L78,56L78,55L76,55L76,54L75,54L75,53L72,53L72,52L71,52L71,53L69,53L69,54L68,54L68,59L69,59L69,60L71,60L71,61ZM85,33L84,33L84,31L83,31L83,30L80,30L80,31L78,31L78,32L76,32L76,33L74,33L74,38L75,38L75,40L76,40L76,43L77,43L77,44L79,44L79,43L80,43L80,41L81,41L81,39L82,39L82,38L83,38L83,37L85,37ZM91,94L92,94L92,95L94,95L94,82L93,82L93,83L92,83L92,86L91,86L91,88L90,88L90,89L86,89L86,88L84,88L84,91L85,91L85,92L87,92L87,93L90,93L90,94ZM88,46L89,46L89,47L91,47L91,48L93,48L93,49L97,49L97,48L99,48L99,47L101,47L101,46L102,46L102,44L101,44L101,43L89,43L89,44L87,44L87,45L88,45ZM81,45L80,45L80,47L79,47L79,48L78,48L78,49L76,49L76,47L75,47L75,44L74,44L74,41L73,41L73,38L72,38L72,36L71,36L71,34L70,34L70,33L68,33L68,51L70,51L70,50L73,50L73,51L76,51L76,52L78,52L78,53L79,53L79,52L80,52L80,49L81,49L81,46L82,46L82,44L84,44L84,43L85,43L85,41L83,41L83,42L82,42L82,44L81,44ZM47,92L47,91L48,91L48,88L47,88L47,89L44,89L44,90L43,90L43,89L42,89L42,87L41,87L41,85L40,85L40,83L39,83L39,95L41,95L41,94L43,94L43,93L45,93L45,92ZM57,52L57,51L59,51L59,50L63,50L63,51L65,51L65,50L66,50L66,49L65,49L65,40L66,40L66,39L65,39L65,38L66,38L66,37L65,37L65,33L63,33L63,34L62,34L62,35L61,35L61,38L60,38L60,40L59,40L59,42L58,42L58,45L57,45L57,48L54,48L54,47L53,47L53,46L52,46L52,45L51,45L51,43L50,43L50,42L49,42L49,41L48,41L48,43L49,43L49,44L50,44L50,45L51,45L51,48L52,48L52,50L53,50L53,52L54,52L54,53L55,53L55,52ZM85,47L84,47L84,48L83,48L83,51L82,51L82,53L81,53L81,54L82,54L82,55L83,55L83,56L84,56L84,57L85,57L85,58L86,58L86,60L87,60L87,61L88,61L88,62L89,62L89,61L90,61L90,59L91,59L91,56L92,56L92,54L93,54L93,51L92,51L92,50L90,50L90,49L88,49L88,48L85,48ZM30,39L30,40L31,40L31,41L44,41L44,40L45,40L45,38L43,38L43,37L41,37L41,36L39,36L39,35L37,35L37,36L34,36L34,37L32,37L32,38L30,38Z"/></svg>',
    boardvitals: '<svg class="ml-category-icon" width="26" height="28" viewBox="94 27 148 201" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M156 33h8m14 0h6m-30 1-2 26c-2 30 32 31 34 1l1-26M118 44l6-1c4 0 5 4 8 11l5 16c8 28-19 16-26 3l-11-20c-2-4 2-4 6-5M215 44l-5-1c-3 0-6 7-9 14l-4 15c-6 24 19 15 27 1l12-20c2-3-2-4-6-4" stroke-width="6"/><path d="M153 59c-1 13 4 23 15 24 12 0 17-12 17-23M168 84v123M127 85c24 11 44 19 60 36 29 31-36 36-41 86M210 84c-25 14-46 22-61 39-27 30 35 37 39 84" stroke-width="6"/><circle cx="147" cy="215" r="8" stroke-width="6"/><circle cx="168" cy="215" r="8" stroke-width="6"/><circle cx="189" cy="215" r="8" stroke-width="6"/></svg>',
    mksap: '<svg class="ml-category-icon" width="18" height="18" viewBox="-2 0 40 36" fill="currentColor" aria-hidden="true"><path d="M2 2h5l4 10 4-10h5v15h-4V7l-4 10H9L5 7v10H2ZM23 2h4v6l5-6h5l-6 7 6 8h-5l-5-7v7h-4ZM9 22c-2-2-7-2-7 2 0 4 7 2 7 7 0 5-7 6-10 2l3-2c2 2 4 2 4 0 0-2-7-1-7-6 0-6 8-7 12-4ZM14 20h4l6 15h-4l-1-3h-6l-1 3H8Zm0 9h4l-2-6ZM26 20h6c7 0 7 10 0 10h-2v5h-4Zm4 3v4h2c3 0 3-4 0-4Z"/></svg>',
    abim: '<svg class="ml-category-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 3v5a5 5 0 0 0 10 0V3M4 3h2M12 3h2M9 13v3a5 5 0 0 0 10 0v-3"/><circle cx="19" cy="10" r="3"/></svg>',
    nbme: '<svg class="ml-category-icon" width="22" height="24" viewBox="14 10 32 44" fill="currentColor" aria-hidden="true"><g transform="translate(30 0) scale(.78 1) translate(-30 0)"><path d="M33 12c-6 4-8 10-5 15 3 4 7 8 5 13h7c2-5-1-10-5-15-3-4-4-8-2-13Z"/><path d="M24 24c-4 5-1 9 3 13 4 4 6 9 4 15h5l4-10h-9c1-7-8-11-7-18Z"/><path d="M20 33c-3 5-1 10 2 15l3 4h4c-2-8-10-12-9-19Z"/></g></svg>',
    cms: '<svg class="ml-category-icon" width="20" height="20" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>',
    default: '<svg class="ml-category-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5.5C9 3.5 5 3.5 2 5v15c3-1.5 7-1.5 10 .5 3-2 7-2 10-.5V5c-3-1.5-7-1.5-10 .5ZM12 5.5v15"/></svg>'
  };
  const caret = '<svg class="ml-tree-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  const leafArrow = '<svg class="ml-leaf-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  const leafDoc = '<svg class="ml-leaf-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';

  const Library = {
    bootCache: new Map(),
    pendingReads: new Map(),
    cacheRevision:0,
    async preloadWorkspace(onStatus = () => {}) {
      const prime = async endpoint => {
        const value = await this.api(endpoint);
        this.bootCache.set(endpoint, {value, expires:Date.now() + 60000});
        return value;
      };
      await onStatus('Loading question banks…');
      const catalog = await prime('/catalog');
      await onStatus('Loading user settings…');
      const profile = await prime('/profile');
      await onStatus('Loading saved sessions…');
      const sessions = await prime('/sessions');
      this.banks = catalog.banks; this.root = catalog.root; this.profile = profile;
      this.currentBank = profile.currentBank || null; this.sessions = sessions;
      if (this.currentBank) {
        const bank = encodeURIComponent(this.currentBank);
        await onStatus('Loading bank filters…');
        await prime('/filters?bank=' + bank);
        await onStatus('Loading question list…');
        await prime('/questions-list?bank=' + bank);
        await onStatus('Loading dashboard statistics…');
        await prime('/statistics?bank=' + bank);
        await onStatus('Loading flagged questions…');
        await prime('/flagged?bank=' + bank);
      }
    },
    banks: [], sessions: [], active: null, currentBank: null, saveQueue: Promise.resolve(), viewToken: 0,
    defaultSessionTitle(date=new Date()) {
      const time=new Date(date);const day=time.toLocaleDateString('en-US',{month:'short',day:'numeric'});
      const hour=time.toLocaleTimeString('en-US',{hour:'numeric',hour12:true}).replace(/\s/g,'');
      return `Custom session from ${day}, ${hour}`;
    },
    openBankNodes: new Set(['bau']),
    async api(endpoint, options = {}) {
      const read=!options.method || options.method==='GET';
      if(read) {
        const cached=this.bootCache.get(endpoint);
        const cloneValue=window.QnexCompat?.clone || (value=>JSON.parse(JSON.stringify(value)));
        if(cached && cached.expires>Date.now())return cloneValue(cached.value);
        if(this.pendingReads.has(endpoint))return cloneValue(await this.pendingReads.get(endpoint));
      } else {
        // Choosing a bank does not change its catalog.
        const catalog=endpoint==='/profile'?this.bootCache.get('/catalog'):null;
        this.bootCache.clear();if(catalog)this.bootCache.set('/catalog',catalog);
        this.pendingReads.clear();this.cacheRevision++;
      }
      const revision=this.cacheRevision;
      const request=(async()=>{
        await window.fileSystemService.waitForReady();
        if(window.fileSystemService.isOffline && window.QnexOffline)return window.QnexOffline.library(endpoint,options);
        // First-use AMBOSS facets scan the source links once in the read-only worker.
        const indexing = endpoint.startsWith('/filters?') && /bank=amboss/i.test(endpoint);
        const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),indexing ? 120000 : 30000);
        try {
          const response=await fetch(window.fileSystemService.baseUrl+'/medical-library'+endpoint,{
            ...options,signal:options.signal || controller.signal,headers:{'Content-Type':'application/json',...options.headers}
          });
          const data=await response.json().catch(()=>({error:'The library service is unavailable. Restart Qnex to load the update.'}));
          if(!response.ok)throw Error(data.error || 'Could not load the library.');
          if(read && endpoint==='/catalog' && revision===this.cacheRevision)this.bootCache.set(endpoint,{value:data,expires:Date.now()+60000});
          return data;
        }catch(error){
          if(controller.signal.aborted && !options.signal?.aborted){const timeout=Error('The local service is still starting. Retrying automatically…');timeout.name='TimeoutError';throw timeout;}
          throw error;
        }finally{clearTimeout(timer);}
      })();
      if(read)this.pendingReads.set(endpoint,request);
      try{return await request;}finally{if(this.pendingReads.get(endpoint)===request)this.pendingReads.delete(endpoint);}
    },
    status(message, error = false) {
      if(window.fileSystemService?.isOffline && window.QnexOffline){message=window.QnexOffline.message;error=false;}
      const node = document.getElementById('mlLibraryStatus');
      if (node) { const busy=/^(Finding|Connecting|Loading)/.test(message); node.innerHTML = error ? escape(message) : busy ? `<span class="qw-spinner" aria-hidden="true"></span><span>${escape(message)}</span>` : `<span>${escape(message)}</span>`; node.classList.toggle('error', error); }
    },
    async render() {
      const grid = document.getElementById('medicalLibraryGrid');
      if (!grid) return;
      const token = ++this.viewToken;
      grid.innerHTML = `
        <section class="ml-library ml-catalog">
          <header class="ml-catalog-header"><div class="ml-catalog-title"><h2>Qbank Library</h2><p>Choose a question bank and build your next test</p></div>
          <div class="ml-library-toolbar">
            <input id="mlBankSearch" type="search" placeholder="Search question banks…" aria-label="Find a question bank">
            <button class="ml-library-btn qd-icon-action" id="mlRefresh" title="Refresh" aria-label="Refresh"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"/></svg></button>
          </div></header>

          <p id="mlLibraryStatus" class="ml-library-muted ml-library-status" role="status"><span class="qw-spinner" aria-hidden="true"></span><span>Finding local question banks…</span></p>
          <div id="mlBankContent">${window.QBankWorkspace?.loading('Loading your Qbank library…') || 'Loading your Qbank library…'}</div>

        </section>
      `;
      document.getElementById('mlRefresh').onclick = () => this.render();
      document.getElementById('mlBankSearch').oninput = () => { this.selectedBank = null; this.renderBanks(); };
      try {
        const [catalog, sessions, profile] = await Promise.all([this.api('/catalog'), this.api('/sessions'), this.api('/profile')]);
        if (token !== this.viewToken) return;
        this.banks = catalog.banks; this.root = catalog.root; this.sessions = sessions;
        this.profile = profile;
        this.currentBank = profile.currentBank || null;
        this.mergeSessionSummaries();
        this.renderGoalToolbar();
        this.renderBanks();
        this.renderSessions();

        // Sync question list into sidebar for the active bank
        if (this.currentBank && window.QuestionBase?.loadBankQuestions && (!window.QuestionBase.state.questions.length || window.QuestionBase._loadedBank !== this.currentBank)) {
          window.QuestionBase.loadBankQuestions(this.currentBank).catch(() => {});
        }
      } catch (error) { if (token === this.viewToken) {this.status(error.message, true);const content=document.getElementById('mlBankContent');if(content)content.textContent='Could not load question banks. Use Refresh to try again.';} }
    },
    renderLocationSettings(mount) {
      const section = document.createElement('section');
      section.className = 'qw-card';
      section.innerHTML = `<h3>Library location</h3><form class="ml-library-toolbar"><input aria-label="MedOS installation folder" value="${escape(this.root || 'D:\\MedOS\\MedOS')}"><button class="qw-icon" title="Connect folder" aria-label="Connect folder"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7V5h6l2 2h10v13H3zM12 10v7m-3-3h6"/></svg></button></form><p class="qw-muted" role="status"></p>`;
      mount.append(section);
      const input = section.querySelector('input'), status = section.querySelector('[role="status"]');
      if (!this.root) this.api('/catalog').then(data => {
        this.root = data.root;
        if (section.isConnected && input.value === 'D:\\MedOS\\MedOS') input.value = data.root;
      }).catch(error => { if (section.isConnected) status.textContent = error.message; });
      section.querySelector('form').onsubmit = async event => {
        event.preventDefault();
        const button = section.querySelector('button');
        button.disabled = true; status.textContent = 'Connecting to the folder…';
        try {
          const data = await this.api('/connect', {method:'POST',body:JSON.stringify({root:input.value})});
          this.banks = data.banks; this.root = data.root; input.value = data.root;
          this.renderBanks(); this.renderGoalToolbar();
          status.textContent = 'Library location saved.';
        } catch (error) { status.textContent = error.message; }
        finally { button.disabled = false; }
      };
    },
    renderGoalToolbar() {
      const bar = document.getElementById('mlGoalToolbar');
      if (!bar) return;
      const activeBank = this.banks.find(b => b.key === this.currentBank);
      const icon = categoryIcons[activeBank?.category] || categoryIcons.default;
      bar.innerHTML = `
        <div class="ml-goal-status">
          <div class="ml-goal-icon-badge">${icon}</div>
          <div class="ml-goal-details">
            <div class="ml-goal-tag">CURRENT STUDY GOAL</div>
            <div class="ml-goal-title">${escape(activeBank?.label || 'No question bank chosen')}</div>
            <div class="ml-goal-meta">${activeBank ? `${activeBank.count.toLocaleString()} questions · Linked to Statistics & Sidebar` : 'Select a question bank below to begin practicing'}</div>
          </div>
        </div>
        <div class="ml-goal-actions">
          ${activeBank ? `<button type="button" class="ml-library-btn primary qd-icon-action" id="mlGoalStudyBtn" title="Practice Session" aria-label="Practice Session"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 4 12 8-12 8z"/></svg></button>` : ''}
          ${activeBank ? `<button type="button" class="ml-library-btn qd-icon-action" id="mlGoalStatsBtn" title="View Performance" aria-label="View Performance"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20v-6M12 20V4M19 20V10"/></svg></button>` : ''}
          <button type="button" class="ml-library-btn" id="mlGoalChangeBtn">${activeBank ? 'Change QBank' : 'Choose QBank'}</button>
        </div>
      `;
      const studyBtn = document.getElementById('mlGoalStudyBtn');
      if (studyBtn && activeBank) studyBtn.onclick = () => this.openBank(activeBank.key);
      const statsBtn = document.getElementById('mlGoalStatsBtn');
      if (statsBtn) statsBtn.onclick = () => {
        if (window.QuestionBase) window.QuestionBase.switchTab('statistics');
      };
      const changeBtn = document.getElementById('mlGoalChangeBtn');
      if (changeBtn) changeBtn.onclick = () => {
        const content = document.getElementById('mlBankContent');
        if (content) content.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    },
    async selectGoal(key) {
      try {
        this.profile = await this.api('/profile', { method: 'POST', body: JSON.stringify({ currentBank: key }) });
        this.currentBank = this.profile.currentBank;
        window.QbankProfile?.updateBank(this.banks.find(bank=>bank.key===this.currentBank));
        this.selectedBank = key;
        this.renderGoalToolbar();
        this.renderBanks();
        if (window.QuestionBase?.loadBankQuestions) {
          await window.QuestionBase.loadBankQuestions(key);
        }
        window.QBankDashboard?.refreshVisible();
      } catch (err) {
        console.warn('[MedicalLibrary] Could not save active goal:', err);
        throw err;
      }
    },
    groupBanks(banks) {
      const categories = [
        ['bau', 'BAU Qbank'],
        ['uworld', 'UWorld Qbank'], ['amboss', 'AMBOSS Qbank'],
        ['mehlman', 'Mehlman Qbank'], ['boardvitals', 'BoardVitals Qbank'],
        ['mksap', 'MKSAP Qbank'], ['abim', 'ABIM / Internal Medicine Qbank'],
        ['nbme', 'NBME Self-Assessments'], ['cms', 'CMS Forms']
      ];
      const groups = new Map(categories.map(([id, label]) => [id, { id, label, banks: [], children: [] }]));
      for (const bank of banks) {
        const category = ['amboss_abim', 'uworld_abim'].includes(bank.category) ? 'abim' : bank.category || 'other';
        if (!groups.has(category)) groups.set(category, { id: category, label: 'Other Question Banks', banks: [], children: [] });
        groups.get(category).banks.push(bank);
      }
      const compare = (a, b) => a.label.localeCompare(b.label, undefined, { numeric: true });
      for (const group of groups.values()) {
        group.banks.sort((a, b) => Number(!!a.isArchived) - Number(!!b.isArchived) || compare(a, b));
        if (!['nbme','cms'].includes(group.id)) continue;
        const children = new Map();
        for (const bank of group.banks) {
          const label = group.id === 'bau' ? `${bank.year || 4}th year` : group.id === 'nbme' ? `Step ${bank.step || bank.key.match(/^nbme-(\d+)/)?.[1] || 'Other'}` : bank.subject || bank.label.split(' · ')[0];
          if (!children.has(label)) children.set(label, { id: `${group.id}:${label}`, label, banks: [] });
          children.get(label).banks.push(bank);
        }
        group.children = [...children.values()].sort(compare);
      }
      return [...groups.values()].filter(group => group.banks.length);
    },
    isForm(bank) { return ['nbme','cms'].includes(bank.category) || !!bank.form || /(?:^|[·\s])Form\s+\w/i.test(bank.label || ''); },
    renderBanks() {
      const content = document.getElementById('mlBankContent');
      if (!content) return;
      const query = document.getElementById('mlBankSearch').value.trim().toLowerCase();
      const listedBanks = [...this.banks];
      for (const year of [4,5]) {
        if (!listedBanks.some(bank => bank.category==='bau' && Number(bank.year)===year)) {
          listedBanks.push({key:`bau-year${year}`,label:`${year}th year`,category:'bau',year,count:0,isPending:true});
        }
      }
      const allGroups = this.groupBanks(listedBanks);
      const banks = allGroups.flatMap(group => group.banks.filter(bank => `${group.label} ${bank.year ? bank.year+'th year' : ''} ${bank.label} ${bank.subject || ''} ${bank.category}`.toLowerCase().includes(query)));
      const groups = this.groupBanks(banks);
      const currentEntries=this.banks.filter(bank=>!bank.isArchived);
      const forms=currentEntries.filter(bank=>this.isForm(bank)).length;
      const totalQuestions=this.banks.reduce((sum,bank)=>sum+Number(bank.count || 0),0);
      this.status(`${currentEntries.length-forms} Banks · ${forms} Forms · ${totalQuestions.toLocaleString()} Total questions${query ? ' · '+banks.length+' matching entries' : ''}`);
      const leaves = (items, category) => items.map(bank => {
        const form = bank.form || bank.label.match(/·\s*Form\s+(.+)$/)?.[1];
        const label = bank.isArchived ? (['uworld', 'amboss'].includes(category) ? 'Archived' : `Archived · ${bank.label.replace(/ · Archived$/, '')}`) : ['nbme', 'cms'].includes(category) && form ? `Form ${form}` : ['uworld', 'amboss'].includes(category) && bank.step ? `Step ${bank.step}${bank.category === 'amboss' && bank.step === 2 ? ' CK' : ''}` : bank.label;
        const isActiveGoal = this.currentBank === bank.key;
        return `
          <div class="ml-leaf-row${isActiveGoal ? ' is-active-goal' : ''}">
            <button type="button" class="ml-tree-leaf${this.selectedBank === bank.key ? ' is-selected' : ''}" ${bank.isPending ? 'disabled' : `data-bank="${escape(bank.key)}"`} aria-label="${escape(bank.label)}, ${bank.isPending ? 'Awaiting PDFs' : bank.count.toLocaleString()+' questions'}">
              <span class="ml-leaf-icon">${bank.isArchived ? categoryIcons.cqb : leafDoc}</span>
              <span class="ml-tree-leaf-name">${escape(label)}</span>
              ${isActiveGoal ? '<span class="ml-badge-active">CURRENT BANK</span>' : ''}
              <span class="ml-tree-count">${bank.count.toLocaleString()} <span class="ml-count-unit">questions</span></span>
              ${bank.isPending ? '' : `<span class="ml-leaf-arrow" aria-hidden="true">${leafArrow}</span>`}
            </button>
          </div>
        `;
      }).join('');
      const node = (id, label, count, children, nested = false, unit = '', totalQuestions = null, formCount = 0) => {
        const icon = categoryIcons[id] || categoryIcons.default;
        if (id === 'bau') children += '<p class="ml-bau-year-note">* 6th year uses the same question banks as 4th and 5th year.</p>';
        return `<details class="ml-tree-node${nested ? ' ml-tree-subgroup' : ''}" data-node="${escape(id)}"${query || this.openBankNodes.has(id) ? ' open' : ''}><summary>${nested ? `${caret}<span class="ml-tree-name">${escape(label)}</span><span class="ml-tree-total">${count} ${unit || (count === 1 ? 'form' : 'forms')}</span>` : `<span class="ml-collection-name">${caret}${icon}<span>${escape(label)}</span></span><span class="ml-tree-total"><span class="ml-count-circle">${count}</span><small class="ml-count-label">${['nbme','cms'].includes(id)?'Forms':'Banks'}</small></span><span class="ml-collection-questions"><span class="ml-count-circle">${Number(totalQuestions || 0).toLocaleString()}</span><small class="ml-count-label">Questions</small></span>`}</summary><div class="ml-tree-children">${children}</div></details>`;
      };
      content.innerHTML = `<div class="ml-collection-heading"><h3>Question banks</h3><div class="ml-bank-controls"><button type="button" class="qw-icon" data-bank-toggle aria-label="Expand all" title="Expand all"></button></div></div><div class="qw-table-scroll ml-catalog-table-wrap"><table class="qw-table ml-catalog-table"><colgroup><col style="width:64%"><col style="width:18%"><col style="width:18%"></colgroup><thead><tr><th>Qbank / Collection</th><th>Banks / Forms</th><th>Questions</th></tr></thead><tbody>${groups.map(group => '<tr><td colspan="3">'+node(group.id, group.label, group.banks.filter(bank=>!bank.isPending).length, group.children.length ? group.children.map(child => node(child.id, child.label, child.banks.filter(bank=>!bank.isPending).length, leaves(child.banks, group.id), true, group.id==='bau' ? 'subjects' : '')).join('') : leaves(group.banks, group.id),false,'',group.banks.reduce((sum,bank)=>sum+Number(bank.count || 0),0),group.banks.filter(bank=>!bank.isArchived && this.isForm(bank)).length)+'</td></tr>').join('')}</tbody></table></div>`;

      if (!banks.length) content.innerHTML = '<div class="ml-library-empty">No matching question banks. Try a source, Step, or subject.</div>';
      const toggle = content.querySelector('[data-bank-toggle]');
      const syncToggle = () => {
        if (!toggle) return;
        const allOpen = [...content.querySelectorAll('details[data-node]')].every(details => details.open);
        const label = allOpen ? 'Collapse all' : 'Expand all';
        toggle.dataset.bankToggle = String(!allOpen);
        toggle.title = label;
        toggle.setAttribute('aria-label', label);
        toggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="bevel" stroke-width="2" d="M3 6h10M3 10h10"/><path fill="currentColor" d="${allOpen ? 'm8 12 3 3H5zm0-8L5 1h6z' : 'm8 16 3-3H5zM8 0 5 3h6z'}"/></svg>`;
      };
      syncToggle();
      if (toggle) toggle.onclick = () => {
        const open = toggle.dataset.bankToggle === 'true';
        content.querySelectorAll('details[data-node]').forEach(details => {
          details.open = open;
          if (open) this.openBankNodes.add(details.dataset.node);
          else this.openBankNodes.delete(details.dataset.node);
        });
        syncToggle();
      };
      content.querySelectorAll('details[data-node]').forEach(details => details.addEventListener('toggle', () => {
        if (!details.isConnected) return;
        syncToggle();
        if (!query) {
          if (details.open) this.openBankNodes.add(details.dataset.node);
          else this.openBankNodes.delete(details.dataset.node);
        }
      }));
      content.querySelectorAll('[data-bank]').forEach(button => button.onclick = async () => {
        button.disabled = true;
        try { await this.selectGoal(button.dataset.bank); window.QuestionBase.switchTab('create-test'); }
        catch (error) { button.disabled = false; this.status(error.message, true); }
      });
      content.querySelectorAll('[data-set-goal]').forEach(button => {
        button.onclick = (e) => {
          e.stopPropagation();
          this.selectGoal(button.dataset.setGoal).catch(error => this.status(error.message, true));
        };
      });
    },
    async openBank(key) {
      const bank = this.banks.find(item => item.key === key);
      if (!bank) return;
      this.selectedBank = key;
      this.status('Loading subjects and systems…');
      try {
        const filters = await this.api('/filters?bank=' + encodeURIComponent(key));
        if (this.selectedBank !== key) return;
        const options = items => items.map(item => `<option value="${item.id}">${escape(item.name)} (${item.count})</option>`).join('');
        const isActiveGoal = this.currentBank === key;
        const backIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
        document.getElementById('mlBankContent').innerHTML = `
          <form id="mlStudyForm" class="ml-library-form">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <button type="button" id="mlBack" class="ml-library-btn" style="display:inline-flex; align-items:center; gap:6px;">${backIcon} All banks</button>
              <button type="button" id="mlFormSetGoal" class="ml-library-btn ${isActiveGoal ? 'primary' : ''}">
                ${isActiveGoal ? '✓ Active Study Goal' : '★ Set as Active Study Goal'}
              </button>
            </div>
            <h3 style="margin-top:20px">${escape(bank.label)}</h3>
            <p class="ml-library-muted">${bank.count.toLocaleString()} questions available. Study with your Qnex Dungeon tools.</p>
            <div class="ml-library-fields">
              <label>Subject<select name="subject"><option value="">All subjects</option>${options(filters.subjects)}</select></label>
              <label>System<select name="system"><option value="">All systems</option>${options(filters.systems)}</select></label>
              <label>Questions<input name="count" type="number" min="1" step="1" value="10" required></label>
              <label>Question pool<select name="pool"><option value="all">All questions</option><option value="unused">Not answered in Qnex</option></select></label>
              <label>Feedback<select name="mode"><option value="tutor">Tutor — explain after answering</option><option value="exam">Exam — explain after ending the block</option></select></label>
              <label>Timer<select name="timer"><option value="off">No timer</option><option value="up">Count up</option><option value="down">90 seconds per question</option></select></label>
            </div>
            <p class="ml-library-muted">Standard multiple-choice practice. Linked case questions are skipped; official assessment scoring is not applied.</p>
            <div style="display:flex; gap:12px;">
              <button class="ml-library-btn primary qd-icon-action" id="mlStart" title="Start in Dungeon" aria-label="Start in Dungeon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 4 12 8-12 8z"/></svg></button>
            </div>
          </form>
        `;
        document.getElementById('mlBack').onclick = () => this.renderBanks();
        document.getElementById('mlFormSetGoal').onclick = () => this.selectGoal(key).catch(error => this.status(error.message, true));
        document.getElementById('mlStudyForm').onsubmit = event => { event.preventDefault(); this.start(bank, new FormData(event.currentTarget)); };
        this.status('Ready to build your session.');
      } catch (error) { this.status(error.message, true); }
    },
    async start(bank, form) {
      const button = document.getElementById('mlStart'); button.disabled = true;
      this.status('Loading questions, answers, and explanations…');
      try {
        if (!window.DungeonBase) throw new Error('Dungeon is not ready. Please reload Qnex.');
        this.profile = await this.api('/profile');
        const exclude = form.get('pool') === 'unused' ? [...new Set(this.sessions.filter(s => s.bank === bank.key).flatMap(s => s.usedIds || []))] : [];
        const result = await this.api('/questions', { method: 'POST', body: JSON.stringify({ bank: bank.key, subject: form.get('subject'), system: form.get('system'), count: Number(form.get('count')), exclude }) });
        if (!result.questions.length) throw new Error('No supported questions match this selection. Try another subject or question pool.');
        const questions = result.questions.map(q => this.adapt(q, bank.key, form));
        const session = { id: 'medos-' + window.QnexCompat.uuid(), library: true, bank: bank.key, generation: this.profile.generations[bank.key] || 0, title: this.defaultSessionTitle(), date: new Date().toISOString(), questions, completed: false };
        const summary = await this.api('/sessions/' + session.id, { method: 'PUT', body: JSON.stringify(session) });
        this.updateSummary(summary); this.active = session;
        this.status(`${questions.length} questions loaded.${result.skipped ? ` ${result.skipped} incomplete or linked questions skipped.` : ''}`);
        window.DungeonBase.open(questions, session.id);
      } catch (error) { this.status(error.message, true); }
      finally { button.disabled = false; }
    },
    adapt(q, bank, form) {
      return { id: `medos:${bank}:${q.id}`, title: q.title || `${bank} · ${q.id}`, text: q.stem || '', explanation: q.explanation || '',
        contentFormat: 'medos-html', richText: q.stem_html, richExplanation: q.explanation_html,
        caseGroup: q.caseGroup, parentQId: q.parentQId,
        media: q.media || [], explanationMedia: q.explanation_media || [],
        source: { bank, questionId: q.id, displayId:q.displayId, aliases:q.aliases, references:q.sources },
        answerStats: q.answer_stats, subjectId: q.subject_id, systemId: q.system_id,
        questionType: q.type || 'mcq', matching: q.matching,
        options: q.choices.map((text, index) => ({ id: String(index + 1), text, richText: q.choices_html?.[index] || '', percent: q.answer_percentages?.[index], isCorrect: index + 1 === Number(q.correct) })),
        tags: { subject: q.subject_names?.length ? q.subject_names : q.subject ? [q.subject] : ['General'], system: q.system_groups?.length ? q.system_groups : q.system_group ? [q.system_group] : q.system ? [q.system] : ['General'], major: [], minor: q.system_detail ? [q.system_detail] : [] },
        _tutorMode: form.get('mode') !== 'exam', _timerMode: form.get('timer'), _timerScope: 'question', _timerSecs: form.get('timer') === 'down' ? 90 : 0 };
    },
    captureMarkup(q, container) {
      const content = (container.querySelector('.ml-rich-content') || container).cloneNode(true);
      content.querySelectorAll('.qa-patient-section').forEach(section=>{
        const heading=section.querySelector('summary > :is(h1,h2,h3,h4,h5,h6)');
        if(heading)section.replaceWith(heading,...[...section.childNodes].filter(node=>node.nodeName!=='SUMMARY'));
      });
      content.querySelectorAll('.qa-patient-help').forEach(node=>node.remove());
      content.querySelectorAll('.qa-patient-card').forEach(card=>card.classList.remove('qa-patient-card'));
      // Display-only lab splitting must not rewrite the saved source table.
      const layouts=[...container.querySelectorAll('.qa-lab-grid')];
      content.querySelectorAll('.qa-lab-grid').forEach((grid,index)=>{
        const original=layouts[index]?._qaSourceTable?.cloneNode(true);if(!original)return;
        grid.querySelectorAll('tr[data-qa-source-row]').forEach(row=>{
          const replacement=row.cloneNode(true),old=original.rows[Number(row.dataset.qaSourceRow)];
          replacement.removeAttribute('data-qa-source-row');old?.replaceWith(replacement);
        });grid.replaceWith(original);
      });
      content.querySelectorAll('.ml-media-unavailable[data-ml-src]').forEach(notice => {
        const media = document.createElement(['video','audio'].includes(notice.dataset.mlTag) ? notice.dataset.mlTag : 'img');
        media.setAttribute('src', notice.dataset.mlSrc); notice.replaceWith(media);
      });
      content.querySelectorAll('[data-ml-extra]').forEach(el => el.remove());
      if (q._ambossHintHtml && !content.querySelector('details.qbank-hint')) {
        const hint = document.createElement('template');hint.innerHTML=q._ambossHintHtml;content.append(hint.content.cloneNode(true));
      }
      content.querySelectorAll('[src], [href]').forEach(el => {
        for (const attr of ['src', 'href']) {
          const value = el.getAttribute(attr) || '';
          const match = value.match(/\/medical-library\/media\/[^/]+\/(\d+)\/([^?#]+)/);
          if (match) el.setAttribute(attr, '/qbank/media/' + match[1] + '/' + decodeURIComponent(match[2]));
        }
      });
      q.richText = content.innerHTML;
    },
    layoutLabTables(root) {
      root.querySelectorAll('table').forEach(table=>{
        if(table.closest('.qa-lab-grid')||table.querySelector('input,button,img,table')||table.querySelector('td[rowspan],th[rowspan]'))return;
        const rows=[...table.rows];if(rows.length<6)return;
        const sections=[];let current=[];
        rows.forEach(row=>{
          const cells=[...row.cells],label=cells.map(cell=>cell.textContent.trim()).filter(Boolean);
          const heading=label.length===1&&/^(serum|blood|urine|plasma|cerebrospinal fluid|csf|hematology|chemistry)$/i.test(label[0]);
          if(heading&&current.length){sections.push(current);current=[];}current.push(row);
        });if(current.length)sections.push(current);
        if(sections.length!==2||sections.some(section=>section.length<2)||rows.some(row=>[...row.cells].reduce((n,c)=>n+c.colSpan,0)>2))return;
        const grid=document.createElement('div');grid.className='qa-lab-grid';grid._qaSourceTable=table.cloneNode(true);
        sections.forEach(section=>{const part=table.cloneNode(false);part.removeAttribute('id');const body=document.createElement('tbody');section.forEach(row=>{row.dataset.qaSourceRow=rows.indexOf(row);body.append(row);});part.append(body);grid.append(part);});table.replaceWith(grid);
      });
    },
    layoutClinicalNotes(root) {
      const headings=[...root.querySelectorAll('h2,h3,h4')];
      const first=headings.find(heading=>/^patient information$/i.test(heading.textContent.trim()));
      if(!first || !headings.some(heading=>/^history$/i.test(heading.textContent.trim())))return;
      const parent=first.parentElement;
      if(parent.querySelector('.qa-patient-section'))return;
      const direct=[...parent.children].filter(el=>/^H[234]$/.test(el.tagName));
      if(direct.length<2)return;
      parent.classList.add('qa-patient-card');
      const help=document.createElement('small');help.className='qa-patient-help';help.textContent='Click a header to expand or collapse its section.';parent.before(help);
      for(const heading of direct){
        const nodes=[];let node=heading.nextSibling;
        while(node&&!(/^H[234]$/.test(node.nodeName))){const next=node.nextSibling;nodes.push(node);node=next;}
        const section=document.createElement('details');section.className='qa-patient-section';section.open=/^patient information$/i.test(heading.textContent.trim());
        const summary=document.createElement('summary');heading.before(section);summary.append(heading);section.append(summary,...nodes);
      }
    },
    clearHighlights(q) {
      const template = document.createElement('template'); template.innerHTML = q.richText || '';
      template.content.querySelectorAll('span[class]').forEach(el => {
        if ([...el.classList].some(c => /^highlight(?:-[a-z]+)?$/.test(c))) el.replaceWith(...el.childNodes);
      });
      q.richText = template.innerHTML;
    },
    // Allow-list imported markup and resolve local media at render time so saved
    // sessions survive backend port changes. Ordinary Qnex questions use Markdown.
    renderContent(q, kind, option) {
      if (q.contentFormat !== 'medos-html') {
        const text = option ? option.text : kind === 'explanation' ? q.explanation : (q.text || q.body || q.content);
        return window.Markdown ? window.Markdown.render(text || '') : escape(text || '');
      }
      const markup = option ? option.richText || escape(option.text) : kind === 'explanation' ? q.richExplanation || escape(q.explanation) : q.richText || escape(q.text);
      const template = document.createElement('template'); template.innerHTML = markup || '';
      if(kind==='question'&&!option&&q.caseGroup&&!window.DungeonBase?.caseFeedbackAllowed(q)){template.content.querySelectorAll('details.qbank-hint').forEach(hint=>{q._ambossHintHtml ||= hint.outerHTML;hint.remove();});}
      const allowed = new Set('P DIV SPAN FONT CENTER BR STRONG B EM I U S SUB SUP UL OL LI TABLE THEAD TBODY TFOOT TR TD TH CAPTION H1 H2 H3 H4 H5 H6 BLOCKQUOTE IMG A FIGURE FIGCAPTION HR VIDEO AUDIO SOURCE PRE CODE DETAILS SUMMARY'.split(' '));
      const assets = option ? [] : kind === 'explanation' ? (q.source.bank.startsWith('mehlman-') ? [] : q.explanationMedia) : q.media;
      const knownNames = new Set([...(q.media || []), ...(q.explanationMedia || [])].map(a => a.name.toLowerCase()));
      const mediaExtension = /\.(?:jpe?g|png|gif|webp|svg|mp4|webm|mov|m4v|mp3|wav|ogg)$/i;
      const url = raw => {
        const value = String(raw || '').trim();
        const exhibit = value.match(/\/qbank\/exhibit\/(\d{3,8})(?:[?#]|$)/) || value.match(/^(?:\.\/)?(\d{3,8})\.html(?:[?#].*)?$/);
        if (exhibit) return `${window.fileSystemService.baseUrl}/medical-library/exhibit/${encodeURIComponent(q.source.bank)}/${q.source.questionId}/${exhibit[1]}`;
        if (/\/medical-library\/exhibit\//.test(value)) return value;
        const match = value.match(/\/qbank\/media\/(\d+)\/([^?#]+)(?:[?#].*)?$/) || value.match(/\/medical-library\/media\/[^/]+\/(\d+)\/([^?#]+)(?:[?#].*)?$/);
        let name;
        try { name = decodeURIComponent(match ? match[2] : value.replace(/^https?:\/\/[^/]+\/.*?(?:webmedia|media)\//i, '').replace(/^(?:\.\.\/|\.\/)*(?:media\/)?/i, '').split(/[?#]/)[0]); } catch { return null; }
        if (!name || /[\\/]/.test(name) || !mediaExtension.test(name)) return null;
        return `${window.fileSystemService.baseUrl}/medical-library/media/${encodeURIComponent(q.source.bank)}/${match ? match[1] : q.source.questionId}/${encodeURIComponent(name)}`;
      };
      template.content.querySelectorAll('*').forEach(el => {
        if (!allowed.has(el.tagName)) { el.remove(); return; }
        if (el.tagName === 'IMG' && !el.getAttribute('src') && el.getAttribute('data-src')) el.setAttribute('src', el.getAttribute('data-src'));
        for (const attr of [...el.attributes]) {
          if(attr.name==='class' && q.source.bank.startsWith('amboss') && ['selected','wichtig','qbank-hint','qbank-hint-body'].includes(attr.value)) continue;
          if (attr.name === 'class' && el.tagName === 'SPAN' && /^highlight(?:-(?:yellow|green|blue|pink|purple|orange|red))?$/.test(attr.value)) continue;
          if (attr.name === 'data-qnex-highlight' && el.tagName === 'SPAN' && /^hl-[a-z0-9-]+$/.test(attr.value)) continue;
          if (!['src', 'href', 'alt', 'title', 'colspan', 'rowspan'].includes(attr.name)) el.removeAttribute(attr.name);
        }
        for (const attr of ['src', 'href']) {
          if (!el.hasAttribute(attr)) continue;
          const rawValue = el.getAttribute(attr).trim();
          const safeLink = attr === 'href' && !/^(?:javascript:|data:)/i.test(rawValue) ? rawValue : null;
          const safe = url(rawValue) || safeLink;
          if (safe) el.setAttribute(attr, safe);
          else { el.removeAttribute(attr); if (el.tagName === 'A') el.title = 'This reference is not available in Qnex yet.'; }
        }
        if (el.tagName === 'VIDEO' || el.tagName === 'AUDIO') el.setAttribute('controls', '');
        if (el.tagName === 'A' && el.hasAttribute('href')) { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
      });
      const makeMedia = (src, name = '') => {
        const tag = /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(src) ? 'video' : /\.(mp3|wav|ogg)(?:[?#]|$)/i.test(src) ? 'audio' : 'img';
        const media = document.createElement(tag); media.src = src;
        if (tag === 'img') { media.alt = 'Question illustration'; media.loading = 'lazy'; media.decoding = 'async'; }
        else { media.controls = true; media.preload = 'metadata'; }
        if (name) media.title = name;
        return media;
      };
      // MedOS keeps figure links in the sentence and opens them in its viewer.
      // Preserve the author's linked words rather than replacing them with images.
      template.content.querySelectorAll('a[href]').forEach(anchor => {
        const href = anchor.getAttribute('href') || '';
        if (url(href) && (/\.(?:jpe?g|png|gif|webp|svg)(?:[?#]|$)/i.test(href) || href.includes('/medical-library/exhibit/'))) {
          anchor.classList.add('ml-figure-link');
          anchor.removeAttribute('target');
          if (!anchor.title) anchor.title = 'Open figure';
          if (href.includes('/medical-library/exhibit/')) {
            anchor.dataset.mlBank = q.source.bank;
            anchor.dataset.mlQid = q.source.questionId;
          }
        }
      });
      const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
      const textNodes = []; while (walker.nextNode()) textNodes.push(walker.currentNode);
      for (const node of textNodes) {
        if (node.parentElement?.closest('a,code,pre')) continue;
        const name = node.textContent.trim().replace(/^\[|\]$/g, '');
        if (!mediaExtension.test(name) || (!knownNames.has(name.toLowerCase()) && !/^\d[\w.-]*\.(?:jpe?g|png|gif|webp)$/i.test(name))) continue;
        const src = url(name); if (src) node.replaceWith(makeMedia(src, name));
      }
      const displayed = new Set([...template.content.querySelectorAll('[src], a.ml-figure-link[href]')].map(el => el.getAttribute('src') || el.getAttribute('href')));
      for (const asset of assets || []) {
        const src = url(asset.url); if (!src) continue;
        if (displayed.has(src)) continue;
        displayed.add(src);
        const media = makeMedia(src, asset.name);
        const figure = document.createElement('figure'); figure.dataset.mlExtra = 'true'; figure.append(media); template.content.append(figure);
      }
      if(kind==='explanation' && !option && q.source.bank.startsWith('mehlman-')) {
        const recordings=new Map(); const inlineRecordings=new Set();
        const add=raw=>{const src=url(raw);if(src && /\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(src)) recordings.set(src,true);};
        for(const asset of q.explanationMedia || []) add(asset.url || asset.name);
        template.content.querySelectorAll('audio').forEach(audio=>{
          const src=url(audio.getAttribute('src'));if(src)inlineRecordings.add(src);audio.querySelectorAll('source').forEach(source=>{const src=url(source.getAttribute('src'));if(src)inlineRecordings.add(src);});audio.classList.add('ml-inline-voice');audio.preload='metadata';audio.removeAttribute('autoplay');
        });
        template.content.querySelectorAll('a[href]').forEach(anchor=>{
          if(/\.(?:mp3|wav|ogg)(?:[?#]|$)/i.test(anchor.getAttribute('href'))) {
            add(anchor.getAttribute('href'));
            if(mediaExtension.test(anchor.textContent.trim()))anchor.remove();else anchor.replaceWith(...anchor.childNodes);
          }
        });
        inlineRecordings.forEach(src=>recordings.delete(src)); if(recordings.size) {
          const section=document.createElement('section');section.className='ml-voice-notes';section.setAttribute('aria-label','Explanation voice notes');
          const label=document.createElement('div');label.className='ml-voice-heading';label.textContent='Voice notes';section.append(label);
          [...recordings.keys()].forEach((src,index)=>{
            const row=document.createElement('div');row.className='ml-voice-row';
            const title=document.createElement('span');title.textContent=recordings.size>1 ? 'Note '+(index+1) : 'Listen';
            const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.src=src;audio.setAttribute('aria-label','Voice note '+(index+1));
            row.append(title,audio);section.append(row);
          });template.content.append(section);
        }
      }
      template.content.querySelectorAll('table').forEach(table => {
        if(table.parentElement?.closest('table')) return;
        const wrapper = document.createElement('div'); wrapper.className = 'ml-table-scroll'; table.replaceWith(wrapper);
        const answerRows=[...table.tBodies].flatMap(body=>[...body.rows]);
        if(kind==='question' && answerRows.length>=2 && answerRows.every(row=>row.cells.length>=2 && /^[A-Z]$/.test(row.cells[0].textContent.trim())) && table.tHead?.rows[0]?.cells[0]?.textContent.trim()==='') {
          table.classList.add('ml-answer-reference');wrapper.classList.add('ml-answer-reference-wrap');
        }
        wrapper.append(table);
      });
      return '<div class="ml-rich-content">' + template.innerHTML + '</div>';
    },
    updateSummary(summary) {
      this.sessions = [summary, ...this.sessions.filter(s => s.id !== summary.id)];
      this.mergeSessionSummaries();
      window.QBankDashboard?.refreshVisible();
    },
    mergeSessionSummaries() {
      const qb = window.QuestionBase;
      if (!qb) return;
      qb.state.recentSessions = [...this.sessions, ...qb.state.recentSessions.filter(s => !s.library)].sort((a, b) => b.date.localeCompare(a.date));
      qb.renderRecentSessions();
    },
    async loadSummaries() {
      try { this.sessions = await this.api('/sessions'); this.mergeSessionSummaries(); }
      catch (error) { console.warn('[Medical Library]', error.message); }
    },
    saveDungeonSession(dungeon) {
      if (!this.active || this.active.id !== dungeon.state.associatedSessionId) return Promise.resolve();
      const snapshot = JSON.parse(JSON.stringify({ ...this.active, questions: dungeon.state.questions, completed: dungeon.state.isBlockRevealed }));
      if (dungeon.timerStart && dungeon._timerQuestion) {
        const live = dungeon._timerQuestion, copy = snapshot.questions.find(q => q.id === live.id);
        const elapsed = Math.max(0,Date.now()-dungeon.timerStart);
        if (copy) {
          const spent = live._timerMode === 'down' ? Math.min(elapsed,dungeon._timerInitialMs ?? elapsed) : elapsed;
          copy.timerElapsed = (copy.timerElapsed || 0)+spent;
          if (live._timerMode === 'down' && live._timerScope === 'session') snapshot.questions.forEach(q => { q._blockRemainingMs=Math.max(0,(dungeon._timerInitialMs ?? live._timerSecs*1000)-elapsed); });
          else if (live._timerMode === 'down') copy._remainingMs=Math.max(0,(dungeon._timerInitialMs ?? live._timerSecs*1000)-elapsed);
        }
      }
      this.active = snapshot;
      const save = this.saveQueue.catch(() => {}).then(async () => {
        const summary = await this.api('/sessions/' + snapshot.id, { method: 'PUT', body: JSON.stringify(snapshot) });
        this.updateSummary(summary); dungeon.updateSaveStatus('saved');
      });
      this.saveQueue = save;
      return save.catch(error => { dungeon.updateSaveStatus('error'); this.status('Could not save this session: ' + error.message, true); throw error; });
    },
    async resume(id, questionId) {
      const loading = document.createElement('div'); loading.className = 'qw-preparation-screen';
      loading.innerHTML = `<div class="qw-preparation-content" role="status">${window.QBankWorkspace.loadingLogo()}<h2>Loading your session</h2></div>`;
      document.body.append(loading);
      try {
        await this.saveQueue.catch(() => {});
        const session = await this.api('/sessions/' + id); this.active = session;
        // Repair context in pre-case saved blocks without silently adding items.
        for(const q of session.questions.filter(q=>q.source?.bank==='amboss2'&&[1074,1075].includes(q.source.questionId)&&!q.caseGroup)){
          try{const data=await this.api(`/question-detail?bank=amboss2&qid=${q.source.questionId}`);const group=data.question?.caseGroup;
            if(group){const complete=group.itemIds.every(itemId=>session.questions.some(item=>item.source?.questionId===itemId));
              q.caseGroup={...group,contextOnly:!complete};}
          }catch(error){console.warn('Could not recover saved case context:',error.message);}
        }
        // Restore table structure from the source when older highlights wrapped rows/cells.
        for (const q of session.questions.filter(q => q.source && /<table\b/i.test(q.richText || ''))) {
          try {
            const data = await this.api(`/question-detail?bank=${encodeURIComponent(q.source.bank)}&qid=${q.source.questionId}`);
            const fresh = this.adapt(data.question, q.source.bank, new FormData());
            const saved = document.createElement('template'); saved.innerHTML = q.richText;
            const source = document.createElement('template'); source.innerHTML = fresh.richText;
            const originalTables = [...source.content.querySelectorAll('table')];
            saved.content.querySelectorAll('table').forEach((table, index) => {
              const original = originalTables[index]; if (!original) return;
              const shape = el => [...el.rows].map(row => [...row.cells].map(cell => `${cell.colSpan}:${cell.rowSpan}`).join(',')).join(';');
              if (shape(table) !== shape(original)) table.replaceWith(original.cloneNode(true));
            });
            q.richText = saved.innerHTML;
          } catch (error) { console.warn('Could not restore source table:', error.message); }
        }
        window.DungeonBase.open(session.questions, id);
        window.DungeonBase.state.isBlockRevealed = !!session.completed;
        if (questionId) {
          const index = session.questions.findIndex(q => q.id === questionId);
          if (index >= 0) window.DungeonBase.jumpToQuestion(index);
        }
      } catch (error) { alert('Could not open this session: ' + error.message); }
      finally { loading.remove(); }
    },
    async remove(id) {
      if (!confirm('Delete this Qnex study session? The question bank will remain available.')) return;
      try {
        await this.saveQueue.catch(() => {});
        await this.api('/sessions/' + id, { method: 'DELETE' });
        this.sessions = this.sessions.filter(s => s.id !== id); this.mergeSessionSummaries(); this.renderSessions();
      } catch (error) { alert(error.message); }
    },
    async reset(id, launch = true) {
      if (!confirm('Reset this test’s questions to New? Saved answers, timing and answer changes for this test will be cleared.')) return false;
      try {
        await this.saveQueue.catch(() => {});
        const session = await this.api('/sessions/' + id); session.completed = false;
        for (const q of session.questions) { delete q._caseAdvanced; delete q.submittedAnswer; delete q.answerChanges; delete q.timerElapsed; delete q.revealed; delete q._remainingMs; delete q._blockRemainingMs; delete q._timedOut; q.crossedOutOptionIds = []; }
        this.updateSummary(await this.api('/sessions/' + id, { method: 'PUT', body: JSON.stringify(session) }));
        if(this.active?.id===id)this.active=null;
        this.mergeSessionSummaries();
        if(launch) await this.resume(id);
        return true;
      } catch (error) { alert(error.message); return false; }
    },
    renderSessions() {
      const container = document.getElementById('mlSavedSessions'); if (!container) return;
      const icon=path=>'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>';
      const workspace = window.QBankWorkspace;
      const rows = [...this.sessions].sort((a,b) => new Date(b.date || b.updatedAt) - new Date(a.date || a.updatedAt));
      container.innerHTML='<div class="qw-section-heading"><h3>All sessions</h3><button class="qw-icon" data-clear-sessions title="Clear all study sessions" aria-label="Clear all study sessions" '+(rows.length ? '' : 'disabled')+'>'+icon('m6 6 12 12M6 18 18 6')+'</button></div>'+workspace.sessionTable(rows, true);
      workspace.wireUnsee(container,()=>this.renderSessions());
      container.querySelectorAll('[data-resume]').forEach(button=>button.onclick=()=>this.resume(button.dataset.resume));
      container.querySelectorAll('[data-rename]').forEach(button=>button.onclick=()=>workspace.rename(this.sessions.find(s=>s.id===button.dataset.rename),()=>this.renderSessions()));
      container.querySelectorAll('[data-result]').forEach(button=>button.onclick=async()=>{
        button.disabled=true;
        try {
          const session=await this.api('/sessions/'+encodeURIComponent(button.dataset.result));
          const bank=this.banks.find(b=>b.key===session.bank) || {label:session.bank || 'Qbank'};
          workspace.results(container,bank,session,()=>this.renderSessions());
        } catch(error) { window.showToast?.(error.message,'error'); button.disabled=false; }
      });
      const remove=async(ids,button)=>{
        if(!confirm(ids.length===1 ? 'Delete this study session and its saved answers?' : 'Delete all '+ids.length+' study sessions across your question banks? Their saved answers and statistics will also be removed.'))return;
        button.disabled=true;
        try{await this.saveQueue;for(const id of ids){await this.api('/sessions/'+encodeURIComponent(id),{method:'DELETE'});this.sessions=this.sessions.filter(s=>s.id!==id);if(this.active?.id===id)this.active=null;}this.mergeSessionSummaries();this.renderSessions();window.QBankDashboard?.refreshVisible();window.showToast('Study sessions deleted.','success');}
        catch(error){this.renderSessions();window.showToast(escape('Could not delete sessions: '+error.message),'error');}
      };
      container.querySelectorAll('[data-delete-session]').forEach(button=>button.onclick=()=>remove([button.dataset.deleteSession],button));
      const clear=container.querySelector('[data-clear-sessions]');if(clear)clear.onclick=()=>remove(this.sessions.map(s=>s.id),clear);

    }
  };
  window.MedicalLibrary = Library;
  document.addEventListener('play', event=>{
    if(!event.target.matches?.('.ml-voice-notes audio, audio.ml-inline-voice')) return;
    document.querySelectorAll('.ml-voice-notes audio, audio.ml-inline-voice').forEach(audio=>{if(audio!==event.target)audio.pause();});
  },true);
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const tableButton=target?.closest('.ml-rich-content .ml-table-open');
    if(tableButton) {
      event.preventDefault();event.stopPropagation();
      const table=tableButton.parentElement.querySelector('table');
      if(table) window.DungeonBase?.openImageViewer('', '<div class="ml-rich-content"><div class="ml-table-scroll">'+table.outerHTML+'</div></div>');
      return;
    }
    const link = target?.closest('.ml-rich-content a.ml-figure-link');
    const image = target?.closest('.ml-rich-content img, .qa-answer-explanation img');
    if (!link && !image) return;
    event.preventDefault();
    event.stopPropagation();
    const src = link?.getAttribute('href') || image?.getAttribute('src');
    if (!src || !window.DungeonBase?.openImageViewer) return;
    if (link && src.includes('/medical-library/exhibit/')) {
      const viewer = window.DungeonBase;
      viewer.openImageViewer('', '<p role="status">Loading figure…</p>');
      const requestId = viewer._exhibitRequestId;
      Library.api(src.slice(window.fileSystemService.baseUrl.length + '/medical-library'.length)).then(result => {
        if (requestId !== viewer._exhibitRequestId || !document.getElementById('dungeonImageViewer')?.classList.contains('visible')) return;
        const html = Library.renderContent({contentFormat:'medos-html',source:{bank:link.dataset.mlBank,questionId:result.qid},richExplanation:result.html}, 'explanation');
        viewer.openImageViewer('', html);
      }).catch(error => {
        if (requestId === viewer._exhibitRequestId && document.getElementById('dungeonImageViewer')?.classList.contains('visible')) viewer.openImageViewer('', `<p role="alert">${escape(error.message)}</p>`);
      });
    } else window.DungeonBase.openImageViewer(src);
  }, true);
  const showMediaError = event => {
    const media = event.target;
    if (!media?.matches?.('.ml-rich-content img, .ml-rich-content video, .ml-rich-content audio, .qa-stem img, .qa-answer-explanation img, #viewerImage') || !media.isConnected) return;
    const notice = document.createElement('span'); notice.className = 'ml-media-unavailable'; notice.setAttribute('role', 'status');
    notice.dataset.mlSrc = media.getAttribute('src') || ''; notice.dataset.mlTag = media.tagName.toLowerCase();
    const icon=document.createElement('span');icon.className='ml-media-sad';icon.setAttribute('aria-hidden','true');icon.textContent=':(';
    const message=document.createElement('span');message.className='ml-media-error-text';message.textContent='Image unavailable — the source file may be missing or damaged.';notice.append(icon,message);
    media.closest('.qa-stem-figure,.qa-explanation-preview')?.querySelector('.qa-picture-expand')?.setAttribute('hidden','');
    const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = 'Retry';
    retry.onclick = () => { const src = media.getAttribute('src'); notice.replaceWith(media); media.closest('.qa-stem-figure,.qa-explanation-preview')?.querySelector('.qa-picture-expand')?.removeAttribute('hidden'); media.setAttribute('src', src); if (media.load) media.load(); };
    notice.append(retry);
    if(media.id==='viewerImage'){media.hidden=true;media.parentElement.append(notice);retry.onclick=()=>{notice.remove();media.hidden=false;media.src=notice.dataset.mlSrc;};}
    else media.replaceWith(notice);
  };
  document.addEventListener('error', showMediaError, true);
  const mediaObserver = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const images = node.matches('img') ? [node] : [...node.querySelectorAll('img')];
      images.forEach(img => { if (img.complete && !img.naturalWidth && img.getAttribute('src')) showMediaError({target:img}); });
    }
  });
  mediaObserver.observe(document.body, {childList:true, subtree:true});
})();
