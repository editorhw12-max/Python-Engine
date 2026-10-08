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


  // Assignment Decoder teaching copy; never changes grading or learner code.
  const translationLayers = {
    "name-greeting": {
      "scaffoldMode": "always_expanded",
      "plainEnglish": "Ask for someone's name. Remember their answer, then print a greeting that includes their name and ends with a period.",
      "academicJargon": "Prompt for user input, assign the returned string to a variable, and interpolate that variable into printed output.",
      "translationKey": [
        {
          "jargon": "Prompt the user",
          "concept": "Ask a question and wait for typed text.",
          "syntax": "input(...)"
        },
        {
          "jargon": "Store input in a variable",
          "concept": "Give the answer a reusable name.",
          "syntax": "name = input(...)"
        },
        {
          "jargon": "Output",
          "concept": "Display a line in the terminal.",
          "syntax": "print(...)"
        },
        {
          "jargon": "Interpolate",
          "concept": "Put the saved value inside a formatted message.",
          "syntax": "f\"...{name}...\""
        }
      ],
      "steps": [
        "Ask for one text answer.",
        "Save it in a variable.",
        "Print one greeting using that value and the required punctuation."
      ],
      "parallelExample": {
        "topic": "Introduce a pet, not a person.",
        "code": "pet = input(\"Pet's name: \")\nprint(f\"Meet {pet}.\")",
        "lineNotes": [
          "One input call stores the reply.",
          "One formatted print uses the stored text and a final period."
        ],
        "connection": "Identical flow: one input, one assigned variable, one formatted print."
      }
    },
    "tip-calculator": {
      "scaffoldMode": "on_demand",
      "plainEnglish": "Ask separately for the bill and tip percentage, turn both answers into numbers, calculate the tip, and print it with two decimal places.",
      "academicJargon": "Read two numeric inputs, convert each to float, compute the percentage of the base, and format output to two decimal places.",
      "translationKey": [
        {
          "jargon": "Numeric input",
          "concept": "Typed numbers start as text.",
          "syntax": "input(...)"
        },
        {
          "jargon": "Convert to float",
          "concept": "Make input usable in decimal arithmetic.",
          "syntax": "float(input(...))"
        },
        {
          "jargon": "Percentage",
          "concept": "Multiply a base by the percent, then divide by 100.",
          "syntax": "base * percent / 100"
        },
        {
          "jargon": "Two decimal places",
          "concept": "Display dollars and cents, including trailing zeroes.",
          "syntax": ":.2f"
        }
      ],
      "steps": [
        "Read the bill and percentage separately.",
        "Convert both inputs to numbers.",
        "Calculate the percentage of the bill.",
        "Print only the requested label and a two-decimal result."
      ],
      "parallelExample": {
        "topic": "Calculate a discount amount instead of a tip.",
        "code": "price = float(input(\"Price: \"))\ndiscount_rate = float(input(\"Discount percent: \"))\ndiscount = price * discount_rate / 100\nprint(f\"Discount: ${discount:.2f}\")",
        "lineNotes": [
          "Read and convert the base price.",
          "Read and convert a percent.",
          "Multiply and divide to get that percentage of the price.",
          "Print a result formatted to two decimals."
        ],
        "connection": "Same structure: two float(input(...)) calls, one percentage calculation, one formatted print."
      }
    },
    "indoor-voice": {
      "scaffoldMode": "on_demand",
      "plainEnglish": "Read one line of text, change its uppercase letters to lowercase, and print the new text.",
      "academicJargon": "Read a string, apply its lowercase conversion method, then output the transformed string.",
      "translationKey": [
        {
          "jargon": "String",
          "concept": "Text returned by input().",
          "syntax": "input(...)"
        },
        {
          "jargon": "Lowercase conversion",
          "concept": "Make a new version of text with lowercase letters.",
          "syntax": ".lower()"
        },
        {
          "jargon": "Output",
          "concept": "Show the transformed text, not an explanation.",
          "syntax": "print(...)"
        }
      ],
      "steps": [
        "Save one line of input.",
        "Apply the string's lowercase method.",
        "Print only the returned text."
      ],
      "parallelExample": {
        "topic": "Normalize a shelf label instead of a spoken phrase.",
        "code": "label = input(\"Shelf label: \")\nprint(label.lower())",
        "lineNotes": [
          "One input call saves text.",
          "One lowercase method and one print produce the output."
        ],
        "connection": "Same structure: input assignment, one .lower() call, one print."
      }
    },
    "playback-speed": {
      "scaffoldMode": "on_demand",
      "plainEnglish": "Read a sentence and replace every normal space with three periods, then print the changed sentence.",
      "academicJargon": "Read a string, perform global substring substitution using replace(), then output the transformed string.",
      "translationKey": [
        {
          "jargon": "Substring substitution",
          "concept": "Swap each occurrence of one exact string for another.",
          "syntax": ".replace(old, new)"
        },
        {
          "jargon": "Ordinary space",
          "concept": "The single space character.",
          "syntax": "\" \""
        },
        {
          "jargon": "Output",
          "concept": "Print the changed text.",
          "syntax": "print(...)"
        }
      ],
      "steps": [
        "Read a sentence.",
        "Replace the specified character with the specified three-character replacement.",
        "Print only the result."
      ],
      "parallelExample": {
        "topic": "Reformat an ingredient list instead of slowing a sentence.",
        "code": "ingredients = input(\"Comma-separated ingredients: \")\nprint(ingredients.replace(\",\", \" / \"))",
        "lineNotes": [
          "Save one line of text.",
          "Replace each comma with a separator and print."
        ],
        "connection": "Same structure: input assignment, one replace() call, one print."
      }
    },
    "file-extension": {
      "scaffoldMode": "on_demand",
      "plainEnglish": "Read a filename, ignore spaces around it and capitalization, inspect its ending, and print the matching type or the default type.",
      "academicJargon": "Normalize with strip() and lower(), then use ordered if/elif/else branches and endswith() checks to choose a MIME type.",
      "translationKey": [
        {
          "jargon": "Normalize",
          "concept": "Make comparisons consistent regardless of outer spaces and capitalization.",
          "syntax": ".strip().lower()"
        },
        {
          "jargon": "Extension",
          "concept": "Recognize a particular ending.",
          "syntax": ".endswith(\".pdf\")"
        },
        {
          "jargon": "Conditional",
          "concept": "Choose one outcome through if/elif/else.",
          "syntax": "if ...: / elif ...: / else:"
        },
        {
          "jargon": "MIME type",
          "concept": "An exact file type label you must print.",
          "syntax": "print(\"...\")"
        }
      ],
      "steps": [
        "Read and normalize the filename.",
        "Compare its ending to the accepted endings.",
        "Treat the two JPEG endings as one output choice.",
        "Print exactly one matching type, otherwise print the default."
      ],
      "parallelExample": {
        "topic": "Classify package route tags, not files.",
        "code": "tag = input(\"Package tag: \").strip().lower()\nif tag.endswith(\"-air\"):\n    print(\"route/air\")\nelif tag.endswith(\"-road\") or tag.endswith(\"-land\"):\n    print(\"route/ground\")\nelif tag.endswith(\"-sea\"):\n    print(\"route/sea\")\nelif tag.endswith(\"-fragile\"):\n    print(\"route/fragile\")\nelif tag.endswith(\"-heavy\"):\n    print(\"route/heavy\")\nelif tag.endswith(\"-express\"):\n    print(\"route/express\")\nelse:\n    print(\"route/unknown\")",
        "lineNotes": [
          "Normalize the typed tag.",
          "Try the first ending.",
          "A second branch accepts two endings.",
          "Check the remaining four endings.",
          "Use the else fallback when none matched."
        ],
        "connection": "Same flow and method counts: one input, strip(), lower(), seven endswith() calls across six branches, and one else fallback."
      }
    }
  };
  challenges.forEach(challenge => { challenge.translationLayer = translationLayers[challenge.id]; });

  const byId = Object.fromEntries(challenges.map(challenge => [challenge.id, Object.freeze(challenge)]));
  window.AtelierChallenges = Object.freeze({
    pathId: 'cs50p-foundations',
    pathTitle: 'CS50P Foundations',
    version: 1,
    challenges: Object.freeze(challenges),
    byId: Object.freeze(byId)
  });
})();