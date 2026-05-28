// ====== COOKING MOD ======

// ---- Clump fall core (shared) ----
// A connected blob of the SAME element falls straight down together as ONE
// clump. On landing, SUPPORTPOWDER gives it a small slump (not a powder spread).
// `onLand` is an optional per-pixel handler called the moment the clump lands.
function clumpFallCore(pixel, onLand) {
    if (pixel._rfTick === pixelTicks) { return; }   // blob already handled this frame
    var elem = pixel.element;

    // Flood-fill the connected same-element blob (8-way "touching")
    var blob = [], seen = {}, stack = [pixel];
    while (stack.length > 0) {
        var p = stack.pop();
        var key = p.x + "," + p.y;
        if (seen[key]) { continue; }
        seen[key] = true;
        blob.push(p);
        var around = [
            [p.x+1,p.y],   [p.x-1,p.y],   [p.x,p.y+1],   [p.x,p.y-1],
            [p.x+1,p.y+1], [p.x-1,p.y+1], [p.x+1,p.y-1], [p.x-1,p.y-1]
        ];
        for (var n = 0; n < around.length; n++) {
            var nx = around[n][0], ny = around[n][1];
            if (seen[nx+","+ny] || isEmpty(nx,ny,true)) { continue; }
            var np = pixelMap[nx][ny];
            if (np && np.element === elem) { stack.push(np); }
        }
    }
    for (var i = 0; i < blob.length; i++) { blob[i]._rfTick = pixelTicks; }

    // Can the WHOLE blob drop straight down one cell?
    var canFall = true;
    for (var i = 0; i < blob.length; i++) {
        var p = blob[i], bx = p.x, by = p.y + 1;
        if (outOfBounds(bx,by)) { canFall = false; break; }
        if (!isEmpty(bx,by) && !seen[bx+","+by]) { canFall = false; break; }
    }

    if (canFall) {
        blob.sort(function(a,b){ return b.y - a.y; });
        for (var i = 0; i < blob.length; i++) {
            var p = blob[i];
            movePixel(p, p.x, p.y + 1);
            p.fallen = (p.fallen || 0) + 1;   // track vertical drop
            p.start = pixelTicks;             // suppress this frame's SUPPORTPOWDER move
        }
    } else if (onLand) {
        for (var i = 0; i < blob.length; i++) { onLand(blob[i]); }
    }
}

// Normal clump fall (no special landing)
function clumpFall(pixel) { clumpFallCore(pixel, null); }

// Egg: if it fell from 33+ pixels up, it cracks into Yolk + Egg_white on impact.
var EGG_CRACK_HEIGHT = 33;
function eggClumpFall(pixel) {
    clumpFallCore(pixel, function(p) {
        if ((p.fallen || 0) >= EGG_CRACK_HEIGHT) {
            changePixel(p, Math.random() < 0.25 ? "Yolk" : "Egg_white"); // ~1/4 yolk
        } else {
            p.fallen = 0;   // soft landing, reset
        }
    });
}

// ====== INGREDIENTS ======

// --- LIQUIDS ---
elements.Cooking_Alcohol = {
    color: "#ffffff", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, density: 789
}
elements.Cooking_Oil = {
    color: "#a59f2c", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, density: 870
}
elements.Vanilla = {
    color: "#704500", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 880
}
elements.Heavy_cream = {
    color: "#ededed", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, density: 1010
}
elements.Milk = {
    color: "#e7e7e7", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, density: 1030
}
elements.Sour_cream = {
    color: "#dae6d6", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, density: 1050
}
elements.Yogurt = {
    color: "#ddd6d6", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, density: 1100
}
elements.Worcestershire_sauce = {
    color: "#3f2b0b", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, density: 1100
}
elements.Soy_sauce = {
    color: "#51300d", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, density: 1200
}
elements.Honey = {
    color: "#dca226", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, viscosity: 10000, density: 1420
}

