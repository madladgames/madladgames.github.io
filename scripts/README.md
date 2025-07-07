# Game Links Update Script

This script automatically updates the "Try Our Other Games!" section in each game page to show the three most recently created games plus a link to see all games.

## How it works

The script (`scripts/update-game-links.js`) maintains a list of all games with their metadata including:
- Filename
- Display title
- Emoji
- Color theme
- Creation order

For each game page, it:
1. Excludes the current game from the list
2. Shows the 3 most recently created games (based on the order field)
3. Adds a "See All Games" link to the main page

## Usage

To update all game pages, run from the project root directory:

```bash
node scripts/update-game-links.js
```

Or from within the scripts directory:

```bash
cd scripts
node update-game-links.js
```

## Adding a new game

When you create a new game, follow these steps:

1. **Create the game HTML file** (e.g., `mad-newgame-game.html`) in the project root

2. **Add the "Other Games" section** to your new game HTML file with the proper markers:
   ```html
   <!-- Other Games -->
   <div class="mt-12 text-center">
       <h3 class="text-2xl font-bold text-white mb-6">Try Our Other Games!</h3>
       <div class="flex flex-wrap justify-center gap-4">
           <!-- Game links will be auto-generated here -->
       </div>
   </div>
   <!-- End of Other Games -->
   ```

3. **Update the script** by editing `scripts/update-game-links.js`:
   - Add the new game to the `games` array
   - Set the `order` field to the next number in sequence
   - Choose appropriate emoji and color

4. **Run the update script**:
   ```bash
   node scripts/update-game-links.js
   ```

This will automatically update all existing game pages to include the new game in their "Other Games" sections.

## Example game entry

```javascript
{
    filename: 'mad-newgame-game.html',
    title: 'Mad New Game',
    emoji: '🎯',
    color: 'text-indigo-600',
    order: 6  // Next number in sequence
}
```

## Current games (in order)

1. Mad Car Game (🚗)
2. Mad Crab Game (🦀)
3. Mad Racetrack Game (🏁)
4. Mad Fire Truck Game (🚒)
5. Mad Car Wash Game (🧽)

## Features

- **Automatic updates**: No need to manually edit each game page
- **Consistent styling**: All links use the same Tailwind CSS classes
- **Recent games priority**: Always shows the 3 most recent games
- **Responsive design**: Works on all screen sizes
- **Easy maintenance**: Just update the script and run it
- **Clear markers**: Uses HTML comments to identify sections for reliable updates

## File structure

The script expects:
- Game HTML files in the project root directory
- Script files in the `scripts/` directory
- Each game page to have a "Try Our Other Games!" section with the specific HTML structure
- The section to be marked with `<!-- Other Games -->` and `<!-- End of Other Games -->` comments

## Error handling

The script includes error handling for:
- Missing game files
- Missing "Other Games" sections
- Missing end markers
- File read/write errors

If a game file doesn't exist, it will be skipped with a warning message.

## Technical details

- The script uses Node.js built-in `fs` and `path` modules
- It searches for HTML comment markers to identify sections to replace
- The script runs from the `scripts/` directory but operates on files in the parent directory
- All file paths are resolved relative to the script location
