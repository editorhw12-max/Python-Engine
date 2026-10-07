'use strict';
(() => {
  const challenges = [
    {
      id: 'name-greeting',
      definitionVersion: 1,
      title: 'Name Greeting',
      concepts: ['input()', 'strings', 'variables', 'print()'],
      instructions: 'Ask the user for their name with input(). Print only the greeting in this exact form: Hello, <name>.',
      practice: 'Using input(), storing text in a variable, and printing a string that includes the learner-provided name.',
      exampleInput: ['Maya'],
      expectedBehavior: 'For Maya, print exactly: Hello, Maya.',
      preferredFileName: 'practice_name_greeting.py',
      starterCode: '# Name Greeting\\n# Ask for a name, then print only the greeting.\\n\\n',
      hints: [
        'input() returns text. Store that text in a variable so you can use it again.',
        'Your program needs one input() call and one final greeting printed from the value you saved.',
        'Structure clue: name = input(...) then print(...) using name. Fill in the greeting yourself.'
      ],
      tests: [
        { inputs: ['Maya'], expected: 'Hello, Maya.', public: true },
        { inputs: ['Ada Lovelace'], expected: 'Hello, Ada Lovelace.' },
        { inputs: ['Python Learner'], expected: 'Hello, Python Learner.' }
      ]
    },
    {
      id: 'tip-calculator',
      definitionVersion: 1,
      title: 'Tip Calculator',
      concepts: ['numeric conversion', 'floats', 'arithmetic', 'formatted output'],
      instructions: 'Ask for the bill amount and tip percentage as two separate inputs. Convert both to numbers, calculate bill × percentage ÷ 100, and print only: Tip: $<amount> with exactly two decimal places.',
      practice: 'Converting input text to numbers, doing arithmetic, and formatting a numeric result.',
      exampleInput: ['50', '20'],
      expectedBehavior: 'For bill 50 and tip percentage 20, print exactly: Tip: $10.00',
      preferredFileName: 'practice_tip_calculator.py',
      starterCode: '# Tip Calculator\\n# Ask for bill amount and tip percentage.\\n\\n',
      hints: [
        'input() gives you strings. Arithmetic needs numeric values, so convert each input first.',
        'The tip is bill multiplied by percentage, then divided by 100.',
        'Formatting clue: an f-string can display a number with two decimal places using a format such as :.2f.'
      ],
      tests: [
        { inputs: ['50', '20'], expected: 'Tip: $10.00', public: true },
        { inputs: ['27.5', '18'], expected: 'Tip: $4.95' },
        { inputs: ['12.34', '15'], expected: 'Tip: $1.85' },
        { inputs: ['100', '0'], expected: 'Tip: $0.00' }
      ]
    },
    {
      id: 'indoor-voice',
      definitionVersion: 1,
      title: 'Indoor Voice',
      concepts: ['strings', 'lowercase string methods'],
      instructions: 'Ask the user for one line of text. Print only the same text converted entirely to lowercase.',
      practice: 'Calling a string method to transform text without changing the original meaning.',
      exampleInput: ['HELLO, WORLD'],
      expectedBehavior: 'Print: hello, world',
      preferredFileName: 'practice_indoor_voice.py',
      starterCode: '# Indoor Voice\\n# Read one line and print it in lowercase.\\n\\n',
      hints: [
        'Python strings have methods that return transformed versions of the text.',
        'Look for a string method whose name describes making letters lowercase.',
        'Structure clue: save input() to a variable, then print(variable.<lowercase method>()).'
      ],
      tests: [
        { inputs: ['HELLO, WORLD'], expected: 'hello, world', public: true },
        { inputs: ['Python 3.14!'], expected: 'python 3.14!' },
        { inputs: ['Already quiet'], expected: 'already quiet' }
      ]
    },
    {
      id: 'playback-speed',
      definitionVersion: 1,
      title: 'Playback Speed',
      concepts: ['strings', 'replace()'],
      instructions: 'Ask the user for a sentence. Replace every normal space character with three periods (...) and print only the transformed sentence.',
      practice: 'Replacing one substring with another using a string method.',
      exampleInput: ['This is CS50'],
      expectedBehavior: 'Print: This...is...CS50',
      preferredFileName: 'practice_playback_speed.py',
      starterCode: '# Playback Speed\\n# Replace every space with three periods.\\n\\n',
      hints: [
        'A string method can replace every occurrence of one piece of text with another.',
        'The thing you are replacing is one normal space. The replacement is "...".',
        'Structure clue: text = input(...), then use text.replace(<old>, <new>) before printing.'
      ],
      tests: [
        { inputs: ['This is CS50'], expected: 'This...is...CS50', public: true },
        { inputs: ['hello world'], expected: 'hello...world' },
        { inputs: ['a  b'], expected: 'a......b' }
      ]
    },
    {
      id: 'file-extension',
      definitionVersion: 1,
      title: 'File Extension',
      concepts: ['conditionals', 'string methods', 'filename handling'],
      instructions: 'Ask for a filename. Ignore surrounding whitespace and capitalization when examining its ending. Print only the matching MIME type: .gif → image/gif; .jpg or .jpeg → image/jpeg; .png → image/png; .pdf → application/pdf; .txt → text/plain; .zip → application/zip; anything else → application/octet-stream.',
      practice: 'Normalizing text and choosing behavior with conditionals.',
      exampleInput: ['cat.GIF'],
      expectedBehavior: 'Print: image/gif',
      preferredFileName: 'practice_file_extension.py',
      starterCode: '# File Extension\\n# Normalize the filename, then choose the MIME type.\\n\\n',
      hints: [
        'Normalize the filename first so capitalization and extra outside spaces do not affect your conditions.',
        'After normalization, check which supported extension the filename ends with.',
        'Structure clue: filename = input(...).strip().lower(), then use if / elif / else and endswith(...).'
      ],
      tests: [
        { inputs: ['cat.GIF'], expected: 'image/gif', public: true },
        { inputs: ['photo.jpeg'], expected: 'image/jpeg' },
        { inputs: [' REPORT.PDF '], expected: 'application/pdf' },
        { inputs: ['notes.txt'], expected: 'text/plain' },
        { inputs: ['archive.ZIP'], expected: 'application/zip' },
        { inputs: ['mystery.xyz'], expected: 'application/octet-stream' },
        { inputs: ['README'], expected: 'application/octet-stream' }
      ]
    }
  ];

  const byId = Object.fromEntries(challenges.map(challenge => [challenge.id, Object.freeze(challenge)]));
  window.AtelierChallenges = Object.freeze({
    pathId: 'cs50p-foundations',
    pathTitle: 'CS50P Foundations',
    version: 1,
    challenges: Object.freeze(challenges),
    byId: Object.freeze(byId)
  });
})();