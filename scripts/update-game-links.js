#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define all games with their metadata
const games = [
    {
        filename: 'mad-car-game.html',
        title: 'Mad Car Game',
        emoji: '🚗',
        color: 'text-blue-600',
        order: 1
    },
    {
        filename: 'mad-crab-game.html',
        title: 'Mad Crab Game',
        emoji: '🦀',
        color: 'text-orange-600',
        order: 2
    },
    {
        filename: 'mad-racetrack-game.html',
        title: 'Mad Racetrack Game',
        emoji: '🏁',
        color: 'text-green-600',
        order: 3
    },
    {
        filename: 'mad-firetruck-game.html',
        title: 'Mad Fire Truck Game',
        emoji: '🚒',
        color: 'text-red-600',
        order: 4
    },
    {
        filename: 'mad-carwash-game.html',
        title: 'Mad Car Wash Game',
        emoji: '🧽',
        color: 'text-cyan-600',
        order: 5
    },
    {
        filename: 'mad-train-game.html',
        title: 'Mad Train Game',
        emoji: '🚂',
        color: 'text-purple-600',
        order: 6
    }
];

// Function to generate the "Other Games" section HTML
function generateOtherGamesSection(currentGameFilename) {
    // Filter out the current game and get the 3 most recent others
    const otherGames = games
        .filter(game => game.filename !== currentGameFilename)
        .sort((a, b) => b.order - a.order) // Sort by order descending (most recent first)
        .slice(0, 3); // Take the 3 most recent

    let html = `        <!-- Other Games -->
        <div class="mt-12 text-center">
            <h3 class="text-2xl font-bold text-white mb-6">Try Our Other Games!</h3>
            <div class="flex flex-wrap justify-center gap-4">`;

    // Add links for the 3 most recent games
    otherGames.forEach(game => {
        html += `
                <a href="${game.filename}" class="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 font-bold ${game.color} hover:bg-white transition">
                    ${game.emoji} ${game.title}
                </a>`;
    });

    // Add "See All Games" link
    html += `
                <a href="index.html#games" class="bg-white/90 backdrop-blur-sm rounded-lg px-6 py-3 font-bold text-purple-600 hover:bg-white transition border-2 border-purple-600">
                    🎮 See All Games
                </a>`;

    html += `
            </div>
        </div>
        <!-- End of Other Games -->`;

    return html;
}

// Function to update a game file
function updateGameFile(gameFilename) {
    try {
        console.log(`Updating ${gameFilename}...`);
        
        // Read the file (go up one directory since script is in scripts/ folder)
        const filePath = path.join(__dirname, '..', gameFilename);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Find the "Other Games" section and replace it
        const startMarker = '        <!-- Other Games -->';
        const endMarker = '        <!-- End of Other Games -->';
        
        const startIndex = content.indexOf(startMarker);
        if (startIndex === -1) {
            console.log(`Warning: Could not find "Other Games" section in ${gameFilename}`);
            return;
        }
        
        // Find the end of the section
        let endIndex = content.indexOf(endMarker, startIndex);
        if (endIndex === -1) {
            console.log(`Warning: Could not find "End of Other Games" marker in ${gameFilename}`);
            return;
        }
        
        // Include the end marker in the replacement
        endIndex += endMarker.length;
        
        // Generate new content
        const newSection = generateOtherGamesSection(gameFilename);
        
        // Replace the section
        const newContent = content.substring(0, startIndex) + newSection + content.substring(endIndex);
        
        // Write the file back
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✓ Successfully updated ${gameFilename}`);
        
    } catch (error) {
        console.error(`Error updating ${gameFilename}:`, error.message);
    }
}

// Main function
function main() {
    console.log('Updating game links in all game pages...\n');
    
    // Update each game file
    games.forEach(game => {
        const filePath = path.join(__dirname, '..', game.filename);
        if (fs.existsSync(filePath)) {
            updateGameFile(game.filename);
        } else {
            console.log(`Warning: ${game.filename} does not exist, skipping...`);
        }
    });
    
    console.log('\n✓ All game files updated successfully!');
    console.log('\nEach game page now shows:');
    console.log('- The 3 most recently created games (excluding the current game)');
    console.log('- A "See All Games" link to the main page');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { updateGameFile, generateOtherGamesSection, games };
