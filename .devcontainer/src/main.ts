// Main entry point for the DFS Portal application
console.log('DFS Portal initialized with TypeScript@next');

// Example TypeScript@next features
type User = {
  id: number;
  name: string;
  email: string;
};

const users: User[] = [
  { id: 1, name: 'Admin', email: 'admin@dfs.com' },
];

// Using TypeScript@next features
const getUserById = (id: number): User | undefined => {
  return users.find(user => user.id === id);
};

console.log('Current user:', getUserById(1));
