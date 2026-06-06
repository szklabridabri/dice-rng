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
// 🌐 SYSTEM ZARZĄDZANIA GRACZAMI – REAGUJE NA WSZYSTKIE EVENTY
// ============================================================

(function() {
    console.log("%c👑 SYSTEM ZARZĄDZANIA AKTYWNY!", "color: lime; font-size: 16px");
    console.log("📢 Oczekiwanie na komendy admina...");

    // ============================================================
    // 1. AUTOMATYCZNE ODBIERANIE PREZENTÓW OD ADMINA
    // ============================================================
    function checkGlobalGift() {
        const gift = localStorage.getItem("global_dice_gift");
        if (gift) {
            try {
                const data = JSON.parse(gift);
                if (!data.claimed) {
                    console.log(`%c🎁 PREZENT OD ${data.from}!`, "color: gold; font-size: 14px");
                    console.log(`📢 ${data.message}`);
                    console.log(`🎲 Otrzymujesz kość ${data.eyes} oczek!`);
                    
                    if (confirm(`Czy chcesz odebrać kość ${data.eyes} oczek?\n${data.message}`)) {
                        if (typeof DiceAPI !== 'undefined' && DiceAPI.add) {
                            DiceAPI.add(data.eyes, data.crafted);
                        } else if (typeof window.rollDice === 'function') {
                            // Fallback – dodaj bezpośrednio do inventory
                            window.inventory.push({ eyes: data.eyes, crafted: data.crafted });
                            if (typeof window.sortInventory === 'function') window.sortInventory();
                            if (typeof window.renderInventory === 'function') window.renderInventory();
                            if (typeof window.saveGame === 'function') window.saveGame();
                        }
                        data.claimed = true;
                        localStorage.setItem("global_dice_gift", JSON.stringify(data));
                        console.log("%c✅ Odebrano prezent!", "color: lime");
                    }
                }
            } catch(e) { console.warn("Błąd odczytu prezentu:", e); }
        }
    }

    // ============================================================
    // 2. ODBIERANIE BROADCASTU (prezenty na żywo)
    // ============================================================
    window.addEventListener('storage', (e) => {
        // === PREZENTY GLOBALNE ===
        if (e.key === 'dice_broadcast' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data.type === "GLOBAL_DICE") {
                    console.log(`%c🎉 PREZENT OD ${data.from}!`, "color: gold; font-size: 16px");
                    console.log(`🎲 Kość ${data.eyes} oczek została dodana!`);
                    
                    if (typeof DiceAPI !== 'undefined' && DiceAPI.add) {
                        DiceAPI.add(data.eyes, data.crafted);
                    } else if (typeof window.inventory !== 'undefined') {
                        window.inventory.push({ eyes: data.eyes, crafted: data.crafted });
                        if (typeof window.sortInventory === 'function') window.sortInventory();
                        if (typeof window.renderInventory === 'function') window.renderInventory();
                        if (typeof window.saveGame === 'function') window.saveGame();
                    }
                }
            } catch(e) { console.warn("Błąd broadcastu:", e); }
        }
        
        // === KOMENDY ADMINA ===
        if (e.key === 'admin_broadcast' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                
                if (data.type === "CHAT") {
                    console.log(`%c💬 [${data.from} ${data.time}]: ${data.message}`, "color: #ffaa88");
                    // Dodaj powiadomienie wizualne
                    showNotification(`📢 ${data.message}`, "#ffaa88");
                }
                
                if (data.type === "GIFT") {
                    console.log(`%c🎁 PREZENT! ${data.reason}`, "color: gold; font-size: 14px");
                    console.log(`🎲 Otrzymujesz kość ${data.eyes} oczek (Craft: ${data.crafted ? "TAK" : "NIE"})`);
                    showNotification(`🎁 Prezent! ${data.reason}\nKość: ${data.eyes} oczek`, "gold");
                    
                    if (confirm(`Otrzymujesz prezent od ${data.from}!\n${data.reason}\n\nKość: ${data.eyes} oczek\nCzy chcesz odebrać?`)) {
                        if (typeof DiceAPI !== 'undefined' && DiceAPI.add) {
                            DiceAPI.add(data.eyes, data.crafted);
                        } else if (typeof window.inventory !== 'undefined') {
                            window.inventory.push({ eyes: data.eyes, crafted: data.crafted });
                            if (typeof window.sortInventory === 'function') window.sortInventory();
                            if (typeof window.renderInventory === 'function') window.renderInventory();
                            if (typeof window.saveGame === 'function') window.saveGame();
                        }
                        console.log("%c✅ Odebrano!", "color: lime");
                    }
                }
            } catch(e) { console.warn("Błąd admin broadcast:", e); }
        }
        
        // === EVENTY ADMINA ===
        if (e.key === 'admin_event' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                console.log(`%c⚡ EVENT: ${data.type}`, "color: magenta; font-size: 14px");
                showNotification(`⚡ EVENT: ${data.type} ⚡`, "magenta");
                
                // Dodatkowe reakcje na eventy
                if (data.type === "BOSS_SPAWN") {
                    console.log("👾 Boss pojawił się! Szanse na lepsze kości zwiększone!");
                }
            } catch(e) { console.warn("Błąd eventu:", e); }
        }
        
        // === ODŚWIEŻENIE STRONY ===
        if (e.key === 'global_refresh' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data.command === "REFRESH") {
                    console.log(`%c🔄 ADMIN wysłał polecenie odświeżenia!`, "color: orange; font-size: 14px");
                    console.log(`📢 Powód: ${data.reason || "Brak"}`);
                    showNotification(`🔄 Odświeżanie za 3 sekundy!\nPowód: ${data.reason || "Aktualizacja"}`, "orange");
                    
                    let countdown = 3;
                    const interval = setInterval(() => {
                        console.log(`⏳ Odświeżanie za ${countdown}...`);
                        countdown--;
                        if (countdown < 0) {
                            clearInterval(interval);
                            location.reload();
                        }
                    }, 1000);
                }
            } catch(e) { console.warn("Błąd refresh:", e); }
        }
        
        // === MIĘKKIE ODŚWIEŻENIE ===
        if (e.key === 'soft_refresh' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data.command === "SOFT_REFRESH") {
                    console.log("%c🔄 Miękkie odświeżanie – zapisuję stan gry...", "color: cyan");
                    showNotification("🔄 Miękkie odświeżanie za chwilę...", "cyan");
                    
                    if (typeof DiceAPI !== 'undefined' && DiceAPI.save) {
                        DiceAPI.save();
                    }
                    
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            } catch(e) { console.warn("Błąd soft refresh:", e); }
        }
        
        // === PLANOWANE ODŚWIEŻENIE ===
        if (e.key === 'scheduled_refresh' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data.command === "SCHEDULED_REFRESH") {
                    const timeLeft = data.time - Date.now();
                    if (timeLeft > 0 && timeLeft < 60000) { // mniej niż minuta
                        console.log(`%c⏰ PLANOWANE ODŚWIEŻENIE ZA ${Math.ceil(timeLeft/1000)}s!`, "color: orange");
                        showNotification(`⏰ Planowane odświeżenie za ${Math.ceil(timeLeft/1000)}s\n${data.reason}`, "orange");
                        
                        setTimeout(() => {
                            if (typeof DiceAPI !== 'undefined' && DiceAPI.save) DiceAPI.save();
                            setTimeout(() => location.reload(), 1000);
                        }, timeLeft);
                    }
                }
            } catch(e) { console.warn("Błąd scheduled:", e); }
        }
        
        // === WIADOMOŚĆ PRZED ODŚWIEŻENIEM ===
        if (e.key === 'refresh_announcement' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data.command === "REFRESH_WITH_MESSAGE") {
                    showNotification(`📢 ${data.message}\n⏰ Odświeżenie za ${data.delay}s`, "#ff6b6b");
                    
                    let remaining = data.delay;
                    const interval = setInterval(() => {
                        remaining--;
                        if (remaining <= 0) clearInterval(interval);
                    }, 1000);
                }
            } catch(e) { console.warn("Błąd announcement:", e); }
        }
        
        // === AUTO-ODŚWIEŻANIE ===
        if (e.key === 'auto_refresh_config' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data.active) {
                    console.log(`%c🔄 Auto-odświeżanie aktywne (co ${data.intervalMinutes} minut)`, "color: cyan");
                    showNotification(`🔄 Auto-odświeżanie co ${data.intervalMinutes} minut`, "cyan");
                }
            } catch(e) { console.warn("Błąd auto-refresh:", e); }
        }
    });
    
    // ============================================================
    // 3. FUNKCJA POKAZUJĄCA POWIADOMIENIA WIZUALNE
    // ============================================================
    function showNotification(message, color = "gold") {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: ${color};
            padding: 12px 20px;
            border-radius: 12px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            border-left: 4px solid ${color};
            animation: slideInRight 0.3s ease;
            font-size: 14px;
            max-width: 300px;
            white-space: pre-line;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = "slideOutRight 0.3s ease";
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // ============================================================
    // 4. DODANIE ANIMACJI CSS DLA POWIADOMIEŃ
    // ============================================================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ============================================================
    // 5. SPRAWDZANIE PREZENTÓW CO 5 SEKUND
    // ============================================================
    setInterval(checkGlobalGift, 5000);
    checkGlobalGift();
    
    // ============================================================
    // 6. SPRAWDZANIE PLANOWANEGO ODŚWIEŻENIA
    // ============================================================
    function checkScheduledRefresh() {
        const scheduled = localStorage.getItem("scheduled_refresh");
        if (scheduled) {
            try {
                const data = JSON.parse(scheduled);
                if (data.time && Date.now() >= data.time) {
                    console.log(`%c⏰ PLANOWANE ODŚWIEŻENIE!`, "color: orange; font-size: 14px");
                    console.log(`📢 ${data.reason}`);
                    showNotification(`⏰ Planowane odświeżenie!\n${data.reason}`, "orange");
                    
                    let count = 5;
                    const interval = setInterval(() => {
                        count--;
                        if (count < 0) {
                            clearInterval(interval);
                            localStorage.removeItem("scheduled_refresh");
                            location.reload();
                        }
                    }, 1000);
                }
            } catch(e) { console.warn("Błąd scheduled check:", e); }
        }
    }
    
    setInterval(checkScheduledRefresh, 30000);
    checkScheduledRefresh();
    
    // ============================================================
    // 7. NASŁUCHIWANIE NA AUTO-ODŚWIEŻANIE
    // ============================================================
    function setupAutoRefresh() {
        const config = localStorage.getItem("auto_refresh_config");
        if (config) {
            try {
                const data = JSON.parse(config);
                if (data.active && data.intervalMinutes) {
                    console.log(`%c🔄 Auto-odświeżanie: co ${data.intervalMinutes} minut`, "color: cyan");
                    
                    if (window.autoRefreshInterval) clearInterval(window.autoRefreshInterval);
                    window.autoRefreshInterval = setInterval(() => {
                        console.log(`%c⏰ Auto-odświeżanie za chwilę...`, "color: orange");
                        showNotification(`🔄 Auto-odświeżanie za 3 sekundy`, "orange");
                        setTimeout(() => location.reload(), 3000);
                    }, data.intervalMinutes * 60 * 1000);
                }
            } catch(e) { console.warn("Błąd auto-refresh setup:", e); }
        }
    }
    
    setupAutoRefresh();
    window.addEventListener('storage', (e) => {
        if (e.key === 'auto_refresh_config') setupAutoRefresh();
    });
    
    // ============================================================
    // 8. API DLA ADMINA (do konsoli)
    // ============================================================
    window.DicePlayer = {
        // Odbiór kodu promocyjnego
        redeemCode: function(code) {
            try {
                const data = JSON.parse(atob(code));
                if (data.expires > Date.now()) {
                    if (typeof DiceAPI !== 'undefined' && DiceAPI.add) {
                        DiceAPI.add(data.eyes, data.crafted);
                    } else if (typeof window.inventory !== 'undefined') {
                        window.inventory.push({ eyes: data.eyes, crafted: data.crafted });
                        if (typeof window.sortInventory === 'function') window.sortInventory();
                        if (typeof window.renderInventory === 'function') window.renderInventory();
                        if (typeof window.saveGame === 'function') window.saveGame();
                    }
                    console.log(`%c🎁 OTRZYMAŁEŚ KOŚĆ ${data.eyes} OCZEK!`, "color: gold; font-size: 14px");
                } else {
                    console.log("❌ Kod wygasł!");
                }
            } catch(e) {
                console.log("❌ Nieprawidłowy kod!");
            }
        },
        
        // Sprawdź status połączenia z adminem
        status: function() {
            console.log("📊 STATUS POŁĄCZENIA:");
            console.log("  - Nasłuchiwanie eventów: AKTYWNE");
            console.log("  - Prezenty: " + (localStorage.getItem("global_dice_gift") ? "OCZEKUJĄ" : "BRAK"));
            console.log("  - Auto-odświeżanie: " + (localStorage.getItem("auto_refresh_config") ? "AKTYWNE" : "WYŁĄCZONE"));
        }
    };
    
    console.log("%c✅ SYSTEM GOTOWY! Oczekuję na komendy admina...", "color: lime; font-size: 14px");
    console.log("📌 Jeśli admin wyśle prezent – pojawi się automatycznie!");
    console.log("📌 Możesz też użyć: DicePlayer.redeedCode('kod')");
    
})();
