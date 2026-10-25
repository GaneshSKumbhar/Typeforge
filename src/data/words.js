// ── Word pools & code snippets ──

export const WORDS = "the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us quick brown jumps lazy river stone light garden window bridge memory silver planet rhythm anchor forest signal pocket canvas thunder pattern violet journey lantern whisper marble hollow orbit velvet cipher meadow harbor copper falcon puzzle breeze kitten jacket wizard fjord quartz".split(" ");

// Complete sentences are shuffled into practice passages so generated text
// reads naturally instead of feeling like a random word list.
export const SENTENCES = [
  "The traveler crossed the old bridge before sunrise and followed a quiet path toward the harbor.",
  "A small lantern rested beside the window while rain moved across the garden.",
  "Each morning, the writer opened a notebook and gathered new ideas from the quiet town.",
  "Beyond the river, a patient gardener tended the flowers and watched the clouds drift by.",
  "Good practice grows from steady effort, clear goals, and short breaks between focused sessions.",
  "Every new skill begins with curiosity and becomes stronger through patient repetition.",
  "A warm breeze moved through the trees as the last light settled across the meadow.",
  "The musician carried a silver instrument through the village and shared a gentle tune.",
  "At the edge of the forest, a bright signal guided the sailor toward a safe harbor.",
  "The child found a colorful map and traced a winding route across the hillside.",
  "Clear thinking helps people solve difficult problems one small step at a time.",
  "Careful work can turn a simple idea into something useful and lasting.",
  "The morning train rolled past green fields and arrived at the station just before noon.",
  "A curious mind asks good questions, notices small details, and keeps looking for answers.",
  "The baker placed fresh bread near the window as neighbors gathered in the square.",
  "With each careful attempt, the team learned what worked and improved its plan.",
  "Soft music filled the room while the rain tapped gently against the roof.",
  "The sailor checked the compass, studied the clouds, and chose a safe course home.",
  "Small daily habits make difficult goals easier to reach over time.",
  "Under the evening sky, the village lights appeared one by one along the river."
];

export const CODE = [
  'const total = items.reduce((a, b) => a + b.price, 0);',
  'for (let i = 0; i < arr.length; i++) { sum += arr[i]; }',
  'def fib(n): return n if n < 2 else fib(n-1) + fib(n-2)',
  'fetch(url).then(r => r.json()).catch(console.error);',
  'if (user && user.active) { return user.name.trim(); }',
  'SELECT id, name FROM users WHERE age > 21 ORDER BY name;',
  'const sorted = [...list].sort((a, b) => a.id - b.id);',
  'class Stack { push(x) { this.items.push(x); } }',
  'git commit -m "fix: handle empty input" && git push',
  'export default function App() { return <div>{count}</div>; }'
];

export const THEMES = ["auto", "dark", "light", "ocean"];
