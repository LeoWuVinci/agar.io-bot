# agario-bot-framework
Agar.io Bot Framework for others to create their own bots.

*Hacks? Cheats?* None of that here. Just bots trying to get along with humans.

You can try out the sample bot included for **free in the [chrome store](https://chrome.google.com/webstore/detail/agario-bot-framework/jlnlogedhgopimklhbhmpnliaclegdhg)**.

Even though the bot included has many different algorithms such
as genetic algorithms and velocity prediction, it is just
an example and isn't optimized to get on the leaderboard.
Please consider it as a sample of what is possible.

Feel free to fork this project and create your own custom bot

See the latest bot in action as well as development while streaming at

http://twitch.tv/gamerlio or http://livecoding.tv/heyitsleo

## How to Install from GitHub
1. Click the "Download ZIP" button on the right panel of https://github.com/leomwu/agario-bot
2. Unzip anywhere you want.
3. Go to "chrome://extensions" in your chrome browser
4. Checkbox "Developer mode"
5. Click on "Load unpacked extension..." and find your unzipped file and go to the "src" folder

Now you can see it in action when you go to agar.io

If you modify the script, remember to reload the extension.

For a video installation guide, please go to https://youtu.be/fEVX4xmEn4s

## Purpose
The purpose of this bot is to explore decision-making based on statistics instead of
hard-coded rules.  This is not a bot to enhance normal gameplay.  There's also no team-related features.  Considerations should be fairly simple and not need to consider more than one other organism at a time.  This effectly excludes any "advance" strategies.  The code is designed to be
"forked" easily so everything is kept at the bare necessities.  If you want to (for example)
create a better pathfinder, forking the code would be the best choice.

## Main Components
* Binding to Original Game Code
* Action Generators - Generates move, split, and shoot actions.
* Considerations - Game strategies broken down into small pieces.
* Distance-Delayed Best-First Searching
* Bot Intuition - Weighted Averages of considerations.

### How can the bot be improved?
1. Datastructure for making more advance proximity-based considerations
2. More action generators
3. More consideration functions

### Fun Fork Ideas
* Hide'n'seek
* Sniper
* Bet the score
* VIP

## Ways to Support This Project
1. Stars and Forks really help
2. Link to https://github.com/leomwu/agario-bot from your project's README.md 
3. Finally there's BTC Donations: 1LJ6Bh9oAGJbyFH4HmonyPLHi1sFPzwyYf

### Why Support?
By supporting the project, I can use my time to add these kind of features:
* More code refactoring
* More documentation and tutorials
* Server to host custom action generators and considerations

## Other Agar.io Projects 
* [Apostolique's Bot](https://github.com/Apostolique/Agar.io-bot) - This bot works on firefox too.
* [Agar.io Mod Wiki](http://agar.gcommer.com/) - If you're interested in modding Agar.io, this is an excellent resource.
* [Zeach Cobbler Bot](https://github.com/RealDebugMonkey/ZeachCobbler) - This bot has cheats! Use at your own risk (It's not too risky honestly)

### Chrome Extensions
* [Epic Pretty Mods](https://chrome.google.com/webstore/detail/agario-epic-pretty-mods/gmnfpfoaajllnhffieombgmmkhinajbo) - Load skins from your computer, Acid Mode, Parallax, No Grid Lines, Transparent Blobs, and much more to come!!!
* [Epic Pretty Mods (Supporters Edition)](https://chrome.google.com/webstore/detail/agario-epic-pretty-mods/gmnfpfoaajllnhffieombgmmkhinajbo) - Thank you! Experimental features are included in the supportors edition.
* [Server Info](https://chrome.google.com/webstore/detail/agario-server-info/pdpolggadkgfooeboifdbkjjfckoppnf) - Shows region, game mode, and ip address of the server up top.
