# Deadwood Showdown Board Game

A strategic board game set in the HBO Deadwood universe, implemented as a React web application. Players compete for control of the infamous frontier town through influence, gold, and cunning strategy.

## Table of Contents

- [Overview](#overview)
- [Game Components](#game-components)
- [How to Play](#how-to-play)
- [Game Rules](#game-rules)
- [Character Abilities](#character-abilities)
- [Locations](#locations)
- [Actions Detailed](#actions-detailed)
- [Victory Conditions](#victory-conditions)
- [Strategy Tips](#strategy-tips)
- [Technical Implementation](#technical-implementation)
- [Installation](#installation)

## Overview

Deadwood Showdown is a 2-4 player turn-based strategy game where players take on the roles of iconic Deadwood characters, each with unique abilities. Players move around the town, claim influence at various locations, challenge opponents, and manage their gold resources to achieve victory.

### Key Features

- **Asymmetric Gameplay**: 4 unique characters with special abilities
- **Strategic Depth**: Balance gold management, positioning, and influence building
- **Multiple Victory Paths**: Win through location control or total influence
- **AI Opponents**: Three difficulty levels for single-player games
- **Mobile-Friendly**: Responsive design works on all devices

## Game Components

### Resources

- **Gold**: Currency used for actions and movement
- **Influence**: Victory points gained at locations (represented by stars ★)

### The Board

The town of Deadwood is represented by 6 locations arranged in a 2x3 grid:

```
[Gem Saloon]    [Hardware Store]    [Bella Union]
[Sheriff Office] [Freight Office]    [Wu's Pig Alley]
```

### Players

- 1 Human player (always first)
- 1-3 AI opponents
- Each player controls one character

## How to Play

### Game Setup

1. Select number of players (2-4)
1. Choose AI difficulty (Easy/Medium/Hard)
1. Characters are randomly assigned
1. Players start at random locations with:
- 3 gold
- 0 influence
- Their unique character ability

### Turn Structure

Each turn, players must select exactly **2 actions** from:

- **Move** → Change locations
- **Claim** ★ Gain influence at current location
- **Challenge** ⚔ Reduce opponent’s influence
- **Rest** +2g Gain gold

### Turn Flow

1. Select first action
1. Complete first action (with targeting/confirmation if needed)
1. Select second action
1. Complete second action
1. Turn automatically ends and passes to next player

## Game Rules

### Movement Rules

- **Adjacent Movement**: FREE
  - Gem Saloon ↔ Hardware Store, Sheriff Office
  - Hardware Store ↔ Gem Saloon, Bella Union, Freight Office
  - Bella Union ↔ Hardware Store, Wu’s Pig Alley
  - Sheriff Office ↔ Gem Saloon, Freight Office
  - Freight Office ↔ Hardware Store, Sheriff Office, Wu’s Pig Alley
  - Wu’s Pig Alley ↔ Bella Union, Freight Office
- **Non-Adjacent Movement**: Costs 1 gold
- **Special**: Calamity Jane moves anywhere for free

### Claiming Influence

- Spend 1-3 gold to gain equal influence at your current location
- Each location has a maximum of 3 influence per player
- You cannot claim more influence than the location’s remaining capacity
- Example: Spend 2 gold → Gain 2 influence stars at current location

### Challenging Opponents

- **Cost**: 2 gold (1 gold for Seth Bullock)
- **Target**: Another player at the same location
- **Effect**: Reduce target’s influence at that location by 1
- **Special**: Cy Tolliver can challenge players at adjacent locations

### Rest Action

- Gain 2 gold immediately
- No other effects
- Useful when low on funds or no good options available

## Character Abilities

### Al Swearengen - *The Gem Saloon Owner*

- **Ability**: Gains +1 gold whenever any player enters the Gem Saloon
- **Strategy**: Control the Gem Saloon and encourage movement there
- **Strength**: Passive gold generation

### Seth Bullock - *The Sheriff*

- **Ability**: Challenge actions cost 1 gold instead of 2
- **Strategy**: Aggressive play, removing opponent influence efficiently
- **Strength**: Resource-efficient challenges

### Cy Tolliver - *The Bella Union Owner*

- **Ability**: Can challenge opponents at adjacent locations
- **Strategy**: Control central locations, threaten multiple areas
- **Strength**: Extended challenge range

### Calamity Jane - *The Frontierswoman*

- **Ability**: All movement is free (adjacent and non-adjacent)
- **Strategy**: Rapid positioning, claim influence across the map
- **Strength**: Unmatched mobility

## Locations

Each location can hold up to 3 influence per player. Strategic value varies based on:

- **Connectivity**: How many adjacent locations
- **Character Synergy**: Al benefits from Gem Saloon, etc.
- **Current Control**: Contested vs. dominated locations

### Location Network

- **Most Connected**: Hardware Store, Freight Office (3 connections each)
- **Moderately Connected**: Other locations (2 connections each)
- **Strategic Center**: Hardware Store and Freight Office provide access to most locations

## Actions Detailed

### Move Action Flow

1. Click “Move” button
1. Valid destinations highlight in green
1. Movement costs display on non-adjacent locations
1. Click desired location
1. Click “Confirm Move” or “Cancel”

### Claim Action Flow

1. Click “Claim” button
1. Select amount (1-3 gold) from dropdown
1. Maximum limited by your gold and location capacity
1. Click “Confirm Claim” or “Cancel”

### Challenge Action Flow

1. Click “Challenge” button
1. Valid targets highlighted in red on the board
1. Click location containing target
1. Click “Confirm Challenge” or “Cancel”

### Rest Action Flow

1. Click “Rest” button
1. Immediately gain 2 gold
1. No confirmation needed

## Victory Conditions

### Immediate Victory

The game ends immediately when a player achieves either:

1. **Location Control Victory**
- Control 3 locations at maximum influence (3 stars each)
- Total of 9 influence across 3 locations
1. **Influence Domination Victory**
- Accumulate 12 total influence across all locations
- Can be spread across any number of locations

### Turn Limit

- Game ends after Turn 20 if no immediate victory
- Player with highest total influence wins
- Tiebreaker: Most gold remaining

## Strategy Tips

### Early Game (Turns 1-5)

- Focus on claiming uncontested locations
- Build gold reserves through Rest actions
- Position yourself near opponents for future challenges

### Mid Game (Turns 6-15)

- Contest key locations with challenges
- Balance offense (challenges) with defense (claiming)
- Monitor opponents approaching victory conditions

### Late Game (Turns 16-20)

- Rush for victory conditions
- Block opponents from their third maximum location
- Calculate if you can reach 12 influence faster than location control

### Character-Specific Strategies

**Al Swearengen**

- Claim Gem Saloon early and maximize influence there
- Use extra gold from ability to claim aggressively
- Position to defend Gem Saloon from challenges

**Seth Bullock**

- Save gold for efficient challenge chains
- Target players close to victory
- Balance challenges with claiming your own influence

**Cy Tolliver**

- Control central locations (Hardware Store/Freight Office)
- Threaten multiple areas without moving
- Force opponents to spread their influence thin

**Calamity Jane**

- Claim influence at distant, uncontested locations
- Quickly respond to threats anywhere on the board
- Use saved movement gold for more claims

## Technical Implementation

### Technology Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: useReducer hook
- **Styling**: Inline styles with responsive design
- **AI**: Decision tree with difficulty scaling

### Architecture

- Single-file React component
- Immutable state updates
- Turn-based game loop
- Cancelable action system

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- No external dependencies beyond React

## Installation

### Prerequisites

- Node.js 14+ and npm/yarn
- Basic knowledge of React development

### Quick Start

1. Create a new React app:

```bash
npx create-react-app deadwood-showdown --template typescript
cd deadwood-showdown
```

1. Replace the contents of `src/App.tsx` with the game component
1. Start the development server:

```bash
npm start
```

1. Open <http://localhost:3000> to play

### Building for Production

```bash
npm run build
```

The build folder will contain optimized static files ready for deployment.

## Game Design Philosophy

Deadwood Showdown emphasizes:

- **Meaningful Choices**: Every action matters with only 2 per turn
- **Clear Information**: All game state visible at all times
- **Asymmetric Balance**: Different strategies for each character
- **Tension**: Multiple paths to victory create dynamic gameplay
- **Accessibility**: Simple rules with emergent complexity

## Credits

- Based on HBO’s Deadwood series
- Game Design: Original tactical board game concept
- Implementation: React-based web application
- UI/UX: Mobile-first, “don’t make me think” design principles

-----

*Step into your boots, claim your territory, and show Deadwood who really runs this town!*
