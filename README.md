# Property Management Game

## Overview/Description

Property Management Game is a text-based, choice-driven property management simulator. The game presents scenarios through text descriptions accompanied by 2D static images and challenges players with Quick Time Events (QTEs). Players take on the role of a property manager, making decisions that impact various game metrics and relationships with non-player characters (NPCs).

Currently, the game is a playable prototype, structured around distinct scenarios loaded from a central JSON file. Each scenario offers a unique storyline and set of challenges.

## Features

*   **Dynamic Scenario Loading:** Scenarios are loaded from an external JSON file (`data/scenarios.json`), allowing for easy addition and modification of game content.
*   **Branching Narratives:** Player choices directly influence the progression of the story, leading to different outcomes and replayability.
*   **Game State Tracking (Metrics):** The game tracks key performance indicators:
    *   Tenant Satisfaction
    *   Manager Stress
    *   Building Condition
    *   Financial Health
*   **NPC Relationship Tracking:** Interactions and decisions can affect relationship scores with various NPCs involved in the scenarios.
*   **Quick Time Event (QTE) System:** Features a "Stop the Moving Bar" QTE mechanic for skill-based challenges.
*   **Scenario Selector:** Allows players to choose from available scenarios at the start of the game or after completing a scenario.

## Technology Stack

*   **HTML5:** For the basic structure and layout of the game.
*   **CSS3:** For styling the visual presentation.
*   **JavaScript (ES6+):** For all game logic, including scenario progression, QTE handling, and metric updates.
*   **JSON:** For storing scenario data, including narrative text, choices, effects, and QTE parameters.

## Project Structure

The project is organized as follows:

*   `/index.html`: The main entry point for the game.
*   `/css/style.css`: Main stylesheet for game presentation.
*   `/js/main.js`: Core JavaScript file handling game logic, scenario rendering, QTEs, and metric updates.
*   `/js/scenario_selector.js`: JavaScript file for the scenario selection screen.
*   `/data/scenarios.json`: JSON file containing all scenario data.
*   `/assets/images/`: Directory for storing images (characters, locations, event-specific visuals).

## How to Play

1.  **Open the Game:** Launch the game by opening `index.html` in a web browser.
2.  **Select a Scenario:** The scenario selector screen will appear. Choose a scenario from the list and click "Start Selected Scenario."
3.  **Make Choices:** Read the scenario text and make decisions by clicking on the choice buttons provided. Your choices will affect your metrics and relationships.
4.  **Complete QTEs:** Some situations will trigger a Quick Time Event. Follow the on-screen instructions (e.g., "Stop the bar in the target zone!") and click the action button at the right moment.
5.  **Progress and Observe Outcomes:** Continue making choices and completing QTEs to progress through the scenario and see the consequences of your actions.
6.  **Replay:** Once a scenario ends, you can return to the scenario selector to try a different scenario or replay the same one to explore different paths.

## Adding New Scenarios (`data/scenarios.json`)

New scenarios are added by editing the `data/scenarios.json` file. This file contains an array of scenario objects.

### Scenario Object Structure

Each scenario object in the `scenarios` array has the following structure:

```json
{
    "id": "unique_scenario_identifier",
    "title": "Scenario Title Displayed in Selector",
    "description": "A brief description of the scenario for the selector screen.",
    "involvedNPCs": ["NPC_ID_1", "NPC_ID_2"],
    "startNode": "node_id_of_the_first_node",
    "nodes": [
        // Array of Node Objects (see below)
    ]
}
```

*   `id` (String): A unique identifier for the scenario (e.g., "tenant_complaint_leak").
*   `title` (String): The title of the scenario, displayed in the scenario selector.
*   `description` (String, Optional): A short description of the scenario also displayed in the selector.
*   `involvedNPCs` (Array of Strings, Optional): A list of NPC IDs relevant to this scenario. These IDs are used to initialize and track relationship scores (e.g., "NPC_MRS_DAVIS").
*   `startNode` (String): The `nodeId` of the first node to be displayed when the scenario begins.
*   `nodes` (Array of Objects): An array containing all the node objects that make up this scenario.

### Node Object Structure

Each node object within a scenario's `nodes` array defines a specific point or step in the scenario:

```json
{
    "nodeId": "unique_node_identifier_within_scenario",
    "text": "The main narrative text displayed to the player for this node.",
    "image": "assets/images/characters/character_image.png",
    "imageAlt": "Alt text for the character/event image",
    "location_image": "assets/images/locations/location_background.png",
    "locationAlt": "Alt text for the location image",
    "choices": [
        {
            "text": "Text for player choice 1",
            "effects": {
                "tenantSatisfaction": -10,
                "managerStress": 5,
                "relationship_NPC_ID_1": 1
            },
            "nextNode": "next_node_id_for_choice_1"
        },
        {
            "text": "Text for player choice 2",
            "effects": { "financialHealth": -50 },
            "nextNode": "next_node_id_for_choice_2"
        }
    ],
    "qte": {
        // QTE Object (see below)
    },
    "endsScenario": false,
    "endText": "This text is displayed if endsScenario is true."
}
```

