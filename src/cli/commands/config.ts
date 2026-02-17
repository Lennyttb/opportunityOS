import { loadConfig, configExists, displayConfig, getConfigPath } from '../config';
import { spawn } from 'child_process';

/**
 * Show current configuration
 */
export async function configCommand(options: { edit?: boolean }): Promise<void> {
  // Check if config exists
  if (!await configExists()) {
    console.log('\n❌ No configuration found!\n');
    console.log('Please run: npx opportunityos init\n');
    process.exit(1);
  }

  try {
    const config = await loadConfig();

    if (options.edit) {
      // Open in editor
      const configPath = getConfigPath();
      const editor = process.env.EDITOR || process.env.VISUAL || 'nano';

      console.log(`\n📝 Opening config in ${editor}...\n`);
      console.log(`File: ${configPath}\n`);

      try {
        const editorProcess = spawn(editor, [configPath], {
          stdio: 'inherit',
        });

        await new Promise<void>((resolve, reject) => {
          editorProcess.on('exit', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Editor exited with code ${code}`));
            }
          });
          editorProcess.on('error', reject);
        });

        console.log('\n✅ Config file closed.\n');
      } catch (error) {
        console.log('\n💡 Tip: You can manually edit the file at:');
        console.log(`   ${configPath}\n`);
      }
    } else {
      // Display config
      displayConfig(config);
      
      console.log('💡 Commands:');
      console.log('   • Edit config: npx opportunityos config --edit');
      console.log('   • Or manually: nano opportunityos.config.json\n');
    }
  } catch (error) {
    console.error('❌ Failed to load config:', (error as Error).message);
    process.exit(1);
  }
}

