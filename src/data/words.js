// ── Word pools & code snippets ──

export const WORDS = "the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us quick brown jumps lazy river stone light garden window bridge memory silver planet rhythm anchor forest signal pocket canvas thunder pattern violet journey lantern whisper marble hollow orbit velvet cipher meadow harbor copper falcon puzzle breeze kitten jacket wizard fjord quartz".split(" ");

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
