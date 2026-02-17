import * as readline from 'readline';

/**
 * Prompt user for input
 */
export function prompt(question: string, defaultValue?: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const displayQuestion = defaultValue
    ? `${question} (${defaultValue}): `
    : `${question}: `;

  return new Promise((resolve) => {
    rl.question(displayQuestion, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Prompt user for confirmation (y/n)
 */
export function confirm(question: string, defaultValue: boolean = false): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const defaultText = defaultValue ? 'Y/n' : 'y/N';
  const displayQuestion = `${question} (${defaultText}): `;

  return new Promise((resolve) => {
    rl.question(displayQuestion, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      
      if (normalized === '') {
        resolve(defaultValue);
      } else {
        resolve(normalized === 'y' || normalized === 'yes');
      }
    });
  });
}

/**
 * Prompt user to select from options
 */
export function select(question: string, options: string[], defaultIndex: number = 0): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`\n${question}`);
  options.forEach((option, index) => {
    const marker = index === defaultIndex ? '>' : ' ';
    console.log(`  ${marker} ${index + 1}. ${option}`);
  });

  return new Promise((resolve) => {
    rl.question(`\nSelect (1-${options.length}): `, (answer) => {
      rl.close();
      const index = parseInt(answer.trim()) - 1;
      
      if (index >= 0 && index < options.length) {
        resolve(options[index]);
      } else {
        resolve(options[defaultIndex]);
      }
    });
  });
}

/**
 * Prompt for password/secret (hidden input)
 */
export function secret(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    // Note: This is a simple implementation. For production, consider using a library like 'inquirer'
    console.log(`${question}: `);
    console.log('(input will be visible - press Enter when done)');
    
    rl.question('', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Display a message and wait for Enter
 */
export function pause(message: string = 'Press Enter to continue...'): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

