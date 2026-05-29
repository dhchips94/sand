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

// Egg: if it fell from EGG_CRACK_HEIGHT+ pixels up, it cracks into Yolk + Egg_white.
var EGG_CRACK_HEIGHT = 11;
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
// flour + water -> Dough  (start of the bread recipe)
elements.Plain_flour = {
    color: "#d4d4d4", category: "cooking",
    state: "solid", behavior: behaviors.POWDER, density: 600,
    reactions: {
        "water": { elem1: "Dough", elem2: null, chance: 0.1 }
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
        "Yeast": { elem1: "Yeasty_dough", elem2: null, chance: 0.05 }
    }
}
elements.Yeasty_dough = {
    color: "#e0d2a8", category: "prepared",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, density: 700,
    reactions: {
        "Sugar": { elem1: "Bread", elem2: null, chance: 0.05 }
    }
}
elements.Bread = {
    color: "#c89b5a", category: "prepared",
    state: "solid", behavior: behaviors.SUPPORTPOWDER, tick: clumpFall, density: 400
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

// ====== RECIPE BOOK ======
// Adds a "Recipes" button to the bottom control row (next to Reset/Saves/Elem).
// It opens a browser of every food item: how to make it, and what it makes.
// Click any item to jump to its recipe, and so on.

// Recipe data: result element -> { from:[ingredients], note: optional method }
var cookingRecipes = {
    "Dough":        { from: ["Plain_flour", "water"] },
    "Yeasty_dough": { from: ["Dough", "Yeast"] },
    "Bread":        { from: ["Yeasty_dough", "Sugar"] },
    "Yolk":         { from: ["Egg"], note: "Crack an Egg by dropping it " + EGG_CRACK_HEIGHT + "+ pixels." },
    "Egg_white":    { from: ["Egg"], note: "Crack an Egg by dropping it " + EGG_CRACK_HEIGHT + "+ pixels." }
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
        "#recipeBookPanel .recipeNav:hover{background:#454545;}";
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
    panel.addEventListener("click", function(ev) {   // event delegation for chips/nav
        var t = ev.target;
        while (t && t !== panel && !t.dataset.relem && !t.dataset.rnav) { t = t.parentNode; }
        if (!t || t === panel) { return; }
        if (t.dataset.relem)            { showRecipeDetail(t.dataset.relem); }
        else if (t.dataset.rnav === "index") { showRecipeIndex(); }
        else if (t.dataset.rnav === "close") { closeRecipeBook(); }
    });
    document.body.appendChild(panel);
    return panel;
}
function openRecipeBook() { ensureRecipePanel().style.display = "block"; showRecipeIndex(); }
function closeRecipeBook() {
    var p = document.getElementById("recipeBookPanel");
    if (p) { p.style.display = "none"; }
}
function recipeHeader(withBack) {
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'border-bottom:1px solid #3a3a3a;padding-bottom:10px;margin-bottom:4px;">';
    h += '<b style="font-size:18px;">Recipe Book</b><span style="display:flex;gap:6px;">';
    if (withBack) { h += '<button class="recipeNav" data-rnav="index">&larr; All foods</button>'; }
    h += '<button class="recipeNav" data-rnav="close">&#10005;</button></span></div>';
    return h;
}
function showRecipeIndex() {
    var panel = ensureRecipePanel();
    var html = recipeHeader(false);
    html += '<div style="opacity:.7;margin:4px 0 2px;font-size:13px;">Tap a food to see how it\'s made and what it makes.</div>';
    var groups = { "Ingredients": [], "Prepared": [] };
    var list = recipeFoodList();
    for (var i = 0; i < list.length; i++) {
        if (elements[list[i]].category === "prepared") { groups["Prepared"].push(list[i]); }
        else { groups["Ingredients"].push(list[i]); }
    }
    ["Ingredients", "Prepared"].forEach(function(g) {
        if (!groups[g].length) { return; }
        html += '<div class="recipeSection">' + g + ' (' + groups[g].length + ')</div><div>';
        for (var i = 0; i < groups[g].length; i++) { html += recipeChip(groups[g][i]); }
        html += '</div>';
    });
    panel.innerHTML = html;
}
function showRecipeDetail(e) {
    var panel = ensureRecipePanel();
    var html = recipeHeader(true);
    html += '<div style="display:flex;align-items:center;gap:10px;margin:12px 0 2px;">' +
        '<span class="recipeSwatch" style="width:28px;height:28px;border-radius:7px;background:' + recipeColor(e) + '"></span>' +
        '<span style="font-size:20px;font-weight:bold;">' + recipeName(e) + '</span></div>';

    var r = cookingRecipes[e];
    html += '<div class="recipeSection">How to make it</div>';
    if (r) {
        if (r.note) { html += '<div style="opacity:.85;margin:2px 0 6px;font-size:13px;">' + r.note + '</div>'; }
        html += '<div>' + r.from.map(recipeChip).join('<span style="opacity:.5;margin:0 3px;">+</span>') + '</div>';
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