// --- POWDERS & GRAINS ---
elements.Oats = {
    color: "#969d1f", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 430
}
elements.Cocoa = {
    color: "#654808", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 500
}
elements.Black_pepper = {
    color: "#565656", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 500
}
elements.Garlic_powder = {
    color: "#d6d6d6", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 550
}
elements.Plain_flour = {
    color: "#d4d4d4", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 600
}
elements.Self_raising_flour = {
    color: "#e5e2e2", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 620
}
elements.Rice = {
    color: "#e4e2e2", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 750
}
elements.Sugar = {
    color: "#e4e4e4", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 850
}
elements.Brown_sugar = {
    color: "#8b6a14", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 870
}
elements.Baking_powder = {
    color: "#ffffff", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 900
}
elements.Sea_salt = {
    color: "#ffffff", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 1200
}
elements.Baking_soda = {
    color: "#ffffff", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 2200
}

// --- FRUITS ---
elements.Lemons = {
    color: "#dbe128", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 920
}
elements.Limes = {
    color: "#3baa41", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 920
}
elements.Apples = {
    color: "#d20b0b", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 840
}
elements.Avocado = {
    color: "#21511a", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 950
}
elements.Bananas = {
    color: "#c3db3e", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 950
}
elements.Oranges = {
    color: "#e3830d", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 900
}
elements.Mangoes = {
    color: "#c57026", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1000
}
elements.Watermelon = {
    color: "#1c5b19", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 950
}
elements.Strawberries = {
    color: "#e42727", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 880
}
elements.Cherries = {
    color: "#c60707", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 900
}
elements.Grapes = {
    color: "#69118c", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 970
}
elements.Blueberries = {
    color: "#232593", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 880
}
elements.Blackberries = {
    color: "#290024", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 880
}

// --- VEGETABLES ---
elements.Lettuce = {
    color: "#28bd2f", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 350
}
elements.Cucumbers = {
    color: "#0b4b0c", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 960
}
elements.Tomato = {
    color: "#a61b1b", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 950
}
elements.Bell_peppers = {
    color: "#00640e", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 600
}
elements.Chilli = {
    color: "#a52d2d", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 600
}
elements.Onions = {
    color: "#8a274c", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 900
}
elements.Shallots = {
    color: "#6a5736", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 900
}
elements.Garlic = {
    color: "#dbd3d3", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 900
}
elements.Ginger = {
    color: "#b0935a", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 800
}
elements.Carrots = {
    color: "#e18c14", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 640
}
elements.Potatoes = {
    color: "#9f7530", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1080
}
elements.Broccoli = {
    color: "#1e711f", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 370
}
elements.Cauliflower = {
    color: "#e5dcdc", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 370
}
elements.Brussels_sprouts = {
    color: "#197214", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 500
}
elements.Peas = {
    color: "#205d1b", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 820
}

// --- HERBS ---
elements.Mint = {
    color: "#0b4706", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 300
}
elements.Oregano = {
    color: "#156d24", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 300
}
elements.Rosemary = {
    color: "#1e7434", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 300
}
elements.Thyme = {
    color: "#1f5b17", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 300
}

// --- NUTS ---
elements.Almonds = {
    color: "#987f44", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 720
}
elements.Cashews = {
    color: "#d0c69d", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 750
}
elements.Peanuts = {
    color: "#ae995c", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 700
}
elements.Pistachios = {
    color: "#199c1d", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 750
}

// --- MEAT & POULTRY ---
elements.Chicken = {
    color: "#dfb980", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1050
}
elements.Turkey = {
    color: "#8f634e", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1050
}
elements.Pork = {
    color: "#9b4872", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1050
}
elements.Ham = {
    color: "#e37dd7", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1050
}
elements.Bacon = {
    color: "#641a08", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1000
}
elements.Steak = {
    color: "#a61f2c", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1080
}

// --- SEAFOOD ---
elements.Cod = {
    color: "#dec393", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1050
}
elements.Salmon = {
    color: "#e19288", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1050
}
elements.Shrimp = {
    color: "#f2a89e", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1050
}
elements.Crab = {
    color: "#ff4a4a", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1080
}
elements.Lobster = {
    color: "#c61919", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1080
}
elements.Octopus = {
    color: "#cfa7a7", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1060
}
elements.Scallops = {
    color: "#cbd5cc", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1060
}
elements.Seaweed = {
    color: "#0e4a16", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 900
}

