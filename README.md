# agario-ai-framework
Agar.io AI with a touch of genetic algorithms

Consider the bot that runs off the framework as example code.
Feel free to fork this project and create your "optimal" bot

See the latest bot in action as well as development while streaming at
http://nomday.com/lio

## Purpose
The purpose of this bot is to explore decision-making based on statistics instead of
hard-coded rules.  This is not a bot to enhance normal gameplay.  There's also no team-related features.  Considerations should be fairly simple and not need to consider more than one other organism at a time.  This effectly excludes any "advance" strategies.  The code is designed to be
"forked" easily so everything is kept at the bare necessities.  If you want to (for example)
create a better pathfinder, forking the code would be the best choice.

## How to install from GitHub
https://youtu.be/fEVX4xmEn4s

## Main Components for Improving Bot Performance
* Number of Possible Actions
* Number of Considerations per Action
* Number of Steps it can Look Ahead

## How do we know how important each component is?

* We need to track bot performance over time and perform experiments.
* Vote on the next feature

## Ways to improve components
### Possible Actions
Split, Shoot, and creating new movement coordinates by taking the average of a sector of coordinates
Sort actions by score and then find the mid point for them
Create action generators

### Considerations
* Dynamically normalize to make it easier to add new considerations.
* Let users contribute new considerations
* Make it so one consideration should only consider one action type.

### Looking at Steps Ahead
Breath-first search using the fitness score and time

## Possible meta games
* Hide'n'seek
* Sniper
* Bet the score
* VIP

BTC Donation: 1LJ6Bh9oAGJbyFH4HmonyPLHi1sFPzwyYf
