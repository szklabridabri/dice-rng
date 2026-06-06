(function() {
    // ============================================================
    // REALISTYCZNE SZANSE – BARDZO RZADKIE WYSOKIE OCZKA
    // ============================================================
    const PROB_TABLE = [
        500000,  // 1 oczko  – 50%
        250000,  // 2 oczka – 25%
        120000,  // 3 oczka – 12%
        60000,   // 4 oczka – 6%
        30000,   // 5 oczek – 3%
        15000,   // 6 oczek – 1.5%
        8000,    // 7 oczek – 0.8%
        4000,    // 8 oczek – 0.4%
        2500,    // 9 oczek – 0.25%
        1500,    // 10 oczek – 0.15%
        1000,    // 11 oczek – 0.1%
        700,     // 12 oczek – 0.07%
        500,     // 13 oczek – 0.05%
        300,     // 14 oczek – 0.03%
        200,     // 15 oczek – 0.02%
        120,     // 16 oczek – 0.012%
        80,      // 17 oczek – 0.008%
        50,      // 18 oczek – 0.005%
        25,      // 19 oczek – 0.0025%
        7        // 20 oczek – 0.0007%
    ];
    
    const MAX_DICE_VALUE = 20;
    const TOTAL_WEIGHT = PROB_TABLE.reduce((a,b) => a + b, 0);
    
    // ============================================================
    // COOLDOWN
    // ============================================================
    let rollCooldown = false;
    let cooldownTimer = null;
    
    // ============================================================
    // SORTOWANIE – tryby
    // ============================================================
    const SORT_MODES = {
        EYES_ASC: 'eyes_asc',      // od najmniejszej do największej
        EYES_DESC: 'eyes_desc',    // od największej do najmniejszej
        NEWEST: 'newest',          // najnowsze (ostatnie dodane)
        OLDEST: 'oldest',          // najstarsze (pierwsze dodane)
        CRAFTED_FIRST: 'crafted_first',    // najpierw craftowane
        NON_CRAFTED_FIRST: 'non_crafted_first' // najpierw niecraftowane
    };
    
    let currentSortMode = SORT_MODES.NEWEST; // domyślnie najnowsze
    let sortButtonsContainer = null;
    
    // ============================================================
    // FUNKCJA SORTUJĄCA INWENTARZ
    // ============================================================
    function sortInventory() {
        const originalOrder = [...inventory];
        
        switch(currentSortMode) {
            case SORT_MODES.EYES_ASC:
                inventory.sort((a, b) => a.eyes - b.eyes);
                break;
            case SORT_MODES.EYES_DESC:
                inventory.sort((a, b) => b.eyes - a.eyes);
                break;
            case SORT_MODES.NEWEST:
                // przywróć oryginalną kolejność (ostatnie dodane na końcu)
                // ale nowsze = większy indeks, więc nie zmieniamy
                inventory.sort((a, b) => {
                    const idxA = originalOrder.findIndex(item => item === a);
                    const idxB = originalOrder.findIndex(item => item === b);
                    return idxB - idxA;
                });
                break;
            case SORT_MODES.OLDEST:
                inventory.sort((a, b) => {
                    const idxA = originalOrder.findIndex(item => item === a);
                    const idxB = originalOrder.findIndex(item => item === b);
                    return idxA - idxB;
                });
                break;
            case SORT_MODES.CRAFTED_FIRST:
                inventory.sort((a, b) => {
                    if (a.crafted === b.crafted) return 0;
                    return a.crafted ? -1 : 1;
                });
                break;
            case SORT_MODES.NON_CRAFTED_FIRST:
                inventory.sort((a, b) => {
                    if (a.crafted === b.crafted) return 0;
                    return a.crafted ? 1 : -1;
                });
                break;
            default:
                break;
        }
        
        // Zaznaczenia są resetowane przy sortowaniu (dla bezpieczeństwa)
        selectedIndices.clear();
        renderInventory();
    }
    
    // ============================================================
    // GENEROWANIE PANELU SORTOWANIA
    // ============================================================
    function generateSortPanelHTML() {
        return `
            <div style="background: rgba(0,0,0,0.4); border-radius: 1rem; padding: 0.8rem; margin-bottom: 1rem;">
                <div style="font-size: 0.85rem; font-weight: bold; margin-bottom: 0.5rem; color: #ffd966; display: flex; align-items: center; gap: 0.5rem;">
                    🔄 SORT BY:
                    <span id="currentSortModeLabel" style="font-size: 0.7rem; background: #2a4a6a; padding: 0.2rem 0.6rem; border-radius: 20px;">Newest</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    <button data-sort="eyes_asc" class="sort-btn" style="background: #2c3e50; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.7rem; cursor: pointer; transition: 0.1s;">⬆️ 1→20</button>
                    <button data-sort="eyes_desc" class="sort-btn" style="background: #2c3e50; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.7rem; cursor: pointer;">⬇️ 20→1</button>
                    <button data-sort="newest" class="sort-btn" style="background: #2c3e50; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.7rem; cursor: pointer;">🕐 Newest</button>
                    <button data-sort="oldest" class="sort-btn" style="background: #2c3e50; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.7rem; cursor: pointer;">🕒 Oldest</button>
                    <button data-sort="crafted_first" class="sort-btn" style="background: #2c3e50; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.7rem; cursor: pointer;">✨ Crafted</button>
                    <button data-sort="non_crafted_first" class="sort-btn" style="background: #2c3e50; border: none; padding: 6px 12px; border-radius: 20px; font-size: 0.7rem; cursor: pointer;">⭐ Normal</button>
                </div>
            </div>
        `;
    }
    
    function updateSortModeLabel() {
        const label = document.getElementById('currentSortModeLabel');
        if (!label) return;
        
        const modeNames = {
            eyes_asc: '⬆️ rosnąco',
            eyes_desc: '⬇️ malejąco',
            newest: '🕐 najnowsze',
            oldest: '🕒 najstarsze',
            crafted_first: '✨ craftowane',
            non_crafted_first: '⭐ zwykłe'
        };
        label.textContent = modeNames[currentSortMode] || 'najnowsze';
        
        // Podświetlenie aktywnego przycisku
        document.querySelectorAll('.sort-btn').forEach(btn => {
            const btnSort = btn.getAttribute('data-sort');
            if (btnSort === currentSortMode) {
                btn.style.background = '#f39c12';
                btn.style.color = '#1a1a2e';
                btn.style.fontWeight = 'bold';
            } else {
                btn.style.background = '#2c3e50';
                btn.style.color = '#ecf0f1';
                btn.style.fontWeight = 'normal';
            }
        });
    }
    
    function setupSortButtons() {
        const sortPanel = document.getElementById('sortPanelContainer');
        if (!sortPanel) return;
        
        sortPanel.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sortMode = btn.getAttribute('data-sort');
                if (sortMode && SORT_MODES[Object.keys(SORT_MODES).find(key => SORT_MODES[key] === sortMode)]) {
                    currentSortMode = sortMode;
                    sortInventory();
                    updateSortModeLabel();
                    addLog(`🔄 Changed sorting type to: ${btn.textContent.trim()}`);
                }
            });
        });
    }
    
    // ============================================================
    // GENEROWANIE TABELI SZANS
    // ============================================================
    function generateChanceTableHTML() {
        let html = '<div style="background: rgba(0,0,0,0.5); border-radius: 1rem; padding: 0.8rem; margin-top: 0.8rem;">';
        html += '<div style="font-size: 0.85rem; font-weight: bold; margin-bottom: 0.5rem; color: #ffd966;">📊 CHANCES:</div>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.3rem; font-size: 0.7rem;">';
        
        for (let i = 0; i < PROB_TABLE.length; i++) {
            const eyes = i + 1;
            const chancePercent = (PROB_TABLE[i] / TOTAL_WEIGHT * 100).toFixed(4);
            const oneIn = Math.round(TOTAL_WEIGHT / PROB_TABLE[i]);
            
            let rarityClass = '';
            let rarityText = '';
            if (eyes <= 3) { rarityClass = 'color: #88ff88;'; rarityText = '⭐'; }
            else if (eyes <= 7) { rarityClass = 'color: #88ffdd;'; rarityText = '⭐⭐'; }
            else if (eyes <= 12) { rarityClass = 'color: #ffaa88;'; rarityText = '⭐⭐⭐'; }
            else if (eyes <= 16) { rarityClass = 'color: #ff88ff;'; rarityText = '⭐⭐⭐⭐'; }
            else { rarityClass = 'color: #ff4444; text-shadow: 0 0 3px red;'; rarityText = '⭐⭐⭐⭐⭐'; }
            
            html += `<div style="${rarityClass} padding: 0.2rem; border-bottom: 1px solid #2a4a6a;">
                        <strong>🎲 ${eyes}</strong> ${rarityText}<br>
                        <span style="font-size: 0.65rem;">${chancePercent}%</span>
                        <span style="font-size: 0.6rem; opacity: 0.7;"> (1/${oneIn.toLocaleString()})</span>
                     </div>`;
        }
        html += '</div></div>';
        return html;
    }
    
    // ============================================================
    // FUNKCJA LOSUJĄCA
    // ============================================================
    function getRandomDiceValue() {
        const rand = Math.random() * TOTAL_WEIGHT;
        let cumulative = 0;
        for (let i = 0; i < PROB_TABLE.length; i++) {
            cumulative += PROB_TABLE[i];
            if (rand < cumulative) {
                return i + 1;
            }
        }
        return 1;
    }
    
    // ============================================================
    // STRUKTURA DANYCH
    // ============================================================
    let inventory = [];
    let selectedIndices = new Set();

    // DOM elementy
    const diceInventoryDiv = document.getElementById('diceInventory');
    const diceCountSpan = document.getElementById('diceCount');
    const logMessagesDiv = document.getElementById('logMessages');
    const rollBtn = document.getElementById('rollBtn');
    const craftBtn = document.getElementById('craftBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // ============================================================
    // DODANIE PANELI DO INTERFEJSU
    // ============================================================
    function addPanelsToGame() {
        const inventorySection = document.querySelector('.inventory-section');
        if (inventorySection && !document.getElementById('sortPanelContainer')) {
            const sortContainer = document.createElement('div');
            sortContainer.id = 'sortPanelContainer';
            sortContainer.innerHTML = generateSortPanelHTML();
            inventorySection.insertBefore(sortContainer, inventorySection.firstChild);
            setupSortButtons();
            updateSortModeLabel();
        }
        
        const infoPanel = document.querySelector('.info-panel');
        if (infoPanel && !document.getElementById('chanceTableContainer')) {
            const chanceContainer = document.createElement('div');
            chanceContainer.id = 'chanceTableContainer';
            chanceContainer.innerHTML = generateChanceTableHTML();
            infoPanel.appendChild(chanceContainer);
        }
    }
    
    // ============================================================
    // FUNKCJE POMOCNICZE
    // ============================================================
    function addLog(msg, isError = false) {
        const p = document.createElement('div');
        p.innerHTML = `📢 ${new Date().toLocaleTimeString()} - ${msg}`;
        if (isError) p.style.color = "red";
        else p.style.color = "white";
        logMessagesDiv.appendChild(p);
        p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        while(logMessagesDiv.children.length > 55) {
            logMessagesDiv.removeChild(logMessagesDiv.firstChild);
        }
    }
    
    function updateRollButtonCooldown(remainingSeconds = null) {
        if (rollCooldown) {
            rollBtn.disabled = true;
            if (remainingSeconds !== null && remainingSeconds > 0) {
                rollBtn.textContent = `⏳ ROLL (${remainingSeconds}s) ⏳`;
            } else {
                rollBtn.textContent = `⏳ COOLDOWN... ⏳`;
            }
            rollBtn.style.opacity = '0.6';
            rollBtn.style.cursor = 'not-allowed';
        } else {
            rollBtn.disabled = false;
            rollBtn.textContent = `🎲 ROLL 🎲`;
            rollBtn.style.opacity = '1';
            rollBtn.style.cursor = 'pointer';
        }
    }
    
    function startRollCooldown() {
        if (cooldownTimer) clearInterval(cooldownTimer);
        rollCooldown = true;
        let remaining = 3;
        updateRollButtonCooldown(remaining);
        
        cooldownTimer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(cooldownTimer);
                cooldownTimer = null;
                rollCooldown = false;
                updateRollButtonCooldown();
            } else {
                updateRollButtonCooldown(remaining);
            }
        }, 1000);
    }
    
    function renderInventory() {
        diceInventoryDiv.innerHTML = '';
        if (inventory.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.innerText = "💀 You don't have any dices! Click the ROLL button to interact. 💀";
            emptyMsg.style.padding = '20px';
            emptyMsg.style.color = '#aaa';
            emptyMsg.style.textAlign = 'center';
            diceInventoryDiv.appendChild(emptyMsg);
            diceCountSpan.innerText = '0';
            return;
        }

        inventory.forEach((dice, idx) => {
            const card = document.createElement('div');
            card.className = 'dice-card';
            if (selectedIndices.has(idx)) {
                card.classList.add('selected');
            }
            const eyesSpan = document.createElement('div');
            eyesSpan.className = 'dice-eyes';
            eyesSpan.innerText = dice.eyes;
            card.appendChild(eyesSpan);
            
            if (dice.crafted) {
                const craftedBadge = document.createElement('div');
                craftedBadge.className = 'crafted-badge';
                craftedBadge.innerText = 'Crafted';
                card.appendChild(craftedBadge);
            }
            
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                if (selectedIndices.has(idx)) {
                    selectedIndices.delete(idx);
                } else {
                    selectedIndices.add(idx);
                }
                renderInventory();
            });
            diceInventoryDiv.appendChild(card);
        });
        diceCountSpan.innerText = inventory.length;
    }
    
    function saveGame() {
        try {
            const toStore = inventory.map(d => ({ eyes: d.eyes, crafted: d.crafted }));
            localStorage.setItem('rngDiceGame', JSON.stringify(toStore));
            localStorage.setItem('rngDiceGame_sortMode', currentSortMode);
        } catch(e) { console.warn(e); }
    }
    
    function loadGame() {
        const saved = localStorage.getItem('rngDiceGame');
        const savedSortMode = localStorage.getItem('rngDiceGame_sortMode');
        
        if (savedSortMode && Object.values(SORT_MODES).includes(savedSortMode)) {
            currentSortMode = savedSortMode;
        }
        
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    inventory = parsed.filter(item => typeof item.eyes === 'number' && item.eyes >=1 && item.eyes <= MAX_DICE_VALUE)
                                     .map(item => ({ eyes: item.eyes, crafted: !!item.crafted }));
                    if (inventory.length > 0) addLog(`⚙️ You loaded game status (${inventory.length} dices).`);
                }
            } catch(e) { addLog("⚠️ Unable to load status", true); }
        }
        if (!inventory.length) {
            inventory.push({ eyes: 1, crafted: false });
            addLog("✨ You get free 《1》 dice! Good luck!");
        }
        
        // Zastosuj sortowanie po załadowaniu
        sortInventory();
        selectedIndices.clear();
        renderInventory();
        saveGame();
    }
    
    function resetGame() {
        if (confirm("Are you sure you want to restart the game?")) {
            if (cooldownTimer) clearInterval(cooldownTimer);
            rollCooldown = false;
            updateRollButtonCooldown();
            inventory = [];
            inventory.push({ eyes: 1, crafted: false });
            selectedIndices.clear();
            sortInventory(); // zastosuj sortowanie po resecie
            renderInventory();
            saveGame();
            addLog("🔄 You restarted the game!");
        } else {
            addLog("Restart cancelled.");
        }
    }
    
    // ============================================================
    // LOSOWANIE Z COOLDOWNEM
    // ============================================================
    function rollDice() {
        if (rollCooldown) {
            addLog("⏳ You have to wait 3 seconds! ⏳", true);
            return;
        }
        
        const newEyes = getRandomDiceValue();
        inventory.push({ eyes: newEyes, crafted: false });
        
        // Po dodaniu nowej kości, zastosuj sortowanie
        sortInventory();
        
        selectedIndices.clear();
        renderInventory();
        saveGame();
        
        let rarityDesc = "";
        if (newEyes <= 3) rarityDesc = " (Common)";
        else if (newEyes <= 7) rarityDesc = " (Uncommon)";
        else if (newEyes <= 12) rarityDesc = " (Rare)";
        else if (newEyes <= 16) rarityDesc = " (Epic ★★★)";
        else rarityDesc = " (☆ LEGENDARY ☆)";
        
        const chancePercent = (PROB_TABLE[newEyes-1] / TOTAL_WEIGHT * 100).toFixed(5);
        const oneIn = Math.round(TOTAL_WEIGHT / PROB_TABLE[newEyes-1]);
        addLog(`🎲 Got a dice with ${newEyes} number ${rarityDesc} (chances: ${chancePercent}% | 1/${oneIn.toLocaleString()})`);
        
        if (newEyes >= 19) {
            addLog(`🔥🔥 NO WAY! YOU GOT A DICE WITH ${newEyes} NUMBER! CHANCE 1/${oneIn.toLocaleString()}! 🔥🔥`, false);
        }
        
        startRollCooldown();
    }
    
    // ============================================================
    // CRAFT
    // ============================================================
    function craftDice() {
        const selectedArr = Array.from(selectedIndices).sort((a,b)=>a-b);
        const count = selectedArr.length;
        if (count < 2 || count > 4) {
            addLog(`❌ You have to select 2-4 dices to craft! (${count} selected)`, true);
            return;
        }
        const selectedDice = selectedArr.map(idx => inventory[idx]);
        if (selectedDice.some(d => !d)) {
            addLog("⚠️ Error", true);
            selectedIndices.clear();
            renderInventory();
            return;
        }
        
        const totalEyes = selectedDice.reduce((sum, dice) => sum + dice.eyes, 0);
        const halfSum = Math.floor(totalEyes / 2);
        const successRoll = Math.random() < 0.05;
        
        if (successRoll) {
            let newEyes = halfSum;
            if (newEyes < 1) newEyes = 1;
            if (newEyes > MAX_DICE_VALUE) newEyes = MAX_DICE_VALUE;
            let newInventory = [...inventory];
            for (let i = selectedArr.length-1; i >= 0; i--) {
                newInventory.splice(selectedArr[i], 1);
            }
            newInventory.push({ eyes: newEyes, crafted: true });
            inventory = newInventory;
            
            // Zastosuj sortowanie po craftingu
            sortInventory();
            
            selectedIndices.clear();
            renderInventory();
            saveGame();
            addLog(`✨✨ Craft succeeded! ✨✨ Crafted ${count} dices (number on all of them ${totalEyes}) → New dice with a ${newEyes} number! This dice is marked as "Crafted".`);
        } else {
            let newInventory = [...inventory];
            for (let i = selectedArr.length-1; i >= 0; i--) {
                newInventory.splice(selectedArr[i], 1);
            }
            inventory = newInventory;
            
            // Zastosuj sortowanie po nieudanym craftingu
            sortInventory();
            
            selectedIndices.clear();
            renderInventory();
            saveGame();
            addLog(`💔 Craft failed! 95% chance for losing... You lost ${count} dices (number on all of them ${totalEyes}).`, true);
            if (inventory.length === 0) {
                addLog(`⚠️⚠️ You don't have any dices! Roll to continue ⚠️⚠️`, true);
            }
        }
    }
    
    function safeAction(callback) {
        try {
            callback();
        } catch(err) {
            console.error(err);
            addLog(`ERROR: ${err.message}`, true);
            renderInventory();
        }
    }
    
    // ============================================================
    // EVENTY
    // ============================================================
    rollBtn.addEventListener('click', () => safeAction(() => {
        rollDice();
    }));
    
    craftBtn.addEventListener('click', () => safeAction(() => {
        craftDice();
    }));
    
    resetBtn.addEventListener('click', () => safeAction(() => {
        resetGame();
    }));
    
    // ============================================================
    // INICJALIZACJA
    // ============================================================
    loadGame();
    addPanelsToGame();
    
    // Okresowy zapis
    setInterval(() => {
        if (inventory.length) saveGame();
    }, 30000);
    
    function validateInventory() {
        let changed = false;
        for (let i=0; i<inventory.length; i++) {
            let d = inventory[i];
            if (d.eyes < 1 || d.eyes > MAX_DICE_VALUE || isNaN(d.eyes)) {
                d.eyes = Math.min(MAX_DICE_VALUE, Math.max(1, d.eyes || 1));
                changed = true;
            }
            if (typeof d.crafted !== 'boolean') d.crafted = false, changed=true;
        }
        if (changed) {
            sortInventory();
            renderInventory();
            saveGame();
        }
    }
    validateInventory();
    
    window.addEventListener('beforeunload', () => {
        saveGame();
    });
    
    // Konsola
    if (window.console) {
        console.log("CHANCES FOR EVERY DICE");
        PROB_TABLE.forEach((w, i) => {
            console.log(`${i+1}: ${(w / TOTAL_WEIGHT * 100).toFixed(4)}% (1 / ${Math.round(TOTAL_WEIGHT / w).toLocaleString()})`);
        });
        console.log("COOLDOWN: 3 seconds");
    }
})();




















