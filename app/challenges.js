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
      starterCode: '# Name Greeting\n# Ask for a name, then print only the greeting.\n\n',
      hints: [
        'input() returns text. Store that text in a variable so you can use it again.',
        'Your program needs one input() call and one final greeting printed from the value you saved.',
        'Structure clue: name = input(...) then print(...) using name. Fill in the greeting yourself.'
      ],
      translationLayer: {
        scaffoldMode: 'always_expanded',
        plainEnglish: 'Ask someone for their name, remember what they typed, and print a greeting with their name in it.',
        academicJargon: "Prompt the user for their name, store the input in a variable, and output a greeting containing the user's name.",
        translationKey: [
          { jargon: 'Prompt the user', concept: 'Ask for information', syntax: 'input()' },
          { jargon: 'Store the input in a variable', concept: 'Save the response under a label', syntax: 'name = ...' },
          { jargon: 'Output a greeting containing [value]', concept: 'Display combined text with the saved variable', syntax: 'print(f"Hello, {name}.")' }
        ],
        parallelExample: {
          title: 'Parallel Example: Favorite Color',
          taskDescription: 'Prompt the user for their favorite color and output a sentence confirming their choice.',
          code: 'color = input("What is your favorite color? ")\nprint(f"Your favorite color is {color}.")',
          lineByLine: [
            { code: 'color = input("What is your favorite color? ")', explanation: 'input() asks the question; color saves the response.' },
            { code: 'print(f"Your favorite color is {color}.")', explanation: 'print() displays the output; f"..." and {color} inject the saved value.' }
          ]
        }
      },
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
      starterCode: '# Tip Calculator\n# Ask for bill amount and tip percentage.\n\n',
      hints: [
        'input() gives you strings. Arithmetic needs numeric values, so convert each input first.',
        'The tip is bill multiplied by percentage, then divided by 100.',
        'Formatting clue: an f-string can display a number with two decimal places using a format such as :.2f.'
      ],
      translationLayer: {
        scaffoldMode: 'always_expanded',
        plainEnglish: 'Ask how much the bill was, ask what tip percentage they want to use, turn both answers into numbers, calculate that percentage of the bill, and print the tip amount.',
        academicJargon: 'Prompt the user for the bill amount and tip percentage, convert both inputs to numeric values, compute the percentage of the bill, and output the result formatted as currency.',
        translationKey: [
          { jargon: 'Prompt for the bill amount and tip percentage', concept: 'Ask two questions and convert both responses to decimal numbers', syntax: 'bill = float(input(...))\npercentage = float(input(...))' },
          { jargon: 'Compute the percentage of the bill', concept: 'Multiply the bill by the chosen percentage, then divide by 100', syntax: 'bill * percentage / 100' },
          { jargon: 'Output the result formatted as currency', concept: 'Print the calculated tip with exactly two decimal places', syntax: 'print(f"Tip: ${tip:.2f}")' }
        ],
        parallelExample: {
          title: 'Parallel Example: Sales Tax Calculator',
          taskDescription: 'Prompt for an item price and a sales-tax percentage, convert both to numbers, calculate the tax, and print the tax amount with two decimal places.',
          code: 'price = float(input("Item price: "))\ntax_percent = float(input("Sales tax percent: "))\ntax = price * tax_percent / 100\nprint(f"Tax: ${tax:.2f}")',
          lineByLine: [
            { code: 'price = float(input("Item price: "))', explanation: 'input() gets the item-price text; float() converts it to a decimal number.' },
            { code: 'tax_percent = float(input("Sales tax percent: "))', explanation: 'A second input collects the percentage and converts that response to a number too.' },
            { code: 'tax = price * tax_percent / 100', explanation: 'Uses the same percentage formula: amount × percentage ÷ 100.' },
            { code: 'print(f"Tax: ${tax:.2f}")', explanation: 'Displays the calculated result; :.2f formats the number to exactly two decimal places.' }
          ]
        }
      },
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
      starterCode: '# Indoor Voice\n# Read one line and print it in lowercase.\n\n',
      hints: [
        'Python strings have methods that return transformed versions of the text.',
        'Look for a string method whose name describes making letters lowercase.',
        'Structure clue: save input() to a variable, then print(variable.<lowercase method>()).'
      ],
      translationLayer: {
        scaffoldMode: 'collapsible',
        plainEnglish: 'Ask for a sentence, convert all letters to lowercase so it sounds quiet, and print the result.',
        academicJargon: 'Prompt the user for input and output that same input in lowercase.',
        translationKey: [
          { jargon: 'Prompt for input', concept: 'Collect text from the user', syntax: 'input()' },
          { jargon: 'In lowercase', concept: 'Transform all capital letters to lowercase using a string method', syntax: 'text.lower()' },
          { jargon: 'Output that same input', concept: 'Print the transformed string', syntax: 'print(...)' }
        ],
        parallelExample: {
          title: 'Parallel Example: Shout to Whisper',
          taskDescription: 'Prompt the user for a shouted phrase and output the phrase entirely in lowercase.',
          code: 'shout = input("Enter a message: ")\nwhisper = shout.lower()\nprint(whisper)',
          lineByLine: [
            { code: 'shout = input("Enter a message: ")', explanation: 'Collects the original text and stores it in shout.' },
            { code: 'whisper = shout.lower()', explanation: '.lower() creates a lowercase copy of the text without changing the original.' },
            { code: 'print(whisper)', explanation: 'Displays the lowercase result to the console.' }
          ]
        }
      },
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
      starterCode: '# Playback Speed\n# Replace every space with three periods.\n\n',
      hints: [
        'A string method can replace every occurrence of one piece of text with another.',
        'The thing you are replacing is one normal space. The replacement is "...".',
        'Structure clue: text = input(...), then use text.replace(<old>, <new>) before printing.'
      ],
      translationLayer: {
        scaffoldMode: 'hint_only',
        plainEnglish: 'Ask the user for a phrase, replace every single space with three periods (...), and print the slowed-down sentence.',
        academicJargon: 'Prompt the user for input and output that input, replacing each space with three periods (...).',
        translationKey: [
          { jargon: 'Prompt for input', concept: 'Collect a string from the user', syntax: 'input()' },
          { jargon: 'Replacing each [A] with [B]', concept: 'Find all instances of a substring and substitute a new string', syntax: 'text.replace(" ", "...")' },
          { jargon: 'Output the result', concept: 'Display the modified text string', syntax: 'print(...)' }
        ],
        parallelExample: {
          title: 'Parallel Example: Hyphenated Web Slug',
          taskDescription: 'Prompt the user for a title and output the string with every space replaced by a single dash (-).',
          code: 'title = input("Enter title: ")\nslug = title.replace(" ", "-")\nprint(slug)',
          lineByLine: [
            { code: 'title = input("Enter title: ")', explanation: 'Stores the input phrase into the title variable.' },
            { code: 'slug = title.replace(" ", "-")', explanation: '.replace(" ", "-") finds every space and replaces it with a dash.' },
            { code: 'print(slug)', explanation: 'Outputs the newly formatted slug string.' }
          ]
        }
      },
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
      starterCode: '# File Extension\n# Normalize the filename, then choose the MIME type.\n\n',
      hints: [
        'Normalize the filename first so capitalization and extra outside spaces do not affect your conditions.',
        'After normalization, check which supported extension the filename ends with.',
        'Structure clue: filename = input(...).strip().lower(), then use if / elif / else and endswith(...).'
      ],
      translationLayer: {
        scaffoldMode: 'hint_only',
        plainEnglish: 'Ask for a filename, check what extension it ends with (.gif, .jpg, .pdf, etc.), and print the corresponding media type, or a default if the extension is unknown.',
        academicJargon: 'Prompt the user for a filename, case-insensitively inspect its suffix, and output the corresponding media type via conditional branching.',
        translationKey: [
          { jargon: 'Case-insensitively inspect', concept: 'Normalize the text to lowercase and strip outer spaces', syntax: 'filename.strip().lower()' },
          { jargon: 'Inspect its suffix', concept: 'Check what characters the string ends with', syntax: 'filename.endswith(".gif")' },
          { jargon: 'Conditional branching', concept: 'Test multiple possibilities and execute different code paths', syntax: 'if ... elif ... else' }
        ],
        parallelExample: {
          title: 'Parallel Example: Protocol Scheme Inspector',
          taskDescription: "Prompt the user for a web address and output whether it is 'Secure Web', 'Standard Web', or 'Unknown Protocol'.",
          code: 'url = input("Enter URL: ").strip().lower()\nif url.startswith("https://"):\n    print("Secure Web")\nelif url.startswith("http://"):\n    print("Standard Web")\nelse:\n    print("Unknown Protocol")',
          lineByLine: [
            { code: 'url = input("...").strip().lower()', explanation: 'Cleans whitespace and normalizes text so matching is reliable.' },
            { code: 'if url.startswith("https://"):', explanation: 'Checks the first condition; prints "Secure Web" if matched.' },
            { code: 'elif url.startswith("http://"):', explanation: 'Checks the alternative condition if the first condition was False.' },
            { code: 'else:', explanation: 'Default fallback executed if none of the specific conditions matched.' }
          ]
        }
      },
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