/* ==========================================================================
   STATIC MOCK EXAM CONTENT & VOCABULARY LIBRARY
   ========================================================================== */

const MockIELTSData = {
  // Pre-seeded academic vocabulary
  vocabulary: [
    {
      word: 'sustainable',
      ipa: '/səˈsteɪnəbl/',
      meaningVi: 'bền vững, thân thiện với môi trường',
      meaningEn: 'Able to be maintained at a certain rate or level, avoiding depletion of natural resources.',
      partOfSpeech: 'adjective',
      example: 'Sustainable development is crucial for preserving our environment for future generations.',
      topic: 'Environment',
      source: 'Cambridge 17 - Test 2 Reading',
      difficulty: 'Trung bình',
      status: 'Chưa thuộc'
    },
    {
      word: 'abandon',
      ipa: '/əˈbændən/',
      meaningVi: 'ruồng bỏ, từ bỏ, hủy bỏ',
      meaningEn: 'Cease to support or look after; give up completely.',
      partOfSpeech: 'verb',
      example: 'The company decided to abandon the project due to high maintenance costs.',
      topic: 'General',
      source: 'General Academic Wordlist',
      difficulty: 'Dễ',
      status: 'Chưa thuộc'
    },
    {
      word: 'accurate',
      ipa: '/ˈækjərət/',
      meaningVi: 'chính xác, đúng đắn',
      meaningEn: 'Correct in all details; exact.',
      partOfSpeech: 'adjective',
      example: 'Scientists need accurate measurements to draw correct conclusions.',
      topic: 'Technology',
      source: 'Cambridge 15 - Test 1 Reading',
      difficulty: 'Dễ',
      status: 'Chưa thuộc'
    },
    {
      word: 'acquire',
      ipa: '/əˈkwaɪə(r)/',
      meaningVi: 'thu nhận được, đạt được',
      meaningEn: 'Buy or obtain an asset or object; learn or develop a skill.',
      partOfSpeech: 'verb',
      example: 'Children acquire language naturally through exposure and interaction.',
      topic: 'Education',
      source: 'General Academic Wordlist',
      difficulty: 'Trung bình',
      status: 'Chưa thuộc'
    },
    {
      word: 'domestic',
      ipa: '/dəˈmestɪk/',
      meaningVi: 'thuộc về gia đình, nội địa',
      meaningEn: 'Relating to the running of a home or to the family; existing or occurring within a particular country.',
      partOfSpeech: 'adjective',
      example: 'The domestic market has shown steady growth over the past quarter.',
      topic: 'General',
      source: 'Cambridge 16 - Test 3 Reading',
      difficulty: 'Dễ',
      status: 'Chưa thuộc'
    },
    {
      word: 'evidence',
      ipa: '/ˈevɪdəns/',
      meaningVi: 'bằng chứng, chứng cứ',
      meaningEn: 'The available body of facts or information indicating whether a belief or proposition is true.',
      partOfSpeech: 'noun',
      example: 'There is no scientific evidence to support this theory.',
      topic: 'General',
      source: 'Cambridge 17 - Test 1 Reading',
      difficulty: 'Dễ',
      status: 'Chưa thuộc'
    },
    {
      word: 'sufficient',
      ipa: '/səˈfɪʃnt/',
      meaningVi: 'đủ, có năng lực',
      meaningEn: 'Enough; adequate.',
      partOfSpeech: 'adjective',
      example: 'We must ensure that we have sufficient food supplies for the journey.',
      topic: 'Health',
      source: 'Cambridge 18 - Test 3 Reading',
      difficulty: 'Trung bình',
      status: 'Chưa thuộc'
    },
    {
      word: 'biodiversity',
      ipa: '/ˌbaɪəʊdaɪˈvɜːsəti/',
      meaningVi: 'đa dạng sinh học',
      meaningEn: 'The variety of plant and animal life in the world or in a particular habitat.',
      partOfSpeech: 'noun',
      example: 'Deforestation is one of the leading causes of the loss of global biodiversity.',
      topic: 'Environment',
      source: 'Cambridge 17 - Test 2 Reading',
      difficulty: 'Khó',
      status: 'Chưa thuộc'
    },
    {
      word: 'breakthrough',
      ipa: '/ˈbreɪkθruː/',
      meaningVi: 'bước đột phá',
      meaningEn: 'A sudden, dramatic, and important discovery or development.',
      partOfSpeech: 'noun',
      example: 'Artificial intelligence achieved a major breakthrough in image processing recently.',
      topic: 'Technology',
      source: 'Cambridge 16 - Test 4 Reading',
      difficulty: 'Trung bình',
      status: 'Chưa thuộc'
    },
    {
      word: 'cognitive',
      ipa: '/ˈkɒɡnətɪv/',
      meaningVi: 'liên quan đến nhận thức',
      meaningEn: 'Relating to cognition; the mental action or process of acquiring knowledge.',
      partOfSpeech: 'adjective',
      example: 'Studies show that bilingualism can enhance cognitive flexibility in elderly people.',
      topic: 'Education',
      source: 'Cambridge 18 - Test 1 Reading',
      difficulty: 'Khó',
      status: 'Chưa thuộc'
    }
  ],

  // Cambridge Books Database
  books: [
    {
      id: 'cam_17',
      title: 'Cambridge IELTS 17',
      description: 'Đề thi thử IELTS chính thức xuất bản năm 2022',
      tests: [
        {
          number: 'Test 2',
          reading: {
            title: 'Sustainable Agriculture & Global Food Supply',
            passages: [
              {
                number: 1,
                title: 'The Development of Sustainable Agriculture',
                content: `
                  <p><strong>A.</strong> Agriculture has always been an organic process, depending on the forces of nature, soil fertility, and human labour. However, during the mid-20th century, the rapid growth of the global population led to the "Green Revolution". This era saw the introduction of high-yielding crop varieties, chemical synthetic fertilizers, and powerful pesticides. While these technological developments successfully averted global famine, they did so at a high ecological cost. The intensive farming practices have resulted in severe soil degradation, chemical runoffs, and a catastrophic loss of natural biodiversity.</p>
                  
                  <p><strong>B.</strong> Today, scientists and progressive farmers are advocating for a return to sustainable agriculture. This approach aims to produce abundant food without depleting the Earth's natural resources or polluting the ecosystem. It relies heavily on ecological concepts such as crop rotation, integrated pest management, and natural organic composts. For instance, growing legumes (like beans or peas) fixes nitrogen naturally in the soil, completely reducing the necessity for chemical fertilizers.</p>
                  
                  <p><strong>C.</strong> Another key component of sustainable farming is water conservation. Traditional overhead irrigation systems are incredibly wasteful, losing up to 40% of water through evaporation. Modern micro-irrigation or drip systems deliver water directly to the plant's roots, minimizing waste. However, implementing these premium technologies requires initial capital, which is a major barrier for small-scale farmers in developing countries.</p>

                  <p><strong>D.</strong> Despite these constraints, the market for organically grown and sustainably sourced foods is experiencing exponential growth worldwide. Consumers are increasingly willing to pay a premium price for items certified as environment-friendly. Ultimately, shifting to global sustainable farming is not merely a moral choice but a vital necessity to ensure food security for the projected 9 billion humans by 2050.</p>
                `,
                questions: [
                  {
                    type: 'y_n_ng', // True/False/Not Given
                    instruction: 'Do the following statements agree with the information given in Reading Passage 1? Write: TRUE (đúng), FALSE (sai) hoặc NOT GIVEN (không có thông tin).',
                    items: [
                      { num: 1, text: 'Synthetic chemicals were first used in agriculture during the Green Revolution.', answer: 'TRUE' },
                      { num: 2, text: 'Green Revolution practices did not succeed in preventing widespread starvation.', answer: 'FALSE' },
                      { num: 3, text: 'Crop rotation using legumes helps deposit nitrogen into the soil.', answer: 'TRUE' },
                      { num: 4, text: 'Drip irrigation systems are fully subsidized by governments in developing nations.', answer: 'FALSE' },
                      { num: 5, text: 'Consumers in Western countries buy more organic foods than those in Asian countries.', answer: 'NOT GIVEN' }
                    ]
                  },
                  {
                    type: 'gap_fill', // Gap Filling
                    instruction: 'Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
                    items: [
                      { num: 6, text: 'Traditional overhead irrigation systems waste a large volume of water due to ______.', answer: 'evaporation' },
                      { num: 7, text: 'The high initial ______ is the main obstacle for small farmers when investing in drip systems.', answer: 'capital' },
                      { num: 8, text: 'By the year 2050, sustainable agriculture will be vital to ensure global ______.', answer: 'food security' }
                    ]
                  },
                  {
                    type: 'mcq', // Multiple Choice
                    instruction: 'Choose the correct letter, A, B, C or D.',
                    items: [
                      {
                        num: 9,
                        text: 'What is the main topic of paragraph B?',
                        options: [
                          'A. The history of the Green Revolution.',
                          'B. Key ecological methods of sustainable farming.',
                          'C. The economic benefits of pesticide applications.',
                          'D. Why global populations are growing quickly.'
                        ],
                        answer: 'B'
                      },
                      {
                        num: 10,
                        text: 'Which irrigation system is recommended for water conservation?',
                        options: [
                          'A. Traditional overhead systems',
                          'B. Synthetic composting systems',
                          'C. Drip irrigation systems',
                          'D. Flood irrigation systems'
                        ],
                        answer: 'C'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          listening: {
            title: 'Accommodation and Study Planner Services',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Standard sample mp3
            transcript: `
              <p><strong>Officer:</strong> Good morning. Can I help you?</p>
              <p><strong>Student:</strong> Yes, I'd like to ask about the student housing facilities for the upcoming semester. I am enrolling in the English Academic Course.</p>
              <p><strong>Officer:</strong> Welcome to IELTS University! I can help you with that. Let's fill out an application form first. What is your full name?</p>
              <p><strong>Student:</strong> It's Thang Nguyen. That's T-H-A-N-G, then N-G-U-Y-E-N.</p>
              <p><strong>Officer:</strong> Got it. What is your contact phone number?</p>
              <p><strong>Student:</strong> My phone number is 0912345678.</p>
              <p><strong>Officer:</strong> Great. Now, do you prefer a single room or a shared room?</p>
              <p><strong>Student:</strong> I prefer a single room because I need a quiet space to focus on my study plan and vocabulary notes.</p>
              <p><strong>Officer:</strong> Perfect. That costs 150 dollars per week. Are you comfortable with that budget?</p>
              <p><strong>Student:</strong> Yes, that is within my budget. I'd like to pay by credit card.</p>
              <p><strong>Officer:</strong> Excellent. Accommodation starts on September 1st. You will receive a voucher via email.</p>
            `,
            questions: [
              {
                section: 1,
                instruction: 'Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
                items: [
                  { num: 1, label: 'Full Name:', text: 'Thang ______', answer: 'Nguyen' },
                  { num: 2, label: 'Contact Number:', text: '______', answer: '0912345678' },
                  { num: 3, label: 'Room Preference:', text: '______ room', answer: 'single' },
                  { num: 4, label: 'Weekly Rent Cost:', text: '$ ______', answer: '150' },
                  { num: 5, label: 'Start Date:', text: 'September ______', answer: '1st' }
                ]
              }
            ]
          },
          writing: {
            tasks: [
              {
                number: 'Task 1',
                prompt: 'The table below shows the percentage of people living in urban areas in different parts of the world from 1950 to 2030 (projected). Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
                tips: 'Write at least 150 words. Spend about 20 minutes.'
              },
              {
                number: 'Task 2',
                prompt: 'Some people believe that technology makes life more complicated. To what extent do you agree or disagree with this statement?',
                tips: 'Write at least 250 words. Spend about 40 minutes.'
              }
            ]
          },
          speaking: {
            parts: [
              {
                number: 'Part 1: Introduction & Interview',
                questions: [
                  'Do you work or study?',
                  'Why are you preparing for the IELTS exam?',
                  'How do you practice vocabulary in your daily schedule?'
                ]
              },
              {
                number: 'Part 2: Individual Long Turn (Cue Card)',
                topic: 'Describe a person who inspired you.',
                points: [
                  'Who this person is',
                  'How you know this person',
                  'What this person does',
                  'Explain why this person inspired you'
                ],
                prepareTime: '1 phút chuẩn bị',
                talkTime: '1 - 2 phút phát biểu'
              },
              {
                number: 'Part 3: Two-way Discussion',
                questions: [
                  'What qualities make someone a good role model for younger people?',
                  'Do you think celebrities have a responsibility to act as good role models?',
                  'How has the internet changed the way people find inspiration?'
                ]
              }
            ]
          }
        }
      ]
    },
    {
      id: 'cam_18',
      title: 'Cambridge IELTS 18',
      description: 'Đề thi thử IELTS chính thức xuất bản năm 2023',
      tests: [
        {
          number: 'Test 1',
          reading: {
            title: 'Cognitive Science and Language Learning',
            passages: [
              {
                number: 1,
                title: 'Cognitive Aspects of Adult Bilingualism',
                content: `
                  <p><strong>A.</strong> In recent years, cognitive psychologists have debunked the long-standing myth that learning a second language as an adult is a futile endeavour. While it is true that children acquire native pronunciation with greater ease, adults possess advanced cognitive structures that allow them to grasp complex grammatical rules, abstract syntax structures, and semantic relationships much faster.</p>
                  <p><strong>B.</strong> Bilingualism has been shown to improve executive function—the command centre of the brain that manages processes like attention, switching tasks, and memory. In fact, research indicates that bilingual individuals show delay in the onset of age-related cognitive decline compared to monolinguals. Managing two active language channels exercises the brain’s frontal lobe, offering mental resilience.</p>
                `,
                questions: [
                  {
                    type: 'y_n_ng',
                    instruction: 'Write TRUE, FALSE or NOT GIVEN for the statements below.',
                    items: [
                      { num: 1, text: 'Children learn foreign grammar rules faster than adults do.', answer: 'FALSE' },
                      { num: 2, text: 'Bilingualism exercises the brain’s frontal lobe and improves executive function.', answer: 'TRUE' }
                    ]
                  }
                ]
              }
            ]
          },
          listening: {
            title: 'University Club Orientation Registration',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            transcript: `
              <p><strong>Club President:</strong> Hello and welcome to the Cognitive Science Society. We're happy to have you at our orientation.</p>
              <p><strong>Student:</strong> Thank you, I'd like to join. My name is Anna.</p>
            `,
            questions: [
              {
                section: 1,
                instruction: 'Complete the form. Write ONE WORD for the answer.',
                items: [
                  { num: 1, label: 'Student Name:', text: '______', answer: 'Anna' }
                ]
              }
            ]
          },
          writing: {
            tasks: [
              {
                number: 'Task 1',
                prompt: 'The chart below shows the production of coffee globally. Summarize the details.',
                tips: 'Write at least 150 words.'
              }
            ]
          },
          speaking: {
            parts: [
              {
                number: 'Part 1',
                questions: [
                  'Do you enjoy studying languages?',
                  'How many languages do you speak?'
                ]
              }
            ]
          }
        }
      ]
    }
  ]
};
