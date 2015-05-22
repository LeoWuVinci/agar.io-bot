# agario-bot

twitch.tv/GamerLio

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
