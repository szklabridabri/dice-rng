(function() {
    // ============================================================
    // REALISTYCZNE SZANSE – BARDZO RZADKIE WYSOKIE OCZKA
    // ============================================================
    // Szanse oparte na skali 1/1.000.000 (jedna milionowa część)
    // Dla oczka 1: 50% (500,000 / 1,000,000)
    // Dla oczka 2: 25% (250,000 / 1,000,000)
    // Dla oczka 3: 12% (120,000)
    // Dla oczka 4: 6% (60,000)
    // Dla oczka 5: 3% (30,000)
    // Dla oczka 6: 1.5% (15,000)
    // Dla oczka 7: 0.8% (8,000)
    // Dla oczka 8: 0.4% (4,000)
    // Dla oczka 9: 0.25% (2,500)
    // Dla oczka 10: 0.15% (1,500)
    // Dla oczka 11: 0.1% (1,000)
    // Dla oczka 12: 0.07% (700)
    // Dla oczka 13: 0.05% (500)
    // Dla oczka 14: 0.03% (300)
    // Dla oczka 15: 0.02% (200)
    // Dla oczka 16: 0.012% (120)
    // Dla oczka 17: 0.008% (80)
    // Dla oczka 18: 0.005% (50)
    // Dla oczka 19: 0.0025% (25)
    // Dla oczka 20: 0.0007% (7) – praktycznie niemożliwe (1 na ~142,857 losowań)
    // SUMA = 1,000,000 (jedna milionowa)
    
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
        7        // 20 oczek – 0.0007% (1 na ~142,857)
    ];
    
    const MAX_DICE_VALUE = 20;
    const TOTAL_WEIGHT = PROB_TABLE.reduce((a,b) => a + b, 0); // = 1,000,000
    
    // ============================================================
    // COOLDOWN – 3 sekundy na losowanie
    // ============================================================
    let rollCooldown = false;
    let cooldownTimer = null;
    
    // ============================================================
    // Funkcja losująca wartość kości zgodnie z powyższym rozkładem
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
    // GENEROWANIE TABELI SZANS (HTML)
    // ============================================================
    function generateChanceTableHTML() {
        let html = '<div style="background: rgba(0,0,0,0.5); border-radius: 1rem; padding: 0.8rem; margin-top: 0.8rem;">';
        html += '<div style="font-size: 0.85rem; font-weight: bold; margin-bottom: 0.5rem; color: #ffd966;">📊 SZANSE NA WYLOSOWANIE:</div>';
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
    // DODANIE TABELI SZANS DO PANELU INFORMACYJNEGO
    // ============================================================
    function addChanceTableToPanel() {
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
        if (isError) p.style.color = "#ffaa88";
        else p.style.color = "#d4eaff";
        logMessagesDiv.appendChild(p);
        p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        while(logMessagesDiv.children.length > 55) {
            logMessagesDiv.removeChild(logMessagesDiv.firstChild);
        }
    }
    
    // Funkcja aktualizująca przycisk losowania (cooldown UI)
    function updateRollButtonCooldown(remainingSeconds = null) {
        if (rollCooldown) {
            rollBtn.disabled = true;
            if (remainingSeconds !== null && remainingSeconds > 0) {
                rollBtn.textContent = `⏳ LOSUJ KOŚĆ (${remainingSeconds}s) ⏳`;
            } else {
                rollBtn.textContent = `⏳ COOLDOWN... ⏳`;
            }
            rollBtn.style.opacity = '0.6';
            rollBtn.style.cursor = 'not-allowed';
        } else {
            rollBtn.disabled = false;
            rollBtn.textContent = `🎲 LOSUJ KOŚĆ 🎲`;
            rollBtn.style.opacity = '1';
            rollBtn.style.cursor = 'pointer';
        }
    }
    
    // Rozpoczęcie cooldownu na 3 sekundy
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
            emptyMsg.innerText = '💀 Brak kości. Kliknij "LOSUJ KOŚĆ" aby zacząć! 💀';
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
            
            const labelSpan = document.createElement('div');
            labelSpan.className = 'dice-label';
            labelSpan.innerText = `${dice.eyes} oczek`;
            card.appendChild(labelSpan);
            
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
        } catch(e) { console.warn(e); }
    }
    
    function loadGame() {
        const saved = localStorage.getItem('rngDiceGame');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    inventory = parsed.filter(item => typeof item.eyes === 'number' && item.eyes >=1 && item.eyes <= MAX_DICE_VALUE)
                                     .map(item => ({ eyes: item.eyes, crafted: !!item.crafted }));
                    if (inventory.length > 0) addLog(`⚙️ Wczytano zapis stanu gry (${inventory.length} kości).`);
                }
            } catch(e) { addLog("⚠️ Nie udało się wczytać zapisu", true); }
        }
        if (!inventory.length) {
            inventory.push({ eyes: 1, crafted: false });
            addLog("✨ Otrzymujesz początkową kość (1 oczko) na start! Powodzenia!");
        }
        selectedIndices.clear();
        renderInventory();
        saveGame();
    }
    
    function resetGame() {
        if (confirm("Czy na pewno chcesz zresetować całą grę? Wszystkie kości zostaną utracone!")) {
            if (cooldownTimer) clearInterval(cooldownTimer);
            rollCooldown = false;
            updateRollButtonCooldown();
            inventory = [];
            inventory.push({ eyes: 1, crafted: false });
            selectedIndices.clear();
            renderInventory();
            saveGame();
            addLog("🔄 Gra zresetowana! Otrzymujesz 1 kość startową (1 oczko).");
        } else {
            addLog("Reset anulowany.");
        }
    }
    
    // ============================================================
    // LOSOWANIE Z COOLDOWNEM
    // ============================================================
    function rollDice() {
        if (rollCooldown) {
            addLog("⏳ Musisz poczekać 3 sekundy przed kolejnym losowaniem! ⏳", true);
            return;
        }
        
        const newEyes = getRandomDiceValue();
        inventory.push({ eyes: newEyes, crafted: false });
        selectedIndices.clear();
        renderInventory();
        saveGame();
        
        let rarityDesc = "";
        if (newEyes <= 3) rarityDesc = " (pospolita)";
        else if (newEyes <= 7) rarityDesc = " (rzadsza)";
        else if (newEyes <= 12) rarityDesc = " (epicka)";
        else if (newEyes <= 16) rarityDesc = " (legendarna ★★★)";
        else rarityDesc = " (☆ MITYCZNA NIEMOŻLIWA ☆)";
        
        const chancePercent = (PROB_TABLE[newEyes-1] / TOTAL_WEIGHT * 100).toFixed(5);
        const oneIn = Math.round(TOTAL_WEIGHT / PROB_TABLE[newEyes-1]);
        addLog(`🎲 Wylosowano kość z ${newEyes} oczkami!${rarityDesc} (szansa: ${chancePercent}% | 1/${oneIn.toLocaleString()})`);
        
        if (newEyes >= 19) {
            addLog(`🔥🔥 NIEMOŻLIWE! WYLOGOWAŁEŚ KOŚĆ ${newEyes} OCZEK! SZANSA 1/${oneIn.toLocaleString()}! 🔥🔥`, false);
        }
        
        // Uruchom cooldown
        startRollCooldown();
    }
    
    // ============================================================
    // CRAFT
    // ============================================================
    function craftDice() {
        const selectedArr = Array.from(selectedIndices).sort((a,b)=>a-b);
        const count = selectedArr.length;
        if (count < 2 || count > 4) {
            addLog(`❌ Craft wymaga od 2 do 4 zaznaczonych kości! (wybrano ${count})`, true);
            return;
        }
        const selectedDice = selectedArr.map(idx => inventory[idx]);
        if (selectedDice.some(d => !d)) {
            addLog("⚠️ Błąd zaznaczenia, odśwież zaznaczenie", true);
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
            selectedIndices.clear();
            renderInventory();
            saveGame();
            addLog(`✨✨ CRAFT UDANY! ✨✨ Połączono ${count} kości (suma oczek ${totalEyes}) → nowa kość o ${newEyes} oczkach! (połowa sumy). Ta kość posiada znacznik "Crafted".`);
        } else {
            let newInventory = [...inventory];
            for (let i = selectedArr.length-1; i >= 0; i--) {
                newInventory.splice(selectedArr[i], 1);
            }
            inventory = newInventory;
            selectedIndices.clear();
            renderInventory();
            saveGame();
            addLog(`💔 Craft nieudany! 95% szans na stratę... Straciłeś ${count} kości (suma oczek ${totalEyes}).`, true);
            if (inventory.length === 0) {
                addLog(`⚠️⚠️ Nie masz już żadnych kości! Kliknij "LOSUJ KOŚĆ" by kontynuować. ⚠️⚠️`, true);
            }
        }
    }
    
    function safeAction(callback) {
        try {
            callback();
        } catch(err) {
            console.error(err);
            addLog(`Wystąpił błąd: ${err.message}`, true);
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
    addChanceTableToPanel();
    
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
        console.log("=== REALISTYCZNE SZANSE NA KOŚCI ===");
        PROB_TABLE.forEach((w, i) => {
            console.log(`${i+1} oczek: ${(w / TOTAL_WEIGHT * 100).toFixed(4)}% (1 na ${Math.round(TOTAL_WEIGHT / w).toLocaleString()})`);
        });
        console.log("=== COOLDOWN: 3 sekundy między losowaniami ===");
    }
})();