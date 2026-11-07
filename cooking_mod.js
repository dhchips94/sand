// ====== COOKING MOD ======

// ---- Clump fall core (shared) ----
// A connected blob of the SAME element acts as one RIGID body: it falls straight
// down together ONLY if every part of it is unsupported. If any part rests on
// something, the whole blob stays put -- overhangs included, since they're
// attached to the grounded part. The core itself never breaks apart -- any
// crumbling/cracking is decided by the `onLand` callback below.
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
            p.fallen = (p.fallen || 0) + 1;   // track vertical drop (for egg cracking)
        }
    } else if (onLand) {
        for (var i = 0; i < blob.length; i++) { onLand(blob[i]); }
    }
}

// Clump fall: a connected blob falls as one RIGID clump while airborne. The
// instant ANY part of the clump touches something beneath it, each pixel
// becomes independent -- the touching ones stay (something is under them),
// and the others keep falling straight down on their own. So it "drapes" over
// uneven ground instead of staying rigid in midair.
function clumpFall(pixel) {
    if (pixel._landed) {
        // independent, post-contact: just fall straight down if there's room
        tryMove(pixel, pixel.x, pixel.y + 1);
        return;
    }
    clumpFallCore(pixel, function(p) {
        p._landed = true;   // first contact -> every blob pixel becomes independent
    });
}

