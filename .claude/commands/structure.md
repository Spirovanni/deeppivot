Show current project folder structure and update documentation.

Steps:
1. Run `tree -I 'node_modules|.git|.next|dist|build|.taskmaster' -a -L 4` to display current structure
2. Run `npm run docs:structure` to update STRUCTURE.md file
3. Display summary of any structural changes since last update
4. Note any new directories or significant reorganization

This command helps maintain awareness of project architecture during development.