// --- DAIRY & EGG ---
elements.Butter = {
    color: "#d6ec2d", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 910
}
elements.Cheese = {
    color: "#e4f00e", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 1100
}
elements.Egg = {
    color: "#e4d375", category: "cooking",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: eggClumpFall, density: 1030
}
elements.Yolk = {
    color: "#f4b400", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, viscosity: 8000, density: 1035
}
elements.Egg_white = {
    color: "#f3f0e2", category: "cooking",
    state: "liquid", behavior: behaviors.LIQUID, viscosity: 5000, density: 1040
}

// ====== MACHINES ======

// --- Flip switch: a clickable on/off battery. Click any part of it with your
//     mouse (any tool) and the WHOLE connected switch toggles. While ON it
//     powers adjacent pixels like a battery. Green = on, dark red = off.
elements.Flip_switch = {
    name: "flip switch",
    color: "#7f3333", category: "machines", state: "solid",
    behavior: behaviors.WALL,
    tick: function(pixel) {
        if (pixel.switchedOn) {
            for (var i = 0; i < adjacentCoords.length; i++) {
                var x = pixel.x + adjacentCoords[i][0];
                var y = pixel.y + adjacentCoords[i][1];
                if (!isEmpty(x, y, true)) { chargePixel(pixelMap[x][y]); }
            }
        }
    }
}

// --- Lamp: a connected object. Wire it (built-in `wire`) to the switch, or
//     place it next to the switch. Glows while powered; turns off when the
//     switch is off (charge clears on its own once nothing feeds it).
elements.Lamp = {
    name: "lamp",
    color: "#555500", category: "machines", state: "solid",
    behavior: behaviors.WALL,
    conduct: 1, insulate: true,
    tick: function(pixel) {
        if (pixel.charge) { pixel.color = "#ffff66"; }   // ON
        else              { pixel.color = "#555500"; }   // OFF
    }
}

// --- Mouse hook: clicking any Flip_switch pixel toggles the whole connected
//     switch, regardless of selected tool, and blocks the click from drawing.
if (!window._flipSwitchClickHook) {
    window._flipSwitchClickHook = true;
    document.addEventListener("mousedown", function(e) {
        if (e.button !== 0) { return; }
        var cv = document.getElementById("game");
        if (!cv) { return; }
        var rect = cv.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX >= rect.right ||
            e.clientY < rect.top  || e.clientY >= rect.bottom) { return; }
        var gx = Math.floor(((e.clientX - rect.left) / cv.clientWidth)  * (width  + 1));
        var gy = Math.floor(((e.clientY - rect.top)  / cv.clientHeight) * (height + 1));
        if (gx < 0 || gy < 0 || gx > width || gy > height) { return; }
        if (isEmpty(gx, gy, true)) { return; }

        var clicked = pixelMap[gx][gy];
        if (!clicked || clicked.element !== "Flip_switch") { return; }

        var newState = !clicked.switchedOn;
        var newColor = newState ? "#33cc33" : "#7f3333";
        var seen = {}, stack = [clicked];
        while (stack.length > 0) {
            var c = stack.pop();
            var key = c.x + "," + c.y;
            if (seen[key]) { continue; }
            seen[key] = true;
            c.switchedOn = newState;
            c.color = newColor;
            var around = [
                [c.x+1,c.y],   [c.x-1,c.y],   [c.x,c.y+1],   [c.x,c.y-1],
                [c.x+1,c.y+1], [c.x-1,c.y+1], [c.x+1,c.y-1], [c.x-1,c.y-1]
            ];
            for (var n = 0; n < around.length; n++) {
                var nx = around[n][0], ny = around[n][1];
                if (seen[nx+","+ny] || isEmpty(nx,ny,true)) { continue; }
                var np = pixelMap[nx][ny];
                if (np && np.element === "Flip_switch") { stack.push(np); }
            }
        }
        e.stopPropagation();
        e.preventDefault();
    }, true);
}