// ============================================================
// 🛠️ MASS DELETE & AUTOCRAFT SYSTEM
// ============================================================

window.DiceManager = {
    // ============================================================
    // 1. DELETE ALL DICES BELOW SELECTED VALUE
    // ============================================================
    removeBelow: function(threshold) {
        if (!confirm(`Are you sure you want to DELETE ALL dices with value BELOW ${threshold}?`)) {
            console.log("❌ Cancelled");
            return false;
        }
        
        const beforeCount = inventory.length;
        const toRemove = inventory.filter(dice => dice.eyes < threshold);
        const newInventory = inventory.filter(dice => dice.eyes >= threshold);
        
        inventory = newInventory;
        selectedIndices.clear();
        sortInventory();
        renderInventory();
        saveGame();
        
        console.log(`%c✅ DELETED ${toRemove.length} dices (below ${threshold})`, "color: lime; font-size: 14px");
        console.log(`📊 Remaining: ${inventory.length} dices`);
        addLog(`🗑️ Deleted ${toRemove.length} dices with value below ${threshold}`);
        return true;
    },
    
    // ============================================================
    // 2. DELETE ALL DICES ABOVE SELECTED VALUE
    // ============================================================
    removeAbove: function(threshold) {
        if (!confirm(`Are you sure you want to DELETE ALL dices with value ABOVE ${threshold}?`)) {
            console.log("❌ Cancelled");
            return false;
        }
        
        const beforeCount = inventory.length;
        const newInventory = inventory.filter(dice => dice.eyes <= threshold);
        const removed = inventory.length - newInventory.length;
        
        inventory = newInventory;
        selectedIndices.clear();
        sortInventory();
        renderInventory();
        saveGame();
        
        console.log(`%c✅ DELETED ${removed} dices (above ${threshold})`, "color: lime; font-size: 14px");
        console.log(`📊 Remaining: ${inventory.length} dices`);
        addLog(`🗑️ Deleted ${removed} dices with value above ${threshold}`);
        return true;
    },
    
    // ============================================================
    // 3. DELETE ALL DICES WITH EXACT VALUE
    // ============================================================
    removeExact: function(eyesValue) {
        if (!confirm(`Are you sure you want to DELETE ALL dices with value ${eyesValue}?`)) {
            console.log("❌ Cancelled");
            return false;
        }
        
        const beforeCount = inventory.length;
        const toRemove = inventory.filter(dice => dice.eyes === eyesValue);
        const newInventory = inventory.filter(dice => dice.eyes !== eyesValue);
        
        inventory = newInventory;
        selectedIndices.clear();
        sortInventory();
        renderInventory();
        saveGame();
        
        console.log(`%c✅ DELETED ${toRemove.length} dices with value ${eyesValue}`, "color: lime; font-size: 14px");
        addLog(`🗑️ Deleted ${toRemove.length} dices with value ${eyesValue}`);
        return true;
    },
    
    // ============================================================
    // 4. AUTOMATIC CRAFT (2, 3 or 4 dices of the same value)
    // ============================================================
    autoCraft: function(eyesValue, numberOfDice, maxCrafts = 999) {
        // numberOfDice: 2, 3 or 4
        if (![2, 3, 4].includes(numberOfDice)) {
            console.error("❌ Number of dices to craft must be 2, 3 or 4");
            return false;
        }
        
        console.log(`%c🔧 STARTING AUTOCRAFT: ${numberOfDice} x dice ${eyesValue}`, "color: cyan; font-size: 14px");
        addLog(`🔧 Autocraft: searching for ${numberOfDice} dices with value ${eyesValue}...`);
        
        let craftsDone = 0;
        let totalEyesSum = 0;
        
        function performCraft() {
            // Find indices of dices to craft
            const indices = [];
            for (let i = 0; i < inventory.length && indices.length < numberOfDice; i++) {
                if (inventory[i].eyes === eyesValue) {
                    indices.push(i);
                }
            }
            
            if (indices.length < numberOfDice || craftsDone >= maxCrafts) {
                console.log(`%c✅ AUTOCRAFT FINISHED! Crafts done: ${craftsDone}`, "color: lime; font-size: 14px");
                addLog(`✅ Autocraft finished! ${craftsDone} crafts done, total eyes sum: ${totalEyesSum}`);
                renderInventory();
                saveGame();
                return;
            }
            
            // Save selected dices
            const selectedDice = indices.map(idx => inventory[idx]);
            const totalEyes = selectedDice.reduce((sum, dice) => sum + dice.eyes, 0);
            const halfSum = Math.floor(totalEyes / 2);
            let newEyes = Math.min(MAX_DICE_VALUE, Math.max(1, halfSum));
            
            // Remove selected dices (from largest index)
            let newInventory = [...inventory];
            for (let i = indices.length - 1; i >= 0; i--) {
                newInventory.splice(indices[i], 1);
            }
            
            // Add new dice (5% success chance)
            const success = Math.random() < 0.05;
            if (success) {
                newInventory.push({ eyes: newEyes, crafted: true });
                craftsDone++;
                totalEyesSum += totalEyes;
                console.log(`✨ Craft ${craftsDone}: ${numberOfDice}x${eyesValue} (${totalEyes}) → ${newEyes} eyes [SUCCESS!]`);
                addLog(`✨ Autocraft #${craftsDone}: ${numberOfDice}x${eyesValue} → ${newEyes} eyes (SUCCESS!)`);
            } else {
                console.log(`❌ Craft ${craftsDone + 1}: ${numberOfDice}x${eyesValue} → FAILED! (lost ${numberOfDice} dices)`);
                addLog(`❌ Autocraft #${craftsDone + 1}: ${numberOfDice}x${eyesValue} → FAILED! (lost ${numberOfDice} dices)`);
                craftsDone++;
                totalEyesSum += 0;
            }
            
            inventory = newInventory;
            sortInventory();
            renderInventory();
            saveGame();
            
            // 1 second cooldown before next craft
            setTimeout(performCraft, 1000);
        }
        
        performCraft();
        return true;
    },
    
    // ============================================================
    // 5. AUTOCRAFT ANY DICES (2-4 pieces, different values)
    // ============================================================
    autoCraftAny: function(numberOfDice, maxCrafts = 999) {
        if (![2, 3, 4].includes(numberOfDice)) {
            console.error("❌ Number of dices to craft must be 2, 3 or 4");
            return false;
        }
        
        console.log(`%c🔧 AUTOCRAFT ANY DICES: ${numberOfDice} pieces each`, "color: cyan; font-size: 14px");
        addLog(`🔧 Auto craft any: looking for sets of ${numberOfDice} dices...`);
        
        let craftsDone = 0;
        let totalEyesSum = 0;
        
        function performCraft() {
            if (inventory.length < numberOfDice || craftsDone >= maxCrafts) {
                console.log(`%c✅ AUTOCRAFT FINISHED! Crafts done: ${craftsDone}`, "color: lime; font-size: 14px");
                addLog(`✅ Auto craft any finished! ${craftsDone} crafts done`);
                renderInventory();
                saveGame();
                return;
            }
            
            // Take first 'numberOfDice' dices
            const indices = [...Array(numberOfDice).keys()];
            const selectedDice = indices.map(idx => inventory[idx]);
            const totalEyes = selectedDice.reduce((sum, dice) => sum + dice.eyes, 0);
            const halfSum = Math.floor(totalEyes / 2);
            let newEyes = Math.min(MAX_DICE_VALUE, Math.max(1, halfSum));
            
            // Remove first 'numberOfDice' dices
            let newInventory = [...inventory];
            for (let i = numberOfDice - 1; i >= 0; i--) {
                newInventory.splice(i, 1);
            }
            
            // 5% success chance
            const success = Math.random() < 0.05;
            if (success) {
                newInventory.push({ eyes: newEyes, crafted: true });
                craftsDone++;
                totalEyesSum += totalEyes;
                console.log(`✨ Craft ${craftsDone}: ${totalEyes} total eyes → ${newEyes} eyes [SUCCESS!]`);
                addLog(`✨ Auto craft #${craftsDone}: sum ${totalEyes} → ${newEyes} eyes (SUCCESS!)`);
            } else {
                console.log(`❌ Craft ${craftsDone + 1}: ${totalEyes} total eyes → FAILED!`);
                addLog(`❌ Auto craft #${craftsDone + 1}: sum ${totalEyes} → FAILED!`);
                craftsDone++;
            }
            
            inventory = newInventory;
            sortInventory();
            renderInventory();
            saveGame();
            
            setTimeout(performCraft, 1000);
        }
        
        performCraft();
        return true;
    },
    
    // ============================================================
    // 6. SHOW DICE STATISTICS
    // ============================================================
    stats: function() {
        const stats = {};
        for (let i = 1; i <= MAX_DICE_VALUE; i++) {
            stats[i] = inventory.filter(d => d.eyes === i).length;
        }
        
        console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: gold");
        console.log("%c📊 DICE STATISTICS", "color: gold; font-size: 16px");
        console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: gold");
        
        for (let i = 1; i <= MAX_DICE_VALUE; i++) {
            if (stats[i] > 0) {
                const crafted = inventory.filter(d => d.eyes === i && d.crafted).length;
                console.log(`🎲 ${i} eyes: ${stats[i]} pieces (${crafted} crafted)`);
            }
        }
        console.log("%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "color: gold");
        console.log(`📦 Total: ${inventory.length} dices`);
        
        return stats;
    }
};

// ============================================================
// SHORTCUT COMMANDS FOR CONSOLE
// ============================================================
window.removeBelow = (x) => DiceManager.removeBelow(x);
window.removeAbove = (x) => DiceManager.removeAbove(x);
window.removeExact = (x) => DiceManager.removeExact(x);
window.autoCraft = (val, num, max) => DiceManager.autoCraft(val, num, max);
window.autoCraftAny = (num, max) => DiceManager.autoCraftAny(num, max);
window.diceStats = () => DiceManager.stats();

/*
console.log("%c🛠️ MASS DELETE & AUTOCRAFT SYSTEM READY!", "color: #ff66ff; font-size: 16px");
console.log("");
console.log("📌 AVAILABLE COMMANDS:");
console.log("   removeBelow(X)     - delete all dices below X");
console.log("   removeAbove(X)     - delete all dices above X");
console.log("   removeExact(X)     - delete all dices with value X");
console.log("   autoCraft(val, num, max)  - craft 'num' dices with value 'val'");
console.log("   autoCraftAny(num, max)    - craft any 'num' dices");
console.log("   diceStats()         - show dice statistics");
console.log("");
console.log("💡 EXAMPLES:");
console.log("   removeBelow(5)           - deletes dices 1-4");
console.log("   autoCraft(3, 4, 10)      - craft 4x3 dices (max 10 times)");
console.log("   autoCraftAny(2, 20)      - craft any 2 dices (max 20 times)");
*/
