/**
 * @file main.js
 * @description This file contains the core logic for the Property Manager Simulator game.
 * It handles game state management, scenario progression, UI updates, metric tracking,
 * NPC relationship management, and the Quick Time Event (QTE) engine.
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- QTE Constants ---
    const QTE_MOVING_BAR_WIDTH_PERCENT = 5; // Visual width of the QTE moving bar as a percentage of the track.
    const QTE_MOVING_BAR_ORIGINAL_COLOR = '#ff4500'; // Original color of the QTE bar (matches style.css).
    const QTE_SUCCESS_COLOR = '#77dd77'; // Color for successful QTE.
    const QTE_FAILURE_COLOR = '#ff6961'; // Color for failed QTE.
    const QTE_FEEDBACK_DURATION_MS = 750; // Duration to display success/failure color.

    // --- Game State Variables ---
    /** @type {object|null} currentScenario - The currently active scenario object. */
    let currentScenario = null;
    /** @type {string|null} currentNodeId - The ID of the current node within the active scenario. */
    let currentNodeId = null;
    /** @type {object|null} scenariosData - Holds all scenario data loaded from JSON. */
    let scenariosData = null;
    /** @type {boolean} activeQTE - Flag indicating if a QTE is currently in progress. */
    let activeQTE = false;

    // --- Initial Game State ---
    /** 
     * @type {{metrics: {tenantSatisfaction: number, managerStress: number, buildingCondition: number, financialHealth: number}, relationshipScores: object}} 
     * @description Holds the player's current metrics and relationship scores with NPCs.
     */
    let gameState = {
        metrics: { // Core player metrics.
            tenantSatisfaction: 70, // Range: 0-100
            managerStress: 10,      // Range: 0-100 (lower is better)
            buildingCondition: 80,  // Range: 0-100
            financialHealth: 5000   // Monetary value.
        },
        relationshipScores: {} // Stores relationship scores with NPCs, e.g., { "NPC_MRS_DAVIS": 0 }. Initialized by scenarios.
    };

    // --- UI Elements ---
    // Main display areas
    const scenarioTextElement = document.getElementById('scenario-text');
    const scenarioImageElement = document.getElementById('scenario-image'); // For character or event images.
    const locationImageElement = document.getElementById('location-image'); // For background/location images.
    const choicesAreaElement = document.getElementById('choices-area'); // Container for player choices.
    const feedbackTextElement = document.getElementById('feedback-text'); // For displaying results of actions or QTEs.

    // Metrics Display Elements
    const tenantSatisfactionDisplay = document.getElementById('tenantSatisfaction');
    const managerStressDisplay = document.getElementById('managerStress');
    const buildingConditionDisplay = document.getElementById('buildingCondition');
    const financialHealthDisplay = document.getElementById('financialHealth');

    // Relationship Score Display Elements
    const npcRelationshipContainer = document.getElementById('npc-relationship-display'); // Container for NPC info.
    const npcNameDisplay = document.getElementById('npc-name'); // Displays current NPC's name.
    const npcRelationshipScoreDisplay = document.getElementById('npc-relationship-score'); // Displays score with current NPC.

    // QTE UI Elements
    const qteContainer = document.getElementById('qte-container'); // Main container for QTE.
    const qteInstructionTextElement = document.getElementById('qte-instruction-text'); // Instructions for QTE.
    const qteTrackElement = document.getElementById('qte-track'); // Visual track for the moving bar.
    const qteMovingBarElement = document.getElementById('qte-moving-bar'); // The moving bar itself.
    const qteTargetZoneElement = document.getElementById('qte-target-zone'); // The target area for the QTE.
    const qteActionButton = document.getElementById('qte-action-button'); // Button to trigger QTE action.

    /** @type {number|null} qteAnimationId - ID for the QTE animation frame (setTimeout). */
    let qteAnimationId = null;
    /** @type {number} qteCurrentPosition - Current horizontal position of the QTE bar (percentage). */
    let qteCurrentPosition = 0;
    /** @type {number} qteDirection - Direction of QTE bar movement (1 for right, -1 for left). */
    let qteDirection = 1;


    /**
     * Updates the displayed game metrics based on the current gameState.
     * @returns {void}
     */
    function updateMetricsDisplay() {
        tenantSatisfactionDisplay.textContent = gameState.metrics.tenantSatisfaction;
        managerStressDisplay.textContent = gameState.metrics.managerStress;
        buildingConditionDisplay.textContent = gameState.metrics.buildingCondition;
        financialHealthDisplay.textContent = gameState.metrics.financialHealth;
    }

    /**
     * Updates the display for NPC relationship scores.
     * If an NPC ID is provided and exists in gameState, their info is shown.
     * Otherwise, the NPC display area is hidden.
     * @param {string|null} npcId - The ID of the NPC to display, or null to hide.
     * @returns {void}
     */
    function updateRelationshipDisplay(npcId) {
        if (npcId && gameState.relationshipScores.hasOwnProperty(npcId)) {
            npcNameDisplay.textContent = npcId.replace("NPC_", "").replace(/_/g, " "); // Basic formatting for display
            npcRelationshipScoreDisplay.textContent = gameState.relationshipScores[npcId];
            npcRelationshipContainer.style.display = 'block';
        } else {
            npcRelationshipContainer.style.display = 'none'; // Hide if no specific NPC or NPC not found
        }
    }
    
    /**
     * Initializes relationship scores for NPCs involved in the current scenario.
     * If an NPC isn't already in `gameState.relationshipScores`, they are added with a default score of 0.
     * @param {object} scenario - The current scenario object.
     * @returns {void}
     */
    function initializeScenarioNPCs(scenario) {
        if (scenario.involvedNPCs && Array.isArray(scenario.involvedNPCs)) {
            scenario.involvedNPCs.forEach(npcId => {
                if (!gameState.relationshipScores.hasOwnProperty(npcId)) {
                    gameState.relationshipScores[npcId] = 0; // Default to a neutral score
                }
            });
            // Display the first NPC's relationship by default, if any are involved
            if (scenario.involvedNPCs.length > 0) {
                updateRelationshipDisplay(scenario.involvedNPCs[0]);
            } else {
                 updateRelationshipDisplay(null); // Hide if no NPCs are involved in this scenario
            }
        } else {
            updateRelationshipDisplay(null); // Hide if scenario has no 'involvedNPCs' array
        }
    }

    /**
     * Asynchronously loads scenario data from a JSON file.
     * On successful load, it calls `startGame` to initialize the game.
     * @async
     * @returns {void}
     */
    async function loadScenarios() {
        try {
            const response = await fetch('data/scenarios.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            scenariosData = await response.json();
            startGame(); // Initialize the game with the first scenario by default
        } catch (error) {
            console.error("Could not load scenarios:", error);
            scenarioTextElement.textContent = "Error loading game scenarios. Please try again later.";
        }
    }

    /**
     * Starts the game, typically with the first scenario found in the loaded data.
     * Resets QTE state, initializes scenario, and renders the first node.
     * @returns {void}
     */
    function startGame() {
        activeQTE = false; // Ensure no QTE is active at the start
        qteContainer.style.display = 'none'; // Hide QTE UI elements

        if (scenariosData && scenariosData.scenarios && scenariosData.scenarios.length > 0) {
            // Default to the first scenario in the data, unless another is chosen via scenario selector
            currentScenario = scenariosData.scenarios[0]; 
            currentNodeId = currentScenario.startNode;
            initializeScenarioNPCs(currentScenario); // Set up NPC relationships for this scenario
            renderNode(currentNodeId); // Display the starting node
            feedbackTextElement.textContent = ""; // Clear any previous feedback
        } else {
            scenarioTextElement.textContent = "No scenarios found. Game cannot start.";
        }
        updateMetricsDisplay(); // Show initial metrics
    }

    /**
     * Starts the game with a specific scenario, usually called from the scenario selector.
     * @param {string} scenarioId - The ID of the scenario to start.
     * @returns {void}
     */
    window.startGameWithScenario = function(scenarioId) {
        activeQTE = false;
        qteContainer.style.display = 'none';
        
        if (scenariosData && scenariosData.scenarios) {
            const selectedScenario = scenariosData.scenarios.find(s => s.id === scenarioId);
            if (selectedScenario) {
                currentScenario = selectedScenario;
                currentNodeId = currentScenario.startNode;
                initializeScenarioNPCs(currentScenario);
                renderNode(currentNodeId);
                feedbackTextElement.textContent = "";
                updateMetricsDisplay();
            } else {
                console.error(`Scenario with ID "${scenarioId}" not found.`);
                scenarioTextElement.textContent = "Selected scenario not found.";
            }
        } else {
            console.error("Scenarios data is not loaded. Cannot start specific scenario.");
            scenarioTextElement.textContent = "No scenarios loaded.";
        }
    };

    /**
     * Renders a specific node of the current scenario.
     * Displays node text, images, and choices or QTEs.
     * @param {string} nodeId - The ID of the scenario node to render.
     * @returns {void}
     */
    function renderNode(nodeId) {
        const node = currentScenario.nodes.find(n => n.nodeId === nodeId);
        if (!node) {
            console.error("Node not found:", nodeId);
            scenarioTextElement.textContent = "Error: Scenario progression error.";
            return;
        }

        currentNodeId = nodeId; // Update current node ID
        scenarioTextElement.textContent = node.text; // Display node text
        
        // Update images, using placeholders if specific images aren't defined
        scenarioImageElement.src = node.image || 'assets/images/placeholder.svg';
        scenarioImageElement.alt = node.imageAlt || "Scenario Image"; // Added alt text from potential node property
        locationImageElement.src = node.location_image || 'assets/images/placeholder_location.svg';
        locationImageElement.alt = node.locationAlt || "Location Image"; // Added alt text
        
        // Update relationship display, typically showing the first involved NPC.
        // This could be enhanced to show a specific NPC mentioned in the node.
        if (currentScenario.involvedNPCs && currentScenario.involvedNPCs.length > 0) {
            updateRelationshipDisplay(currentScenario.involvedNPCs[0]);
        } else {
            updateRelationshipDisplay(null); // Hide if no NPCs relevant to the scenario
        }

        choicesAreaElement.innerHTML = ''; // Clear previous choices or buttons

        // Check if the node triggers a QTE
        if (node.qte) {
            activeQTE = true;
            startQTE(node.qte); // Initialize and start the QTE
        } else {
            // If no QTE, proceed with standard choices or end-of-scenario logic
            activeQTE = false;
            qteContainer.style.display = 'none'; // Ensure QTE UI is hidden

            if (node.endsScenario) {
                // Handle scenario ending
                feedbackTextElement.textContent = node.endText || "Scenario Ended.";
                const restartButton = document.createElement('button');
                restartButton.textContent = "Choose Another Scenario";
                restartButton.addEventListener('click', () => {
                    // Reset core game state for a new scenario run
                    gameState.metrics = {
                        tenantSatisfaction: 70, managerStress: 10,
                        buildingCondition: 80, financialHealth: 5000
                    };
                    gameState.relationshipScores = {}; // Reset NPC relationships
                    updateMetricsDisplay();
                    updateRelationshipDisplay(null); // Clear NPC display
                    
                    // Trigger the scenario selector to be shown (if available)
                    if (window.showScenarioSelector) {
                        window.showScenarioSelector();
                    }
                });
                choicesAreaElement.appendChild(restartButton);
            } else if (node.choices && node.choices.length > 0) {
                // Display choices if available
                node.choices.forEach(choice => {
                    const button = document.createElement('button');
                    button.textContent = choice.text;
                    button.addEventListener('click', () => handleChoice(choice));
                    choicesAreaElement.appendChild(button);
                });
                feedbackTextElement.textContent = ""; // Clear feedback from previous node
            } else {
                 // Fallback if node neither ends scenario, has QTE, nor choices
                 feedbackTextElement.textContent = "Scenario ended or no choices available.";
            }
        }
    }
    
    /**
     * Applies the effects of a choice or QTE outcome to the game state.
     * Effects can modify metrics (e.g., tenantSatisfaction) or relationship scores.
     * Relationship effects are identified by a "relationship_" prefix in the effect key.
     * @param {object} effects - An object where keys are metric/relationship IDs and values are the changes to apply.
     *                           Example: { "tenantSatisfaction": -10, "relationship_NPC_MRS_DAVIS": 5 }
     * @returns {void}
     */
    function applyEffects(effects) {
        if (effects) {
            for (const key in effects) {
                if (gameState.metrics.hasOwnProperty(key)) {
                    // Apply effect to a game metric
                    gameState.metrics[key] += effects[key];
                } else if (key.startsWith("relationship_")) {
                    // Apply effect to an NPC relationship score
                    const npcId = key.substring("relationship_".length); // Extract NPC ID from key
                    if (gameState.relationshipScores.hasOwnProperty(npcId)) {
                        gameState.relationshipScores[npcId] += effects[key];
                    } else {
                        // If NPC is not in scores, initialize them (should ideally be pre-initialized by initializeScenarioNPCs)
                        console.warn(`NPC ${npcId} not pre-initialized in relationshipScores. Initializing now.`);
                        gameState.relationshipScores[npcId] = effects[key];
                    }
                    // If the affected NPC is currently displayed, update their score live
                    if (npcRelationshipContainer.style.display === 'block' && 
                        npcNameDisplay.textContent === npcId.replace("NPC_", "").replace(/_/g, " ")) {
                         updateRelationshipDisplay(npcId);
                    }
                } else {
                    console.warn(`Unknown metric or effect key: ${key}`);
                }
            }
            updateMetricsDisplay(); // Refresh displayed metrics after applying all effects
        }
    }

    /**
     * Handles the player's selection of a choice.
     * Prevents action if a QTE is active. Applies effects and advances to the next node.
     * @param {object} choice - The choice object selected by the player. Contains effects and nextNodeId.
     * @returns {void}
     */
    function handleChoice(choice) {
        if (activeQTE) return; // Ignore choice clicks if a QTE is active

        applyEffects(choice.effects); // Apply any effects from the choice

        if (choice.nextNode) {
            renderNode(choice.nextNode); // Proceed to the next node
        } else if (!currentScenario.nodes.find(n => n.nodeId === currentNodeId).endsScenario) {
            // This case should ideally not be reached if scenario JSON is well-formed
            console.error("Choice does not lead to a next node and is not an end node:", choice);
            feedbackTextElement.textContent = "Error in scenario flow. Choice leads nowhere.";
        }
    }

    // --- QTE Engine ("StopTheMovingBar") ---
    /** @type {object|null} qteConfig - Stores the configuration for the currently active QTE. */
    let qteConfig = null; 

    /**
     * Initializes and starts a Quick Time Event (QTE).
     * Sets up the QTE UI elements based on the provided QTE data.
     * @param {object} qteData - Configuration object for the QTE, from the scenario node.
     *                           Includes parameters like instruction text, bar speed, target zone, etc.
     * @returns {void}
     */
    function startQTE(qteData) {
        qteConfig = qteData; // Store QTE configuration
        qteContainer.style.display = 'block'; // Make QTE UI visible
        choicesAreaElement.innerHTML = ''; // Hide standard choices during QTE
        feedbackTextElement.textContent = ""; // Clear previous feedback
        qteMovingBarElement.style.backgroundColor = QTE_MOVING_BAR_ORIGINAL_COLOR; // Reset bar to original color

        qteInstructionTextElement.textContent = qteConfig.instructionText || "Stop the bar in the target zone!";
        
        // Configure target zone visuals based on QTE parameters
        const targetStartPercent = qteConfig.parameters.targetZoneStart || 30; // Default if not specified
        const targetEndPercent = qteConfig.parameters.targetZoneEnd || 70;   // Default if not specified
        qteTargetZoneElement.style.left = `${targetStartPercent}%`;
        qteTargetZoneElement.style.width = `${targetEndPercent - targetStartPercent}%`;

        // Reset bar position and animation state
        qteMovingBarElement.style.left = '0%';
        qteCurrentPosition = 0;
        qteDirection = 1; // Start moving right

        qteActionButton.onclick = () => stopBar(); // Set action button to trigger stopBar

        moveBar(); // Start the bar animation
    }

    /**
     * Animates the QTE moving bar.
     * Called recursively via `setTimeout` to create the animation loop.
     * Movement stops if `activeQTE` becomes false.
     * @returns {void}
     */
    function moveBar() {
        if (!activeQTE) return; // Stop animation if QTE is no longer active (e.g., concluded)

        const speed = qteConfig.parameters.barSpeed || 50; // Speed based on QTE config (lower value = faster bar, as it's a timeout delay)
        
        // Movement increment; larger value means faster visual movement for a given 'speed' timeout
        const movementIncrement = 2; // Bar moves 2% of track width per step
        qteCurrentPosition += qteDirection * movementIncrement;

        // Reverse direction at track boundaries
        // Boundary check considers the width of the bar itself to prevent it going off-track
        if (qteCurrentPosition >= 100 - QTE_MOVING_BAR_WIDTH_PERCENT) { 
            qteCurrentPosition = 100 - QTE_MOVING_BAR_WIDTH_PERCENT; // Clamp to max position
            qteDirection = -1; // Change direction to left
        } else if (qteCurrentPosition <= 0) {
            qteCurrentPosition = 0; // Clamp to min position
            qteDirection = 1;  // Change direction to right
        }
        qteMovingBarElement.style.left = `${qteCurrentPosition}%`; // Update visual position
        
        // Continue animation loop
        qteAnimationId = setTimeout(moveBar, speed); 
    }

    /**
     * Stops the QTE bar, evaluates success or failure, and processes the outcome.
     * Called when the QTE action button is pressed.
     * @returns {void}
     */
    function stopBar() {
        if (!activeQTE) return; // Do nothing if QTE is not active
        clearTimeout(qteAnimationId); // Stop the bar animation loop

        const barFinalPosition = qteCurrentPosition; // Current position when stopped
        const targetStart = qteConfig.parameters.targetZoneStart;
        // Adjust targetEnd for the width of the bar itself, so success is when the bar's *leading edge* is within the visual target zone.
        const targetEnd = qteConfig.parameters.targetZoneEnd - QTE_MOVING_BAR_WIDTH_PERCENT; 

        // Determine if the bar was stopped within the target zone
        let success = (barFinalPosition >= targetStart && barFinalPosition <= targetEnd);

        // The game currently implements QTEs as single-attempt events.
        // Logic for multiple attempts was commented out but could be reinstated here if needed.
        // Example: qteConfig.parameters.attempts = (qteConfig.parameters.attempts || 1) - 1;

        if (success) {
            feedbackTextElement.textContent = "Success!";
            qteMovingBarElement.style.backgroundColor = QTE_SUCCESS_COLOR; // Visual feedback for success
            applyEffects(qteConfig.successEffects); // Apply success effects
            // Delay next node rendering to allow player to see feedback
            setTimeout(() => {
                renderNode(qteConfig.successNextNode); 
            }, QTE_FEEDBACK_DURATION_MS);
        } else {
            feedbackTextElement.textContent = "Missed!";
            qteMovingBarElement.style.backgroundColor = QTE_FAILURE_COLOR; // Visual feedback for failure
            applyEffects(qteConfig.failureEffects); // Apply failure effects
            // Delay next node rendering
            setTimeout(() => {
                renderNode(qteConfig.failureNextNode);
            }, QTE_FEEDBACK_DURATION_MS);
        }
        activeQTE = false; // Mark QTE as concluded

        // Note: The QTE container is typically hidden or reset by `renderNode` when the next node loads.
        // If a QTE could end and the UI remains in a state where the bar is visible but inactive,
        // an explicit color reset might be needed here, e.g.,
        // setTimeout(() => { qteMovingBarElement.style.backgroundColor = QTE_MOVING_BAR_ORIGINAL_COLOR; }, QTE_FEEDBACK_DURATION_MS);
    }

    // --- Game Initialization ---
    /**
     * Initial call to load scenarios and start the game when the DOM is fully loaded.
     */
    loadScenarios();
});
```
