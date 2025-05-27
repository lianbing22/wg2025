/**
 * @file scenario_selector.js
 * @description This file manages the scenario selection screen. It loads available scenarios
 * from the JSON data, displays them to the player, and allows the player to choose a
 * scenario to start. It interacts with the main game logic (`main.js`) to initiate
 * the selected scenario.
 */
document.addEventListener('DOMContentLoaded', function() {
    /** @type {object|null} scenariosData - Holds all scenario data loaded from JSON. */
    let scenariosData = null;
    
    // --- UI Elements for Scenario Selection ---
    const scenarioSelectorContainer = document.getElementById('scenario-selector'); // Main container for the selector UI.
    const scenarioListElement = document.getElementById('scenario-list'); // UL or DIV element to list scenarios.
    const startSelectedScenarioButton = document.getElementById('start-selected-scenario'); // Button to start the chosen scenario.
    
    /** @type {string|null} selectedScenarioId - Stores the ID of the currently selected scenario from the radio buttons. */
    let selectedScenarioId = null;
    
    /**
     * Asynchronously loads scenario data from 'data/scenarios.json'.
     * On success, it calls `displayScenarioList` to populate the selector UI.
     * Handles errors by displaying a message in the scenario list area.
     * @async
     * @returns {void}
     */
    async function loadScenarioSelector() {
        try {
            const response = await fetch('data/scenarios.json');
            if (!response.ok) {
                // If the HTTP response is not OK (e.g., 404, 500), throw an error.
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            scenariosData = await response.json();
            displayScenarioList(); // Populate the list once data is loaded.
        } catch (error) {
            console.error("Could not load scenarios for selector:", error);
            // Display an error message to the user within the scenario list area.
            scenarioListElement.innerHTML = '<p class="error-message">Error loading scenarios. Please try again later.</p>';
        }
    }
    
    /**
     * Populates the scenario list UI with available scenarios from `scenariosData`.
     * Each scenario is presented as a radio button input with a label.
     * @returns {void}
     */
    function displayScenarioList() {
        scenarioListElement.innerHTML = ''; // Clear any existing list items.
        
        if (scenariosData && scenariosData.scenarios && scenariosData.scenarios.length > 0) {
            scenariosData.scenarios.forEach((scenario, index) => {
                const scenarioItem = document.createElement('div');
                scenarioItem.className = 'scenario-item'; // For styling individual scenario entries.
                
                // Create a unique ID for the radio input for label association.
                const radioId = `scenario-radio-${index}`;
                
                // Format NPC list for display: remove "NPC_" prefix and replace underscores with spaces.
                const involvedNpcsDisplay = scenario.involvedNPCs && scenario.involvedNPCs.length > 0 
                    ? scenario.involvedNPCs.join(', ').replace(/NPC_/g, '').replace(/_/g, ' ') 
                    : 'None';

                scenarioItem.innerHTML = `
                    <input type="radio" id="${radioId}" name="scenario-selection" value="${scenario.id}">
                    <label for="${radioId}">
                        <h3>${scenario.title || 'Untitled Scenario'}</h3>
                        <p>Involved NPCs: ${involvedNpcsDisplay}</p>
                        ${scenario.description ? `<p class="scenario-description">${scenario.description}</p>` : ''}
                    </label>
                `;
                
                const radioInput = scenarioItem.querySelector('input[type="radio"]');
                // Add event listener to update `selectedScenarioId` when a radio button is chosen.
                radioInput.addEventListener('change', function() {
                    if (this.checked) {
                        selectedScenarioId = this.value;
                        // Enable the start button only when a scenario is selected.
                        if (startSelectedScenarioButton) {
                            startSelectedScenarioButton.disabled = false;
                        }
                    }
                });
                
                scenarioListElement.appendChild(scenarioItem);
            });
        } else {
            // Handle cases where no scenarios are found or data is malformed.
            scenarioListElement.innerHTML = '<p>No scenarios available at the moment.</p>';
        }
    }
    
    /**
     * Starts the game with the scenario ID stored in `selectedScenarioId`.
     * Hides the scenario selector UI and shows the main game container.
     * Calls `window.startGameWithScenario` (defined in `main.js`) to initiate the game.
     * @returns {void}
     */
    function startSelectedScenario() {
        if (selectedScenarioId) {
            // Hide the scenario selector view.
            if (scenarioSelectorContainer) {
                scenarioSelectorContainer.style.display = 'none';
            }
            
            // Show the main game container.
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.style.display = 'block';
            }
            
            // Call the global function from main.js to start the game with the chosen scenario.
            if (window.startGameWithScenario) {
                window.startGameWithScenario(selectedScenarioId);
            } else {
                console.error("startGameWithScenario function is not defined on window. Ensure main.js is loaded.");
            }
        } else {
            // This case should ideally not be reached if the start button is disabled appropriately.
            console.warn("Attempted to start scenario without a selection.");
        }
    }
    
    // Attach event listener to the "Start Scenario" button.
    if (startSelectedScenarioButton) {
        startSelectedScenarioButton.addEventListener('click', startSelectedScenario);
        startSelectedScenarioButton.disabled = true; // Initially disable until a scenario is selected.
    }
    
    /**
     * Makes the scenario selector UI visible and hides the main game container.
     * This function is exposed globally to be callable from `main.js` (e.g., when a scenario ends).
     * Resets the selection state of the scenario list.
     * @global
     * @returns {void}
     */
    window.showScenarioSelector = function() {
        if (scenarioSelectorContainer) {
            scenarioSelectorContainer.style.display = 'block';
        }
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.style.display = 'none';
        }
        
        selectedScenarioId = null; // Reset the selected scenario ID.
        if (startSelectedScenarioButton) {
            startSelectedScenarioButton.disabled = true; // Disable start button as no scenario is selected now.
        }
        
        // Clear any previously checked radio buttons in the list.
        const radioInputs = scenarioListElement.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(input => input.checked = false);
    };
    
    // --- Initialization ---
    // Load scenarios when the DOM is ready.
    loadScenarioSelector();
});