*   `nodeId` (String): A unique identifier for this node within the current scenario (e.g., "leak_reported_start", "leak_investigation_choice").
*   `text` (String): The main descriptive text for this node.
*   `image` (String, Optional): Path to an image representing a character or event.
*   `imageAlt` (String, Optional): Alt text for the `image`.
*   `location_image` (String, Optional): Path to an image representing the location/background.
*   `locationAlt` (String, Optional): Alt text for the `location_image`.
*   `choices` (Array of Objects, Optional): An array of choice objects available to the player at this node. Not present if the node has a QTE or ends the scenario without choices.
    *   `text` (String): The text displayed on the choice button.
    *   `effects` (Object, Optional): An object defining the impact of this choice on game metrics and NPC relationships.
        *   Metric keys match `gameState.metrics` (e.g., `tenantSatisfaction`, `managerStress`, `buildingCondition`, `financialHealth`). Values are numerical changes (e.g., `10`, `-5`).
        *   NPC relationship keys are prefixed with `relationship_` followed by the NPC ID (e.g., `relationship_NPC_MRS_DAVIS`). Values are numerical changes.
    *   `nextNode` (String): The `nodeId` of the node to transition to if this choice is selected.
*   `qte` (Object, Optional): If this node triggers a QTE, this object contains the QTE definition (see "Quick Time Event (QTE) System" section below).
*   `endsScenario` (Boolean, Optional): Set to `true` if this node signifies the end of the scenario. Default is `false`.
*   `endText` (String, Optional): Text to display if `endsScenario` is `true`.

**Example of `effects`:**
```json
"effects": {
    "tenantSatisfaction": -5, // Decreases tenant satisfaction by 5
    "managerStress": 10,      // Increases manager stress by 10
    "buildingCondition": -2,  // Decreases building condition by 2
    "financialHealth": -100,  // Decreases financial health by 100
    "relationship_NPC_TENANT_ANGRY": -1 // Decreases relationship with NPC_TENANT_ANGRY by 1
}
```

## Quick Time Event (QTE) System

The game includes a Quick Time Event system to introduce skill-based challenges.

**Current QTE Type:** "StopTheMovingBar"

### Node `qte` Object Structure

When a node includes a QTE, its `qte` property will contain an object with the following structure:

```json
"qte": {
    "type": "StopTheMovingBar",
    "instructionText": "Quick! Stop the bar in the green zone!",
    "image": "assets/images/qte/repair_qte_bg.png", // Optional: specific image for the QTE
    "parameters": {
        "targetZoneStart": 30, // Percentage from left where target zone starts
        "targetZoneEnd": 70,   // Percentage from left where target zone ends
        "barSpeed": 50,        // Milliseconds per bar movement step (lower is faster)
        "attempts": 1          // Number of attempts (currently, game logic supports 1 attempt per QTE instance)
    },
    "successEffects": {
        "buildingCondition": 5,
        "managerStress": -5
    },
    "failureEffects": {
        "buildingCondition": -10,
        "managerStress": 10
    },
    "successNextNode": "node_after_qte_success",
    "failureNextNode": "node_after_qte_failure"
}
```

*   `type` (String): Specifies the type of QTE. Currently, only "StopTheMovingBar" is implemented.
*   `instructionText` (String): Text displayed to the player explaining the QTE objective.
*   `image` (String, Optional): A background image specific to this QTE.
*   `parameters` (Object): Contains parameters specific to the QTE type.
    *   `targetZoneStart` (Number): The starting position (percentage from the left) of the success zone for the moving bar.
    *   `targetZoneEnd` (Number): The ending position (percentage from the left) of the success zone.
    *   `barSpeed` (Number): Controls the speed of the moving bar. It's the delay in milliseconds for `setTimeout` in the animation loop, so a *smaller* number means a *faster* bar.
    *   `attempts` (Number, Optional): Defines how many tries the player gets. (Note: The current `main.js` implementation is primarily geared for single attempts per QTE encounter, but the structure allows for this parameter).
*   `successEffects` (Object): An `effects` object (similar to choice effects) applied if the QTE is completed successfully.
*   `failureEffects` (Object): An `effects` object applied if the QTE is failed.
*   `successNextNode` (String): The `nodeId` to transition to upon successful QTE completion.
*   `failureNextNode` (String): The `nodeId` to transition to upon QTE failure.
---

*This README provides a comprehensive guide to understanding, playing, and extending the Property Management Game.*