// Machine cook timer: flood-fill the connected blob touching a machine, tick up
// EVERY pixel's cook timer (so hovering ANY of them shows the countdown, not just
// the touching ones), and when the timer's up, turn the whole clump into `into`.
function clumpCookTick(start, into, ticksNeeded) {
    var elem = start.element, seen = {}, stack = [start], blob = [];
    while (stack.length > 0) {
        var p = stack.pop(), key = p.x + "," + p.y;
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
    var ready = false;
    for (var i = 0; i < blob.length; i++) {
        blob[i]._cookTick = pixelTicks;                       // whole clump handled this frame
        blob[i].cookTimer = (blob[i].cookTimer || 0) + 1;
        blob[i].cookTotal = ticksNeeded;                      // remembered so a hover can show the countdown
        if (blob[i].cookTimer >= ticksNeeded) { ready = true; }
    }
    if (ready) {
        for (var i = 0; i < blob.length; i++) { changePixel(blob[i], into); }
    }
}
// Hover text showing a cooking countdown (used by foods that cook in a machine).
function cookHoverStat(pixel) {
    if (!pixel.cookTimer || !pixel.cookTotal) { return ""; }
    var left = Math.ceil((pixel.cookTotal - pixel.cookTimer) / tps);
    return "Cooking: " + (left > 0 ? left : 0) + "s";
}

// Egg: if it fell from EGG_CRACK_HEIGHT+ pixels up, it cracks into Yolk + Egg_white.
var EGG_CRACK_HEIGHT = 11;
var TOAST_SECONDS = 10;    // seconds of toaster contact: Bread -> Toast
var OVEN_SECONDS = 7.5;    // seconds of oven contact: Uncooked garlic bread -> Garlic bread
var BISCUIT_SECONDS = 5;   // seconds of oven contact: Biscuit dough -> Biscuits
function eggClumpFall(pixel) {
    clumpFallCore(pixel, function(p) {
        if ((p.fallen || 0) >= EGG_CRACK_HEIGHT) {
            changePixel(p, Math.random() < 0.25 ? "Yolk" : "Egg_white"); // ~1/4 yolk
        } else {
            p.fallen = 0;   // soft landing, reset
        }
    });
}

// ====== INGREDIENTS (base "cooking" category) ======

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
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 880
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
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 500
}
elements.Black_pepper = {
    color: "#565656", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 500
}
elements.Garlic_powder = {
    color: "#d6d6d6", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 550
}
// flour + water -> Dough  (start of the bread recipe)
elements.Plain_flour = {
    color: "#d4d4d4", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 600,
    reactions: {
        "water": { elem1: "Dough", elem2: null, chance: 0.1 },
        "Butter": { elem1: "Biscuit_dough", elem2: null, chance: 0.05 }   // flour + butter -> biscuit dough
    }
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
elements.Yeast = {
    color: "#e8d8a0", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 500
}

// --- FRUITS ---
elements.Lemons = {
    color: "#dbe128", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 920
}
elements.Limes = {
    color: "#3baa41", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 920
}
elements.Apples = {
    color: "#d20b0b", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 840
}
elements.Avocado = {
    color: "#21511a", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 950
}
elements.Bananas = {
    color: "#c3db3e", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 950
}
elements.Oranges = {
    color: "#e3830d", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 900
}
elements.Mangoes = {
    color: "#c57026", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1000
}
elements.Watermelon = {
    color: "#1c5b19", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 950
}
elements.Strawberries = {
    color: "#e42727", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 880
}
elements.Cherries = {
    color: "#c60707", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 900
}
elements.Grapes = {
    color: "#69118c", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 970
}
elements.Blueberries = {
    color: "#232593", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 880
}
elements.Blackberries = {
    color: "#290024", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 880
}

// --- VEGETABLES ---
elements.Lettuce = {
    color: "#28bd2f", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 350
}
elements.Cucumbers = {
    color: "#0b4b0c", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 960
}
elements.Tomato = {
    color: "#a61b1b", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 950
}
elements.Bell_peppers = {
    color: "#00640e", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 600
}
elements.Chilli = {
    color: "#a52d2d", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 600
}
elements.Onions = {
    color: "#8a274c", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 900
}
elements.Shallots = {
    color: "#6a5736", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 900
}
elements.Garlic = {
    color: "#dbd3d3", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 900
}
elements.Ginger = {
    color: "#b0935a", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 800
}
elements.Carrots = {
    color: "#e18c14", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 640
}
elements.Potatoes = {
    color: "#9f7530", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1080
}
elements.Broccoli = {
    color: "#1e711f", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 370
}
elements.Cauliflower = {
    color: "#e5dcdc", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 370
}
elements.Brussels_sprouts = {
    color: "#197214", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 500
}
elements.Peas = {
    color: "#205d1b", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 820
}

// --- HERBS ---
elements.Mint = {
    color: "#0b4706", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 300
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
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1050
}
elements.Turkey = {
    color: "#8f634e", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1050
}
elements.Pork = {
    color: "#9b4872", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1050
}
elements.Ham = {
    color: "#e37dd7", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1050
}
elements.Bacon = {
    color: "#641a08", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1000
}
elements.Steak = {
    color: "#a61f2c", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1080
}

// --- SEAFOOD ---
elements.Cod = {
    color: "#dec393", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1050
}
elements.Salmon = {
    color: "#e19288", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1050
}
elements.Shrimp = {
    color: "#f2a89e", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1050
}
elements.Crab = {
    color: "#ff4a4a", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1080
}
elements.Lobster = {
    color: "#c61919", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1080
}
elements.Octopus = {
    color: "#cfa7a7", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1060
}
elements.Scallops = {
    color: "#cbd5cc", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1060
}
elements.Seaweed = {
    color: "#0e4a16", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 900
}

// --- DAIRY & EGG ---
elements.Butter = {
    color: "#d6ec2d", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 910,
    reactions: {
        "Garlic": { elem1: "Garlic_butter", elem2: null, chance: 0.05 }   // butter + garlic -> garlic butter
    }
}
elements.Cheese = {
    color: "#e4f00e", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 1100
}
elements.Egg = {
    color: "#e4d375", category: "cooking",
    state: "solid", behavior: behaviors.WALL, tick: eggClumpFall, density: 1030
}

// ====== PREPARED ITEMS (made from base ingredients) ======
// These live in the "prepared" category, separate from the raw ingredients.

elements.Yolk = {
    color: "#f4b400", category: "prepared",
    state: "liquid", behavior: behaviors.LIQUID, viscosity: 8000, density: 1035
}
elements.Egg_white = {
    color: "#f3f0e2", category: "prepared",
    state: "liquid", behavior: behaviors.LIQUID, viscosity: 5000, density: 1040
}

// --- BREAD RECIPE chain ---
// flour + water        -> Dough
// Dough + yeast        -> Yeasty_dough
// Yeasty_dough + sugar -> Bread
elements.Dough = {
    color: "#e8dcc0", category: "prepared",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 700,
    reactions: {
        "Yeast": { elem1: "Yeasty_dough", elem2: null, chance: 0.05 },
        "Plain_flour": { elem2: "Dough", chance: 0.05 },   // soak up leftover flour
        "water": { elem2: null, chance: 0.05 }             // soak up leftover water
    }
}
elements.Yeasty_dough = {
    color: "#e0d2a8", category: "prepared",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 700,
    reactions: {
        "Sugar": { elem1: "Bread", elem2: null, chance: 0.05 },
        "Yeast": { elem2: "Yeasty_dough", chance: 0.05 },   // soak up leftover yeast
        "Dough": { elem2: "Yeasty_dough", chance: 0.05 }    // soak up leftover dough
    }
}
elements.Bread = {
    color: "#c89b5a", category: "prepared",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 400,
    reactions: {
        "Sugar": { elem2: "Bread", chance: 0.05 },          // soak up leftover sugar
        "Yeasty_dough": { elem2: "Bread", chance: 0.05 },   // soak up leftover yeasty dough
        "Garlic_butter": { elem1: "Uncooked_garlic_bread", elem2: null, chance: 0.05 }   // spread garlic butter on bread
    },
    hoverStat: cookHoverStat   // shows the toaster countdown next to Temp
}
// --- Garlic bread chain ---
// Butter + Garlic                 -> Garlic_butter
// Garlic_butter + Bread           -> Uncooked_garlic_bread
// Uncooked_garlic_bread + Oven    -> Garlic_bread (after OVEN_SECONDS)
elements.Garlic_butter = {
    color: "#d8d24a", category: "prepared",
    state: "liquid", behavior: behaviors.LIQUID, viscosity: 6000, density: 900,
    reactions: {
        "Butter": { elem2: "Garlic_butter", chance: 0.05 },   // soak up leftover butter
        "Garlic": { elem2: "Garlic_butter", chance: 0.05 }    // soak up leftover garlic
    }
}
elements.Uncooked_garlic_bread = {
    name: "uncooked garlic bread",
    color: "#dcc89a", category: "prepared",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 410,
    reactions: {
        "Bread": { elem2: "Uncooked_garlic_bread", chance: 0.05 },   // soak up leftover bread
        "Garlic_butter": { elem2: null, chance: 0.05 }               // soak up leftover garlic butter
    },
    hoverStat: cookHoverStat   // shows the oven countdown next to Temp
}
elements.Garlic_bread = {
    color: "#d8b06a", category: "prepared",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 420
}

// --- Biscuit chain ---
// Plain_flour + Butter        -> Biscuit_dough
// Biscuit_dough + Oven        -> Biscuits (after BISCUIT_SECONDS)
elements.Biscuit_dough = {
    color: "#e8d8b0", category: "prepared",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 700,
    reactions: {
        "Plain_flour": { elem2: "Biscuit_dough", chance: 0.05 },   // soak up leftover flour
        "Butter": { elem2: "Biscuit_dough", chance: 0.05 }         // soak up leftover butter
    },
    hoverStat: cookHoverStat   // shows the oven countdown next to Temp
}
elements.Biscuits = {
    color: "#d4a86a", category: "prepared",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 420
}

// --- Grated items (made with the Grate tool) ---
elements.Breadcrumbs = {
    color: "#c79a5b", category: "prepared",
    state: "solid", behavior: behaviors.POWDER, density: 350
}
elements.Grated_cheese = {
    color: "#f1d23a", category: "prepared",
    state: "solid", behavior: behaviors.POWDER, density: 380
}
elements.Orange_zest = {
    color: "#e08a1e", category: "prepared",
    state: "solid", behavior: behaviors.POWDER, density: 300
}
elements.Lemon_zest = {
    color: "#e3d24a", category: "prepared",
    state: "solid", behavior: behaviors.POWDER, density: 300
}
elements.Lime_zest = {
    color: "#8fc23a", category: "prepared",
    state: "solid", behavior: behaviors.POWDER, density: 300
}

// --- Toasted (made in the Toaster) ---
elements.Toast = {
    color: "#b06a2c", category: "prepared",
    state: "solid", behavior: behaviors.WALL, tick: clumpFall, density: 400
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

// --- Toaster: only works while POWERED (wire it to a flip switch). So far:
//     Bread -> Toast. While powered it glows orange; bread touching it builds
//     up a timer and turns to Toast after TOAST_SECONDS. Hover bread for the
//     countdown. To toast more foods later, add their element to the `if` below.
elements.Toaster = {
    name: "toaster",
    color: "#9a9a9a", category: "machines", state: "solid",
    behavior: behaviors.WALL,
    noMix: true,        // can't be shuffled by the mix tool
    movable: false,     // can't be dragged -- stays put like a wall
    conduct: 1,         // picks up charge from a wire / flip switch
    insulate: true,
    tick: function(pixel) {
        pixel.color = pixel.charge ? "#d6552a" : "#9a9a9a";   // glows orange when powered
        if (!pixel.charge) { return; }                        // off -> doesn't toast
        for (var i = 0; i < adjacentCoords.length; i++) {
            var x = pixel.x + adjacentCoords[i][0];
            var y = pixel.y + adjacentCoords[i][1];
            if (isEmpty(x, y, true)) { continue; }
            var np = pixelMap[x][y];
            // touching Bread -> tick the WHOLE connected clump (once per frame)
            if (np && np.element === "Bread" && np._cookTick !== pixelTicks) {
                clumpCookTick(np, "Toast", TOAST_SECONDS * tps);
            }
        }
    }
}

// --- Oven: bakes anything in its recipe table. ALWAYS ON -- no wiring needed;
//     just set bakeable food against it. The whole clump bakes; hover for the
//     countdown. To add a new bakeable food, drop one entry in `ovenRecipes`.
var ovenRecipes = {
    "Uncooked_garlic_bread": { into: "Garlic_bread", seconds: OVEN_SECONDS },
    "Biscuit_dough":         { into: "Biscuits",     seconds: BISCUIT_SECONDS }
};
elements.Oven = {
    name: "oven",
    color: "#7a3b1e", category: "machines", state: "solid",
    behavior: behaviors.WALL,
    noMix: true,        // can't be shuffled by the mix tool
    movable: false,     // can't be dragged -- stays put like a wall
    tick: function(pixel) {
        for (var i = 0; i < adjacentCoords.length; i++) {
            var x = pixel.x + adjacentCoords[i][0];
            var y = pixel.y + adjacentCoords[i][1];
            if (isEmpty(x, y, true)) { continue; }
            var np = pixelMap[x][y];
            if (!np || np._cookTick === pixelTicks) { continue; }
            var r = ovenRecipes[np.element];
            if (r) { clumpCookTick(np, r.into, r.seconds * tps); }
        }
    }
}

// ====== TOOLS ======

// --- Grate tool: drag over Bread -> Breadcrumbs, or Cheese -> Grated cheese.
//     Works like the built-in heat/cool tools (select it, then paint over food).
elements.grate = {
    name: "grate",
    color: "#cfcfcf", category: "tools",
    canPlace: false,
    tool: function(pixel) {
        if (pixel.element === "Bread")       { changePixel(pixel, "Breadcrumbs"); }
        else if (pixel.element === "Cheese") { changePixel(pixel, "Grated_cheese"); }
        else if (pixel.element === "Oranges") { changePixel(pixel, "Orange_zest"); }
        else if (pixel.element === "Lemons")  { changePixel(pixel, "Lemon_zest"); }
        else if (pixel.element === "Limes")   { changePixel(pixel, "Lime_zest"); }
    },
    desc: "Grate Bread -> breadcrumbs, Cheese -> grated cheese, citrus -> zest."
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

// ====== RECIPE BOOK ======
// Adds a "Recipes" button to the bottom control row (next to Reset/Saves/Elem).
// It opens a browser of every food item: how to make it, and what it makes.
// Click any item to jump to its recipe, and so on.

// Recipe data: result element -> { from:[ingredients], note: optional method }
var cookingRecipes = {
    "Dough":        { from: ["Plain_flour", "water"] },
    "Yeasty_dough": { from: ["Dough", "Yeast"] },
    "Bread":        { from: ["Yeasty_dough", "Sugar"] },
    "Yolk":          { from: ["Egg"], note: "Crack an Egg by dropping it " + EGG_CRACK_HEIGHT + "+ pixels." },
    "Egg_white":     { from: ["Egg"], note: "Crack an Egg by dropping it " + EGG_CRACK_HEIGHT + "+ pixels." },
    "Breadcrumbs":   { from: ["Bread"],  note: "Use the Grate tool on Bread." },
    "Grated_cheese": { from: ["Cheese"], note: "Use the Grate tool on Cheese." },
    "Orange_zest":   { from: ["Oranges"], note: "Grate Oranges with the Grate tool." },
    "Lemon_zest":    { from: ["Lemons"],  note: "Grate Lemons with the Grate tool." },
    "Lime_zest":     { from: ["Limes"],   note: "Grate Limes with the Grate tool." },
    "Toast":         { from: ["Bread"],   note: "Put Bread against a Toaster." },
    "Garlic_butter":         { from: ["Butter", "Garlic"], note: "Press Garlic against Butter." },
    "Uncooked_garlic_bread": { from: ["Garlic_butter", "Bread"], note: "Spread Garlic butter onto Bread." },
    "Garlic_bread":          { from: ["Uncooked_garlic_bread"], note: "Bake Uncooked garlic bread in an Oven (" + OVEN_SECONDS + "s)." },
    "Biscuit_dough":         { from: ["Plain_flour", "Butter"], note: "Press Butter into Flour." },
    "Biscuits":              { from: ["Biscuit_dough"], note: "Bake Biscuit dough in an Oven (" + BISCUIT_SECONDS + "s)." }
};

function recipeName(e) {
    if (elements[e] && elements[e].name) { return elements[e].name; }
    return e.replace(/_/g, " ");
}
function recipeColor(e) {
    var c = elements[e] && elements[e].color;
    if (Array.isArray(c)) { c = c[0]; }
    return c || "#888";
}
function recipeUses(e) {   // recipes that use `e` as an ingredient
    var out = [];
    for (var result in cookingRecipes) {
        if (cookingRecipes[result].from.indexOf(e) !== -1) { out.push(result); }
    }
    return out;
}
function recipeFoodList() {   // every food item (cooking + prepared)
    var list = [];
    for (var e in elements) {
        var c = elements[e].category;
        if (c === "cooking" || c === "prepared") { list.push(e); }
    }
    list.sort(function(a, b) { return recipeName(a).localeCompare(recipeName(b)); });
    return list;
}
function recipeChip(e) {      // a clickable element pill with a color swatch
    var badge = cookingRecipes[e] ? '<span class="recipeBadge">recipe</span>' : '';
    return '<button class="recipeChip" data-relem="' + e + '">' +
        '<span class="recipeSwatch" style="background:' + recipeColor(e) + '"></span>' +
        recipeName(e) + badge + '</button>';
}

function ensureRecipeStyle() {
    if (document.getElementById("recipeBookStyle")) { return; }
    var s = document.createElement("style");
    s.id = "recipeBookStyle";
    s.textContent =
        "#recipeBookPanel .recipeChip{display:inline-flex;align-items:center;gap:6px;margin:3px;" +
            "padding:5px 10px;border:1px solid #444;border-radius:14px;background:#2b2b2b;color:#eee;" +
            "cursor:pointer;font-size:13px;transition:background .12s,transform .12s,border-color .12s;}" +
        "#recipeBookPanel .recipeChip:hover{background:#3a3a3a;border-color:#8aa57a;transform:translateY(-1px);}" +
        "#recipeBookPanel .recipeSwatch{display:inline-block;width:13px;height:13px;border-radius:3px;" +
            "border:1px solid #000;flex:0 0 auto;}" +
        "#recipeBookPanel .recipeBadge{font-size:10px;background:#557a3d;color:#eafce0;border-radius:8px;" +
            "padding:1px 6px;margin-left:2px;}" +
        "#recipeBookPanel .recipeSection{margin:14px 0 5px;font-size:11px;letter-spacing:.08em;" +
            "text-transform:uppercase;opacity:.55;border-bottom:1px solid #3a3a3a;padding-bottom:4px;}" +
        "#recipeBookPanel .recipeNav{background:#333;border:1px solid #555;color:#eee;border-radius:6px;" +
            "padding:4px 10px;cursor:pointer;font-size:13px;}" +
        "#recipeBookPanel .recipeNav:hover{background:#454545;}" +
        "#recipeBookPanel #recipeSearch{width:100%;box-sizing:border-box;margin:8px 0 2px;padding:7px 10px;" +
            "border:1px solid #555;border-radius:8px;background:#2b2b2b;color:#eee;font-size:14px;outline:none;}" +
        "#recipeBookPanel #recipeSearch:focus{border-color:#8aa57a;}" +
        "#recipeBookPanel #recipeSearch::placeholder{color:#888;}" +
        "#recipeBookPanel .recipeCrumbs{display:flex;flex-wrap:wrap;align-items:center;gap:1px;margin:6px 0 2px;}" +
        "#recipeBookPanel .recipeCrumb{background:none;border:none;color:#8fd0c8;cursor:pointer;font-size:12px;" +
            "padding:2px 4px;border-radius:4px;}" +
        "#recipeBookPanel .recipeCrumb:hover{background:#333;text-decoration:underline;}" +
        "#recipeBookPanel .recipeCrumb.current{color:#eee;font-weight:bold;cursor:default;text-decoration:none;}" +
        "#recipeBookPanel .recipeCrumbSep{opacity:.4;font-size:12px;}";
    document.head.appendChild(s);
}

function ensureRecipePanel() {
    var panel = document.getElementById("recipeBookPanel");
    if (panel) { return panel; }
    ensureRecipeStyle();
    panel = document.createElement("div");
    panel.id = "recipeBookPanel";
    panel.style.cssText =
        "position:fixed;top:7%;left:50%;transform:translateX(-50%);" +
        "width:min(94vw,560px);max-height:80vh;overflow:auto;" +
        "background:#1e1e1e;color:#eee;border:1px solid #555;border-radius:12px;" +
        "padding:16px;z-index:99999;font-family:sans-serif;font-size:14px;" +
        "box-shadow:0 12px 48px #000b;display:none;";
    panel.addEventListener("click", function(ev) {   // event delegation for chips/nav/crumbs
        var t = ev.target;
        while (t && t !== panel && !t.dataset.relem && !t.dataset.rnav && t.dataset.rcrumb === undefined && !t.dataset.rplace) { t = t.parentNode; }
        if (!t || t === panel) { return; }
        if (t.dataset.relem)                     { recipeNavTo(t.dataset.relem); }
        else if (t.dataset.rcrumb !== undefined) {
            var idx = parseInt(t.dataset.rcrumb, 10);
            recipeTrail = recipeTrail.slice(0, idx + 1);
            showRecipeDetail(recipeTrail[idx]);
        }
        else if (t.dataset.rplace)               { selectElement(t.dataset.rplace); closeRecipeBook(); } // pick it to draw
        else if (t.dataset.rnav === "index")     { showRecipeIndex(); }
        else if (t.dataset.rnav === "close")     { closeRecipeBook(); }
    });
    document.body.appendChild(panel);
    return panel;
}
function openRecipeBook() { ensureRecipePanel().style.display = "block"; showRecipeIndex(); }
function closeRecipeBook() {
    var p = document.getElementById("recipeBookPanel");
    if (p) { p.style.display = "none"; }
}
var recipeTrail = [];   // breadcrumb path of visited items

function recipeHeader() {
    return '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'border-bottom:1px solid #3a3a3a;padding-bottom:10px;margin-bottom:6px;">' +
        '<b style="font-size:18px;">Recipe Book</b>' +
        '<button class="recipeNav" data-rnav="close">&#10005;</button></div>';
}
function recipeBreadcrumb() {
    var h = '<div class="recipeCrumbs"><button class="recipeCrumb" data-rnav="index">All foods</button>';
    for (var i = 0; i < recipeTrail.length; i++) {
        var last = (i === recipeTrail.length - 1);
        h += '<span class="recipeCrumbSep">&rsaquo;</span>';
        h += '<button class="recipeCrumb' + (last ? ' current' : '') + '" data-rcrumb="' + i + '">' +
            recipeName(recipeTrail[i]) + '</button>';
    }
    return h + '</div>';
}
function recipeNavTo(e) { recipeTrail.push(e); showRecipeDetail(e); }

function renderRecipeList(filter) {
    var container = document.getElementById("recipeResults");
    if (!container) { return; }
    filter = (filter || "").toLowerCase();
    var groups = { "Ingredients": [], "Prepared": [] };
    var list = recipeFoodList();
    for (var i = 0; i < list.length; i++) {
        if (filter && recipeName(list[i]).toLowerCase().indexOf(filter) === -1) { continue; }
        if (elements[list[i]].category === "prepared") { groups["Prepared"].push(list[i]); }
        else { groups["Ingredients"].push(list[i]); }
    }
    var html = "", any = false;
    ["Ingredients", "Prepared"].forEach(function(g) {
        if (!groups[g].length) { return; }
        any = true;
        html += '<div class="recipeSection">' + g + ' (' + groups[g].length + ')</div><div>';
        for (var i = 0; i < groups[g].length; i++) { html += recipeChip(groups[g][i]); }
        html += '</div>';
    });
    if (!any) { html = '<div style="opacity:.6;margin-top:14px;">No foods match that search.</div>'; }
    container.innerHTML = html;
}

function showRecipeIndex() {
    recipeTrail = [];
    var panel = ensureRecipePanel();
    panel.innerHTML = recipeHeader() +
        '<input id="recipeSearch" type="text" placeholder="Search foods...">' +
        '<div id="recipeResults"></div>';
    var search = document.getElementById("recipeSearch");
    search.addEventListener("input", function() { renderRecipeList(this.value); });
    search.addEventListener("keydown", function(ev) { ev.stopPropagation(); }); // don't trigger game keybinds
    renderRecipeList("");
    search.focus();
}
function showRecipeDetail(e) {
    var panel = ensureRecipePanel();
    var html = recipeHeader() + recipeBreadcrumb();
    html += '<div style="display:flex;align-items:center;gap:10px;margin:10px 0 2px;">' +
        '<span class="recipeSwatch" style="width:28px;height:28px;border-radius:7px;background:' + recipeColor(e) + '"></span>' +
        '<span style="font-size:20px;font-weight:bold;">' + recipeName(e) + '</span></div>';
    html += '<button class="recipeNav" data-rplace="' + e + '" style="margin:4px 0 2px;">+ Place on canvas</button>';

    var r = cookingRecipes[e];
    html += '<div class="recipeSection">How to make it</div>';
    if (r) {
        if (r.note) { html += '<div style="opacity:.85;margin:2px 0 6px;font-size:13px;">' + r.note + '</div>'; }
        var sep = r.any ? '<span style="opacity:.5;margin:0 4px;">or</span>'   // any one of these
                        : '<span style="opacity:.5;margin:0 3px;">+</span>';   // all combined
        html += '<div>' + r.from.map(recipeChip).join(sep) + '</div>';
    } else {
        html += '<div style="opacity:.7;font-size:13px;">Base ingredient — grab it from the menu.</div>';
    }

    var uses = recipeUses(e);
    if (uses.length) {
        html += '<div class="recipeSection">Use it to make</div><div>' + uses.map(recipeChip).join('') + '</div>';
    }
    panel.innerHTML = html;
}

// Add the "Recipes" button to the bottom control row (next to Reset/Saves/etc.)
(function() {
    var anchor = document.getElementById("settingsButton");
    if (anchor && !document.getElementById("recipesButton")) {
        var btn = document.createElement("button");
        btn.id = "recipesButton";
        btn.className = "controlButton";
        btn.title = "Open the recipe book";
        btn.innerText = "Recipes";
        btn.onclick = function() {
            var p = document.getElementById("recipeBookPanel");
            if (p && p.style.display === "block") { closeRecipeBook(); }
            else { openRecipeBook(); }
        };
        anchor.parentNode.appendChild(btn);
    }
}());

// ====== TRIM THE MENU TO A COOKING GAME ======
// Removes the default sandboxels categories you don't want (and their elements)
// from the element picker, leaving your cooking / prepared / machines tabs.
// The base elements still EXIST behind the scenes (so flour + water -> Dough keeps
// working) -- they're just hidden from the menu. `water` is moved into the Cooking
// tab so the bread recipe stays usable.
var cookingHideCategories = ["land","liquids","life","powders","energy","weapons","gases","food","special"];
var cookingKeepMachines  = ["wire", "Flip_switch", "Toaster", "Oven"];   // everything else in Machines is hidden
function cookingTrimMenu() {
    // keep water reachable (bread needs it): move its button into the Cooking tab
    var waterBtn = document.getElementById("elementButton-water");
    var cookingDiv = document.getElementById("category-cooking");
    if (waterBtn && cookingDiv) { cookingDiv.appendChild(waterBtn); }
    // delete each unwanted category tab + its element container
    for (var i = 0; i < cookingHideCategories.length; i++) {
        var cat = cookingHideCategories[i];
        var tab = document.getElementById("categoryButton-" + cat);
        var div = document.getElementById("category-" + cat);
        if (tab) { tab.remove(); }
        if (div) { div.remove(); }
    }
    // trim the Machines tab down to just wire + our own machines (hide the rest)
    var machinesDiv = document.getElementById("category-machines");
    if (machinesDiv) {
        var mkids = Array.prototype.slice.call(machinesDiv.children);
        for (var m = 0; m < mkids.length; m++) {
            if (cookingKeepMachines.indexOf(mkids[m].getAttribute("element")) === -1) { mkids[m].remove(); }
        }
    }
    // select the Cooking tab (or the first remaining one) so the picker isn't blank
    var cookTab = document.getElementById("categoryButton-cooking");
    if (cookTab) { cookTab.click(); }
    else {
        var firstTab = document.querySelector("#categoryControls .categoryButton");
        if (firstTab) { firstTab.click(); }
    }
}
setTimeout(cookingTrimMenu, 300);                                            // after the menu builds
if (typeof runAfterReset === "function") { runAfterReset(cookingTrimMenu); } // re-apply on reset
